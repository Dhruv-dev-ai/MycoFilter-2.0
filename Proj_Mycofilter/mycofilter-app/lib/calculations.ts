/**
 * MycoFilter 2.0 — Scientifically Correct Calculation Engine
 *
 * All calculations are centralised here and unit-tested separately.
 * No calculation logic lives in UI components.
 *
 * Sources referenced:
 *   - Nernst equation: IUPAC, standard electrochemistry texts
 *   - EC temperature compensation: standard practice (ASTM D1125)
 *   - CCME WQI: Canadian Council of Ministers of the Environment,
 *     "Canadian Water Quality Guidelines for the Protection of Aquatic Life:
 *      CCME Water Quality Index 1.0, User's Manual" (2001)
 *   - BIS IS 10500:2012 (drinking-water benchmarks, optional profile)
 */

import type {
  PhCalibrationProfile,
  TurbidityCalibrationProfile,
  ECCalibrationProfile,
  PHResult,
  TurbidityResult,
  ECResult,
  TDSResult,
  CCMEWQIInput,
  CCMEWQIResult,
  QualityFlag,
} from './types'

// ---------------------------------------------------------------------------
// Physical constants
// ---------------------------------------------------------------------------

/** Universal gas constant (J mol⁻¹ K⁻¹) */
export const R_JMOL = 8.31446261815324

/** Faraday constant (C mol⁻¹) */
export const F_COULOMBS = 96485.33212

/** Ideal Nernst slope magnitude at 25 °C in mV per pH unit */
export const NERNST_SLOPE_25C_MV = (2.303 * R_JMOL * 298.15 / F_COULOMBS) * 1000
// ≈ 59.16 mV/pH at 25 °C

// ---------------------------------------------------------------------------
// A. pH Calibration
// ---------------------------------------------------------------------------

/**
 * Compute the theoretical Nernst slope at a given temperature.
 * S(T) = 2.303 × R × T_K / F  [V/pH], converted to mV/pH
 *
 * Note: this adjusts the electrode's potential response; it does NOT
 * convert a sample's true pH to what it would have been at 25 °C.
 */
export function nernstSlopeMvPerPH(temperature_c: number): number {
  const T_K = temperature_c + 273.15
  return (2.303 * R_JMOL * T_K / F_COULOMBS) * 1000
}

/**
 * Linear two-point pH calibration.
 *
 * pH = pH1 + ((E - E1) / (E2 - E1)) × (pH2 - pH1)
 *
 * Returns null with an error note if calibration points are invalid
 * (same voltage, same pH, zero denominator).
 */
export function phLinearCalibration(
  pH1: number, E1_mV: number,
  pH2: number, E2_mV: number,
): { slope_mV_per_pH: number; offset_mV: number; error?: string } {
  const dE = E2_mV - E1_mV
  const dpH = pH2 - pH1

  if (Math.abs(dE) < 0.001) {
    return { slope_mV_per_pH: NaN, offset_mV: NaN, error: 'Zero voltage difference between calibration points' }
  }
  if (Math.abs(dpH) < 0.001) {
    return { slope_mV_per_pH: NaN, offset_mV: NaN, error: 'Zero pH difference between calibration points' }
  }

  // Slope: mV per pH unit (sign depends on electrode polarity — preserved here)
  const slope_mV_per_pH = dE / dpH
  // At pH1: E1 = slope × pH1 + offset → offset = E1 − slope × pH1
  const offset_mV = E1_mV - slope_mV_per_pH * pH1

  return { slope_mV_per_pH, offset_mV }
}

/**
 * Apply calibration to convert a raw electrode voltage to pH.
 *
 * pH = (E − offset) / slope
 */
export function calculatePH(
  voltage_mV: number,
  profile: PhCalibrationProfile,
): PHResult {
  if (profile.buffers.length < 2) {
    return {
      pH: null,
      slope_mV_per_pH: NaN,
      offset_mV: NaN,
      calibration_date: profile.created_at,
      temperature_c: null,
      quality: 'uncalibrated',
      note: 'At least 2 calibration buffer points required',
    }
  }

  const { slope_mV_per_pH, offset_mV } = profile

  if (!isFinite(slope_mV_per_pH) || Math.abs(slope_mV_per_pH) < 0.001) {
    return {
      pH: null,
      slope_mV_per_pH,
      offset_mV,
      calibration_date: profile.created_at,
      temperature_c: profile.temperature_c_at_calibration,
      quality: 'uncalibrated',
      note: 'Invalid calibration slope — recalibrate the electrode',
    }
  }

  const pH = (voltage_mV - offset_mV) / slope_mV_per_pH

  // Plausible range for most natural/wastewater applications
  const [min, max] = profile.valid_range_pH
  const quality: QualityFlag = (pH < min || pH > max) ? 'out_of_range' : 'valid'

  return {
    pH,
    slope_mV_per_pH,
    offset_mV,
    calibration_date: profile.created_at,
    temperature_c: profile.temperature_c_at_calibration,
    quality,
    note: quality === 'out_of_range'
      ? `pH ${pH.toFixed(2)} outside validated range [${min}, ${max}]`
      : undefined,
  }
}

// ---------------------------------------------------------------------------
// B. Turbidity
// ---------------------------------------------------------------------------

/**
 * Calculate NTU from an analogue optical probe using a polynomial model.
 *
 * NTU = coefficients[0]·V² + coefficients[1]·V + coefficients[2]   (quadratic)
 * NTU = coefficients[0]·V  + coefficients[1]                       (linear)
 *
 * The result is clearly labelled as an estimate unless the probe is a
 * factory-calibrated digital NTU device.
 */
export function calculateTurbidity(
  voltage_V: number | null,
  profile: TurbidityCalibrationProfile,
): TurbidityResult {
  if (profile.model === 'digital_ntu') {
    // Probe provides a calibrated NTU value directly — voltage_V IS the NTU
    const NTU = voltage_V
    const [min, max] = profile.valid_range_NTU
    const quality: QualityFlag = NTU === null
      ? 'sensor_error'
      : (NTU < min || NTU > max) ? 'out_of_range' : 'valid'
    return {
      NTU,
      is_estimate: false,
      model: 'digital_ntu',
      calibration_date: profile.created_at,
      valid_range: profile.valid_range_NTU,
      quality,
    }
  }

  if (voltage_V === null) {
    return {
      NTU: null,
      is_estimate: true,
      model: profile.model,
      calibration_date: profile.created_at,
      valid_range: profile.valid_range_NTU,
      quality: 'sensor_error',
      note: 'No voltage reading from optical sensor',
    }
  }

  const c = profile.coefficients
  let NTU: number
  if (profile.model === 'quadratic' && c.length >= 3) {
    NTU = c[0] * voltage_V * voltage_V + c[1] * voltage_V + c[2]
  } else if (c.length >= 2) {
    NTU = c[0] * voltage_V + c[1]
  } else {
    return {
      NTU: null,
      is_estimate: true,
      model: profile.model,
      calibration_date: profile.created_at,
      valid_range: profile.valid_range_NTU,
      quality: 'uncalibrated',
      note: 'Insufficient calibration coefficients',
    }
  }

  const [min, max] = profile.valid_range_NTU
  const outOfRange = NTU < min || NTU > max
  const quality: QualityFlag = outOfRange ? 'out_of_range' : 'estimated'

  return {
    NTU,
    is_estimate: true,
    model: profile.model,
    calibration_date: profile.created_at,
    valid_range: profile.valid_range_NTU,
    quality,
    note: outOfRange
      ? `Estimated NTU ${NTU.toFixed(1)} outside validated calibration range [${min}, ${max}]. Do not treat as validated.`
      : 'Estimated from optical probe — not validated factory-calibrated NTU',
  }
}

// ---------------------------------------------------------------------------
// C. Electrical Conductivity + Temperature Compensation
// ---------------------------------------------------------------------------

/**
 * Temperature-compensate EC to 25 °C.
 *
 * EC₂₅ = EC_T / (1 + α × (T_C − 25))
 *
 * where:
 *   EC_T = measured conductivity at sample temperature T_C (µS/cm)
 *   α    = temperature coefficient (°C⁻¹); default 0.021 is PROVISIONAL
 *   T_C  = water temperature (°C)
 *
 * Returns EC_measured unchanged (no compensation) when temperature is
 * unavailable, and flags accordingly.
 */
export function calculateEC(
  EC_measured_uS_cm: number | null,
  temperature_c: number | null,
  profile: ECCalibrationProfile,
): ECResult {
  if (EC_measured_uS_cm === null) {
    return {
      EC_measured_uS_cm: null,
      EC25_uS_cm: null,
      temperature_c,
      alpha_per_degC: profile.alpha_per_degC,
      compensation_applied: false,
      quality: 'sensor_error',
      note: 'No EC reading from sensor',
    }
  }

  // Reject negative EC
  if (EC_measured_uS_cm < 0) {
    return {
      EC_measured_uS_cm,
      EC25_uS_cm: null,
      temperature_c,
      alpha_per_degC: profile.alpha_per_degC,
      compensation_applied: false,
      quality: 'out_of_range',
      note: 'Negative EC reading — likely sensor fault',
    }
  }

  // If probe already applies compensation, do not compensate again
  if (profile.compensation_applied_by_probe) {
    return {
      EC_measured_uS_cm,
      EC25_uS_cm: EC_measured_uS_cm,
      temperature_c,
      alpha_per_degC: profile.alpha_per_degC,
      compensation_applied: false,
      quality: 'valid',
      note: 'Probe reports EC already compensated to 25 °C',
    }
  }

  if (temperature_c === null) {
    return {
      EC_measured_uS_cm,
      EC25_uS_cm: null,
      temperature_c: null,
      alpha_per_degC: profile.alpha_per_degC,
      compensation_applied: false,
      quality: 'valid',
      note: 'Temperature unavailable — EC25 not calculated; displaying raw EC',
    }
  }

  // Reject physically impossible temperatures
  if (temperature_c < -10 || temperature_c > 100) {
    return {
      EC_measured_uS_cm,
      EC25_uS_cm: null,
      temperature_c,
      alpha_per_degC: profile.alpha_per_degC,
      compensation_applied: false,
      quality: 'out_of_range',
      note: `Temperature ${temperature_c} °C outside plausible range`,
    }
  }

  const denominator = 1 + profile.alpha_per_degC * (temperature_c - 25)
  if (Math.abs(denominator) < 1e-9) {
    return {
      EC_measured_uS_cm,
      EC25_uS_cm: null,
      temperature_c,
      alpha_per_degC: profile.alpha_per_degC,
      compensation_applied: false,
      quality: 'out_of_range',
      note: 'Temperature compensation denominator near zero — invalid result',
    }
  }

  const EC25_uS_cm = EC_measured_uS_cm / denominator

  return {
    EC_measured_uS_cm,
    EC25_uS_cm,
    temperature_c,
    alpha_per_degC: profile.alpha_per_degC,
    compensation_applied: true,
    quality: 'valid',
  }
}

// ---------------------------------------------------------------------------
// D. Total Dissolved Solids (estimated)
// ---------------------------------------------------------------------------

/** Default provisional TDS conversion factor — must be validated for actual water */
export const TDS_K_PROVISIONAL = 0.54

/**
 * Estimate TDS from EC₂₅.
 *
 * TDS_est (mg/L) = EC₂₅ (µS/cm) × k
 *
 * This is an empirical approximation. The conversion factor k depends on
 * ionic composition and must be validated for the actual water type.
 * Do NOT report this as laboratory-measured TDS.
 */
export function calculateTDS(
  EC_result: ECResult,
  k_factor: number = TDS_K_PROVISIONAL,
): TDSResult {
  if (EC_result.EC25_uS_cm === null) {
    return {
      TDS_est_mg_L: null,
      EC25_uS_cm: null,
      k_factor,
      is_estimate: true,
      note: 'EC₂₅ unavailable — TDS cannot be estimated',
      quality: EC_result.quality,
    }
  }

  const TDS_est_mg_L = EC_result.EC25_uS_cm * k_factor

  return {
    TDS_est_mg_L,
    EC25_uS_cm: EC_result.EC25_uS_cm,
    k_factor,
    is_estimate: true,
    note: `Estimated from EC₂₅ × k (k = ${k_factor} — provisional, unvalidated for this water). Not equivalent to laboratory TDS.`,
    quality: 'estimated',
  }
}

// ---------------------------------------------------------------------------
// E. Treatment performance (removal)
// ---------------------------------------------------------------------------

/**
 * Calculate percentage reduction between influent and effluent for a
 * compatible, positive concentration-type parameter.
 *
 * Returns null with explanation when:
 *   - Either value is null or invalid
 *   - Influent is zero (division by zero)
 *   - Parameters are not comparable
 *
 * Note: a negative result (increase after filtration) is returned as-is.
 * pH reduction is NOT calculated here — use pH_shift instead.
 */
export function calculateReduction(
  influent: number | null,
  effluent: number | null,
  parameter: string,
): { reduction_percent: number | null; explanation: string } {
  if (influent === null || effluent === null) {
    return { reduction_percent: null, explanation: `${parameter}: influent or effluent reading unavailable` }
  }
  if (influent === 0) {
    return { reduction_percent: null, explanation: `${parameter}: influent is zero — percentage reduction undefined` }
  }
  if (influent < 0 || effluent < 0) {
    return { reduction_percent: null, explanation: `${parameter}: negative readings — comparison not meaningful` }
  }

  const reduction_percent = ((influent - effluent) / influent) * 100
  const direction = reduction_percent >= 0 ? 'reduction' : 'increase'
  return {
    reduction_percent,
    explanation: `${parameter}: ${Math.abs(reduction_percent).toFixed(1)} % ${direction} from ${influent} → ${effluent}`,
  }
}

export interface LinearCalibration {
  slope: number
  intercept: number
}

/** Convert absorbance to an illustrative LAS concentration: C = (A - b) / m. */
export function calculateLASConcentration(
  absorbance: number | null,
  calibration: LinearCalibration,
): number | null {
  if (absorbance === null || !Number.isFinite(absorbance) || !Number.isFinite(calibration.slope) || calibration.slope === 0) {
    return null
  }
  const concentration = (absorbance - calibration.intercept) / calibration.slope
  return Number.isFinite(concentration) && concentration >= 0 ? concentration : null
}

/** Calculate LAS removal only when both simulated concentrations are valid. */
export function calculateLASRemoval(
  influent: number | null,
  effluent: number | null,
): number | null {
  if (influent === null || effluent === null || !Number.isFinite(influent) || !Number.isFinite(effluent) || influent <= 0) {
    return null
  }
  return ((influent - effluent) / influent) * 100
}

/** pH shift (not a pollutant-removal percentage) */
export function calculatePHShift(
  pH_influent: number | null,
  pH_effluent: number | null,
): { shift: number | null; explanation: string } {
  if (pH_influent === null || pH_effluent === null) {
    return { shift: null, explanation: 'pH shift unavailable — both influent and effluent pH required' }
  }
  const shift = pH_effluent - pH_influent
  return {
    shift,
    explanation: `pH shift: ${pH_influent.toFixed(2)} → ${pH_effluent.toFixed(2)} (Δ = ${shift.toFixed(2)} pH units). Not a pollutant-removal percentage.`,
  }
}

// ---------------------------------------------------------------------------
// F. CCME Water Quality Index
// ---------------------------------------------------------------------------

/**
 * CCME WQI implementation following the official CCME User's Manual (2001).
 *
 * WQI = 100 − √(F1² + F2² + F3²) / 1.732
 *
 * F1 (Scope)     = percentage of parameters failing at least once
 * F2 (Frequency) = percentage of tests failing objectives
 * F3 (Amplitude) = magnitude of exceedances
 *
 * Higher WQI = better quality:
 *   95–100: Excellent  |  80–94: Good  |  65–79: Fair
 *   45–64: Marginal    |  0–44: Poor
 *
 * This implementation requires:
 *   - ≥1 parameter with a configured objective
 *   - ≥1 valid observation per parameter
 *   - A designated assessment purpose and reference period
 */
export function calculateCCMEWQI(
  inputs: CCMEWQIInput[],
  reference_period: [string, string],
  objective_profile: string,
  min_observations_per_param: number = 1,
): CCMEWQIResult {
  const base: Omit<CCMEWQIResult, 'WQI' | 'F1_scope' | 'F2_frequency' | 'F3_amplitude' | 'category'> = {
    parameters_included: [],
    parameters_failed: [],
    n_tests: 0,
    n_failed: 0,
    reference_period,
    objective_profile,
    insufficient_data: false,
    explanation: '',
  }

  // Filter to valid parameters with objectives and sufficient data
  const valid_inputs = inputs.filter(inp => {
    const valid_obs = inp.observations.filter(o => o.quality === 'valid' || o.quality === 'estimated')
    return valid_obs.length >= min_observations_per_param &&
           (inp.objective_min !== undefined || inp.objective_max !== undefined)
  })

  if (valid_inputs.length === 0) {
    return {
      ...base,
      WQI: null,
      F1_scope: null,
      F2_frequency: null,
      F3_amplitude: null,
      category: null,
      insufficient_data: true,
      explanation: 'Insufficient data or no configured objectives. CCME WQI requires at least one parameter with a defined guideline objective and at least one valid observation.',
    }
  }

  let n_params_failed = 0
  let n_total_tests = 0
  let n_failed_tests = 0
  const nse_values: number[] = []   // normalised sum of exceedances for F3

  const params_included: string[] = []
  const params_failed: string[] = []

  for (const inp of valid_inputs) {
    params_included.push(inp.parameter)
    const valid_obs = inp.observations.filter(o => o.quality === 'valid' || o.quality === 'estimated')
    let param_failed_at_least_once = false

    for (const obs of valid_obs) {
      n_total_tests++
      let failed = false
      let exceedance = 0

      if (inp.objective_max !== undefined && obs.value > inp.objective_max) {
        failed = true
        exceedance = (obs.value - inp.objective_max) / inp.objective_max
      }
      if (inp.objective_min !== undefined && obs.value < inp.objective_min) {
        failed = true
        exceedance = (inp.objective_min - obs.value) / inp.objective_min
      }

      if (failed) {
        n_failed_tests++
        param_failed_at_least_once = true
        nse_values.push(exceedance)
      }
    }

    if (param_failed_at_least_once) {
      n_params_failed++
      params_failed.push(inp.parameter)
    }
  }

  const F1 = (n_params_failed / valid_inputs.length) * 100
  const F2 = n_total_tests > 0 ? (n_failed_tests / n_total_tests) * 100 : 0

  // F3: normalised sum of exceedances (nse) approach
  let F3 = 0
  if (nse_values.length > 0) {
    const nse = nse_values.reduce((a, b) => a + b, 0)
    const nse_over_n = nse / n_total_tests
    // F3 = nse/(0.01 × nse + 0.01) — CCME formula section 6.3
    F3 = (nse_over_n / (0.01 * nse_over_n + 0.01))
  }

  const WQI = Math.max(0, Math.min(100, 100 - (Math.sqrt(F1 * F1 + F2 * F2 + F3 * F3) / 1.732)))

  let category: CCMEWQIResult['category']
  if (WQI >= 95) category = 'Excellent'
  else if (WQI >= 80) category = 'Good'
  else if (WQI >= 65) category = 'Fair'
  else if (WQI >= 45) category = 'Marginal'
  else category = 'Poor'

  return {
    WQI: Math.round(WQI * 10) / 10,
    F1_scope: Math.round(F1 * 10) / 10,
    F2_frequency: Math.round(F2 * 10) / 10,
    F3_amplitude: Math.round(F3 * 10) / 10,
    category,
    parameters_included: params_included,
    parameters_failed: params_failed,
    n_tests: n_total_tests,
    n_failed: n_failed_tests,
    reference_period,
    objective_profile,
    insufficient_data: false,
    explanation: `CCME WQI calculated for ${params_included.length} parameter(s) over ${n_total_tests} test(s). `
      + `F1=${F1.toFixed(1)}% F2=${F2.toFixed(1)}% F3=${F3.toFixed(2)}. `
      + `Result applies to selected parameters only — not a complete water-quality certification.`,
  }
}

// ---------------------------------------------------------------------------
// G. Data quality helpers
// ---------------------------------------------------------------------------

export const STALE_THRESHOLD_MS = (intervals: number, interval_s: number) =>
  intervals * interval_s * 1000

export function isStale(last_seen_at: string | null, stale_after_ms: number): boolean {
  if (!last_seen_at) return true
  return Date.now() - new Date(last_seen_at).getTime() > stale_after_ms
}

export function formatTimestamp(iso: string | null, tz?: string): string {
  if (!iso) return 'Never'
  try {
    return new Date(iso).toLocaleString(undefined, {
      timeZone: tz,
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  } catch {
    return iso
  }
}

export function timeSince(iso: string | null): string {
  if (!iso) return '—'
  const delta_s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (delta_s < 60)  return `${delta_s}s ago`
  if (delta_s < 3600) return `${Math.floor(delta_s / 60)}m ago`
  if (delta_s < 86400) return `${Math.floor(delta_s / 3600)}h ago`
  return `${Math.floor(delta_s / 86400)}d ago`
}
