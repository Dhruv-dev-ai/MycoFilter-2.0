/**
 * Demo data engine — simulates realistic Rev B sensor readings.
 *
 * This module is completely separate from the hardware telemetry pipeline.
 * Every value is clearly labelled source_mode: 'simulated'.
 * No simulated value is ever presented as a live hardware reading.
 *
 * Research context: laundry greywater with LAS surfactant.
 * Phanerochaete chrysosporium BKM-F-1767 (proposed, not confirmed installed).
 */

import type {
  TelemetryEvent,
  Device,
  SensorConfig,
  Alert,
  MaintenanceEvent,
} from './types'
import { calculateLASConcentration } from './calculations'

// Illustrative demo coefficients only; replace with experimentally validated calibration data.
export const LAS_DEMO_CALIBRATION = { slope: 0.05, intercept: 0.1 }

// ---------------------------------------------------------------------------
// Demo device configuration (Rev B base build)
// ---------------------------------------------------------------------------

export const DEMO_SENSOR_CONFIGS: SensorConfig[] = [
  {
    tag: 'S1', measurand: 'pH', station: 'influent',
    label: 'Influent pH (S1)',
    unit: 'pH', raw_unit: 'mV',
    commissioning_status: 'proposed_cad',
    port: 'Top cap, M16×1.5, Ø12 placeholder',
    placeholder_note: 'Probe model undecided. Requires high-impedance pH AFE.',
  },
  {
    tag: 'S2', measurand: 'turbidity', station: 'influent',
    label: 'Influent Turbidity (S2)',
    unit: 'NTU', raw_unit: 'V',
    commissioning_status: 'proposed_cad',
    port: 'Top cap, M16×1.5, Ø12 placeholder',
    placeholder_note: 'Probe model undecided.',
  },
  {
    tag: 'S3', measurand: 'conductivity', station: 'influent',
    label: 'Influent EC (S3)',
    unit: 'µS/cm',
    commissioning_status: 'proposed_cad',
    port: 'Top cap, M16×1.5, Ø12 placeholder',
    placeholder_note: 'Probe model undecided. Requires EC excitation circuit.',
  },
  {
    tag: 'T_in', measurand: 'temperature', station: 'influent',
    label: 'Influent Temperature (T-in)',
    unit: '°C',
    commissioning_status: 'proposed_cad',
    port: 'Top cap −Y, M16×1.5 reducing gland, Ø6 sheath placeholder',
    placeholder_note: 'Temperature probe TBD. Range 0–50 °C assumed.',
  },
  {
    tag: 'S4', measurand: 'ISE_target', station: 'influent',
    label: 'Influent Target ISE (S4)',
    unit: 'mg/L',
    commissioning_status: 'installed_calibrated',
    secondary_label: 'Primary research target: LAS',
    method_label: 'Colourimetric Photometric Analysis',
    port: 'Demo channel — no physical sensor connected',
  },
  {
    tag: 'E1', measurand: 'pH', station: 'effluent',
    label: 'Effluent pH (E1)',
    unit: 'pH', raw_unit: 'mV',
    commissioning_status: 'proposed_cad',
    port: 'Effluent cell x=88mm, M16×1.5',
    placeholder_note: 'Same probe model as S1 (TBD).',
  },
  {
    tag: 'E2', measurand: 'turbidity', station: 'effluent',
    label: 'Effluent Turbidity (E2)',
    unit: 'NTU', raw_unit: 'V',
    commissioning_status: 'proposed_cad',
    port: 'Effluent cell x=110mm, M16×1.5',
    placeholder_note: 'Same probe model as S2 (TBD).',
  },
  {
    tag: 'E3', measurand: 'conductivity', station: 'effluent',
    label: 'Effluent EC (E3)',
    unit: 'µS/cm',
    commissioning_status: 'proposed_cad',
    port: 'Effluent cell x=132mm, M16×1.5',
    placeholder_note: 'Same probe model as S3 (TBD).',
  },
  {
    tag: 'E5', measurand: 'temperature', station: 'effluent',
    label: 'Effluent Temperature (T-eff)', display_tag: 'T_eff',
    unit: '°C',
    commissioning_status: 'proposed_cad',
    port: 'Effluent cell x=154mm, M16×1.5 reducing gland, Ø6 sheath',
    placeholder_note: 'Same probe model as T-in (TBD).',
  },
  {
    tag: 'E4', measurand: 'ISE_target', station: 'effluent',
    label: 'Effluent Target ISE (E4)',
    unit: 'mg/L',
    commissioning_status: 'installed_calibrated',
    secondary_label: 'Primary research target: LAS',
    method_label: 'Colourimetric Photometric Analysis',
    port: 'Demo channel — no physical sensor connected',
  },
]

export const DEMO_DEVICE: Device = {
  id: 'MF-001-DEMO',
  name: 'MycoFilter 2.0 — Demo Unit',
  location_description: 'Laboratory bench — simulated data only',
  installed_at: '2026-08-01T00:00:00Z',
  commissioned_at: null,
  connectivity_method: 'simulated',
  reporting_interval_s: 30,
  firmware_version: 'demo-v1.0',
  last_telemetry_at: null,
  is_demo: true,
  sensor_configs: DEMO_SENSOR_CONFIGS,
}

// ---------------------------------------------------------------------------
// Realistic laundry greywater simulation ranges
// ---------------------------------------------------------------------------

// Laundry greywater is typically high-turbidity, high-EC, moderately alkaline
const INFLUENT_RANGES = {
  pH:          { base: 9.2,   noise: 0.4,  min: 7.5,  max: 11.5 },  // alkaline greywater
  turbidity:   { base: 85.0,  noise: 20.0, min: 0,    max: 300 },
  EC_uS_cm:    { base: 850.0, noise: 80.0, min: 0,    max: 3000 },
  temperature: { base: 35.0,  noise: 3.0,  min: 10,   max: 50 },
}

// After fungal/biochar/support filtration — research expectation, NOT claimed performance
const EFFLUENT_RANGES = {
  pH:          { base: 7.8,   noise: 0.3,  min: 6,    max: 10 },
  turbidity:   { base: 18.0,  noise: 8.0,  min: 0,    max: 100 },
  EC_uS_cm:    { base: 680.0, noise: 60.0, min: 0,    max: 2000 },
  temperature: { base: 34.5,  noise: 2.0,  min: 10,   max: 50 },
}

const LAS_ABSORBANCE = {
  influent: { base: 1.33, noise: 0.05 },
  effluent: { base: 0.51, noise: 0.03 },
}

let _seq = 1

function jitter(base: number, noise: number, min: number, max: number): number {
  const v = base + (Math.random() - 0.5) * 2 * noise
  return Math.max(min, Math.min(max, Math.round(v * 100) / 100))
}

function makeEvent(
  device_id: string,
  sensor_id: string,
  station: 'influent' | 'effluent',
  measurand: string,
  value: number,
  unit: string,
): TelemetryEvent {
  const now = new Date().toISOString()
  return {
    device_id,
    sensor_id,
    measurement_point: station,
    raw_value: value,
    raw_unit: unit,
    calibrated_value: value,
    unit,
    water_temperature_c: null,
    observed_at: now,
    received_at: now,
    sequence_number: _seq++,
    calibration_version: 'demo-simulated',
    quality_flag: 'estimated',
    source_mode: 'simulated',
    firmware_version: 'demo-v1.0',
  }
}

export function generateSimulatedReadings(device_id: string): TelemetryEvent[] {
  const ir = INFLUENT_RANGES
  const er = EFFLUENT_RANGES
  const influentLAS = calculateLASConcentration(
    jitter(LAS_ABSORBANCE.influent.base, LAS_ABSORBANCE.influent.noise, 0, 3),
    LAS_DEMO_CALIBRATION,
  )
  const effluentLAS = calculateLASConcentration(
    jitter(LAS_ABSORBANCE.effluent.base, LAS_ABSORBANCE.effluent.noise, 0, 3),
    LAS_DEMO_CALIBRATION,
  )

  return [
    makeEvent(device_id, 'S1', 'influent',  'pH',          jitter(ir.pH.base,          ir.pH.noise,          ir.pH.min,          ir.pH.max),          'pH'),
    makeEvent(device_id, 'S2', 'influent',  'turbidity',   jitter(ir.turbidity.base,   ir.turbidity.noise,   ir.turbidity.min,   ir.turbidity.max),   'NTU'),
    makeEvent(device_id, 'S3', 'influent',  'conductivity',jitter(ir.EC_uS_cm.base,    ir.EC_uS_cm.noise,    ir.EC_uS_cm.min,    ir.EC_uS_cm.max),    'µS/cm'),
    makeEvent(device_id, 'T_in','influent', 'temperature', jitter(ir.temperature.base,  ir.temperature.noise, ir.temperature.min,  ir.temperature.max), '°C'),
    makeEvent(device_id, 'S4', 'influent',  'ISE_target',   influentLAS ?? 0, 'mg/L'),
    makeEvent(device_id, 'E1', 'effluent',  'pH',          jitter(er.pH.base,          er.pH.noise,          er.pH.min,          er.pH.max),          'pH'),
    makeEvent(device_id, 'E2', 'effluent',  'turbidity',   jitter(er.turbidity.base,   er.turbidity.noise,   er.turbidity.min,   er.turbidity.max),   'NTU'),
    makeEvent(device_id, 'E3', 'effluent',  'conductivity',jitter(er.EC_uS_cm.base,    er.EC_uS_cm.noise,    er.EC_uS_cm.min,    er.EC_uS_cm.max),    'µS/cm'),
    makeEvent(device_id, 'E5', 'effluent',  'temperature', jitter(er.temperature.base,  er.temperature.noise, er.temperature.min,  er.temperature.max), '°C'),
    makeEvent(device_id, 'E4', 'effluent', 'ISE_target',   effluentLAS ?? 0, 'mg/L'),
  ]
}

// ---------------------------------------------------------------------------
// Historical data generator
// ---------------------------------------------------------------------------

export function generateHistoricalData(
  device_id: string,
  hours: number = 24,
  interval_minutes: number = 10,
): TelemetryEvent[] {
  const events: TelemetryEvent[] = []
  const now = Date.now()
  const total_points = Math.floor((hours * 60) / interval_minutes)

  for (let i = total_points; i >= 0; i--) {
    const t = new Date(now - i * interval_minutes * 60 * 1000).toISOString()
    const ir = INFLUENT_RANGES
    const er = EFFLUENT_RANGES

    const addEvent = (sid: string, station: 'influent' | 'effluent', measurand: string, val: number, unit: string) => {
      events.push({
        device_id,
        sensor_id: sid,
        measurement_point: station,
        raw_value: val,
        raw_unit: unit,
        calibrated_value: val,
        unit,
        water_temperature_c: null,
        observed_at: t,
        received_at: t,
        sequence_number: _seq++,
        calibration_version: 'demo-simulated',
        quality_flag: 'estimated',
        source_mode: 'simulated',
      })
    }

    addEvent('S1',   'influent', 'pH',           jitter(ir.pH.base,          ir.pH.noise,          ir.pH.min,          ir.pH.max),          'pH')
    addEvent('S2',   'influent', 'turbidity',    jitter(ir.turbidity.base,   ir.turbidity.noise,   ir.turbidity.min,   ir.turbidity.max),   'NTU')
    addEvent('S3',   'influent', 'conductivity', jitter(ir.EC_uS_cm.base,    ir.EC_uS_cm.noise,    ir.EC_uS_cm.min,    ir.EC_uS_cm.max),    'µS/cm')
    addEvent('T_in', 'influent', 'temperature',  jitter(ir.temperature.base,  ir.temperature.noise, ir.temperature.min,  ir.temperature.max), '°C')
    addEvent('E1',   'effluent', 'pH',           jitter(er.pH.base,          er.pH.noise,          er.pH.min,          er.pH.max),          'pH')
    addEvent('E2',   'effluent', 'turbidity',    jitter(er.turbidity.base,   er.turbidity.noise,   er.turbidity.min,   er.turbidity.max),   'NTU')
    addEvent('E3',   'effluent', 'conductivity', jitter(er.EC_uS_cm.base,    er.EC_uS_cm.noise,    er.EC_uS_cm.min,    er.EC_uS_cm.max),    'µS/cm')
    addEvent('E5',   'effluent', 'temperature',  jitter(er.temperature.base,  er.temperature.noise, er.temperature.min,  er.temperature.max), '°C')
  }
  return events
}

// ---------------------------------------------------------------------------
// Demo alerts
// ---------------------------------------------------------------------------

export const DEMO_ALERTS: Alert[] = [
  {
    id: 'alert-demo-1',
    device_id: 'MF-001-DEMO',
    sensor_id: 'S2',
    severity: 'warning',
    title: 'Influent turbidity elevated',
    message: 'Influent turbidity (S2) has exceeded 100 NTU for the past 3 readings. Check inlet water quality.',
    parameter: 'turbidity',
    observed_value: 112,
    threshold: 100,
    created_at: new Date(Date.now() - 25 * 60000).toISOString(),
  },
  {
    id: 'alert-demo-2',
    device_id: 'MF-001-DEMO',
    severity: 'info',
    title: 'Sensor calibration reminder',
    message: 'pH probes S1 and E1 are approaching calibration interval. Schedule calibration within 7 days.',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    acknowledged_at: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
]

// ---------------------------------------------------------------------------
// Demo maintenance events
// ---------------------------------------------------------------------------

export const DEMO_MAINTENANCE: MaintenanceEvent[] = [
  {
    id: 'maint-demo-1',
    device_id: 'MF-001-DEMO',
    cartridge_id: 'CART-001',
    component: 'probe_calibration',
    action: 'pH probe two-point calibration (pH 4 and pH 7 buffers)',
    observation: 'Slope: −58.2 mV/pH. Within ±10% of Nernst ideal.',
    performed_by: 'Lab Operator',
    performed_at: new Date(Date.now() - 14 * 24 * 3600000).toISOString(),
    next_inspection_at: new Date(Date.now() + 14 * 24 * 3600000).toISOString(),
  },
  {
    id: 'maint-demo-2',
    device_id: 'MF-001-DEMO',
    cartridge_id: 'CART-001',
    component: 'mycelium_media',
    action: 'Mycelium cartridge inspection',
    observation: 'Media intact. No visible contamination. Colonisation uniform.',
    performed_by: 'Principal Investigator',
    performed_at: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
    next_inspection_at: new Date(Date.now() + 21 * 24 * 3600000).toISOString(),
  },
]
