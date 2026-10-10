/**
 * MycoFilter 2.0 — Core type definitions
 * All units are SI unless stated otherwise.
 * Reflects Rev B authoritative design.
 */

// ---------------------------------------------------------------------------
// Sensor / measurement types
// ---------------------------------------------------------------------------

export type MeasurementPoint = 'influent' | 'effluent' | 'outlet' | 'lab'

export type SensorTag =
  | 'S1' | 'S2' | 'S3' | 'T_in' | 'S4'   // influent
  | 'E1' | 'E2' | 'E3' | 'E5'   | 'E4'   // effluent
  | 'FM'                                    // flowmeter (optional)

export type Measurand =
  | 'pH' | 'turbidity' | 'conductivity' | 'temperature'
  | 'TDS_estimated' | 'ISE_target' | 'flow_rate'
  | 'LAS_lab' | 'MBAS_lab' | 'TDS_lab' | 'custom_lab'

export type SourceMode = 'hardware' | 'simulated' | 'lab_import' | 'manual'

export type QualityFlag =
  | 'valid'
  | 'uncalibrated'
  | 'stale'
  | 'out_of_range'
  | 'sensor_error'
  | 'duplicate'
  | 'out_of_order'
  | 'missing'
  | 'estimated'
  | 'not_configured'

export type CommissioningStatus =
  | 'proposed_cad'
  | 'selected_awaiting_install'
  | 'installed_uncalibrated'
  | 'installed_calibrated'
  | 'optional_unconfigured'
  | 'not_modelled'

// ---------------------------------------------------------------------------
// Telemetry
// ---------------------------------------------------------------------------

export interface TelemetryEvent {
  id?: string
  device_id: string
  sensor_id: string
  measurement_point: MeasurementPoint
  raw_value: number | null
  raw_unit: string | null
  calibrated_value: number | null
  unit: string | null
  water_temperature_c: number | null
  observed_at: string          // ISO UTC
  received_at?: string
  sequence_number?: number
  calibration_version?: string
  quality_flag: QualityFlag
  source_mode: SourceMode
  firmware_version?: string
}

// ---------------------------------------------------------------------------
// Sensor configuration
// ---------------------------------------------------------------------------

export interface SensorConfig {
  tag: SensorTag
  measurand: Measurand
  station: MeasurementPoint
  label: string
  unit: string
  raw_unit?: string
  commissioning_status: CommissioningStatus
  calibration_profile_id?: string
  port?: string                 // e.g. "M16×1.5, top cap -Y"
  placeholder_note?: string
}

// ---------------------------------------------------------------------------
// Calibration
// ---------------------------------------------------------------------------

export interface PhCalibrationProfile {
  id: string
  device_id: string
  sensor_id: string
  created_at: string
  operator?: string
  buffers: Array<{ pH_value: number; voltage_mV: number }>
  slope_mV_per_pH: number      // ideal ~±59.16 mV/pH at 25°C
  offset_mV: number
  R_squared?: number
  valid_range_pH: [number, number]
  temperature_c_at_calibration: number
  notes?: string
}

export interface TurbidityCalibrationProfile {
  id: string
  device_id: string
  sensor_id: string
  created_at: string
  operator?: string
  model: 'linear' | 'quadratic' | 'digital_ntu'
  coefficients: number[]       // [a, b, c] for quadratic: NTU = a·V² + b·V + c
  standards: Array<{ NTU: number; voltage_V: number }>
  R_squared?: number
  valid_range_NTU: [number, number]
  notes?: string
}

export interface ECCalibrationProfile {
  id: string
  device_id: string
  sensor_id: string
  created_at: string
  operator?: string
  cell_constant_per_cm: number
  alpha_per_degC: number       // temperature coefficient (default 0.021, provisional)
  solution_uS_cm: number
  temperature_c_at_cal: number
  compensation_applied_by_probe: boolean
  notes?: string
}

export type CalibrationProfile =
  | { type: 'pH'; data: PhCalibrationProfile }
  | { type: 'turbidity'; data: TurbidityCalibrationProfile }
  | { type: 'EC'; data: ECCalibrationProfile }

// ---------------------------------------------------------------------------
// Calculated values
// ---------------------------------------------------------------------------

export interface PHResult {
  pH: number | null
  slope_mV_per_pH: number
  offset_mV: number
  calibration_date: string | null
  temperature_c: number | null
  quality: QualityFlag
  note?: string
}

export interface TurbidityResult {
  NTU: number | null
  is_estimate: boolean
  model: string
  calibration_date: string | null
  valid_range: [number, number] | null
  quality: QualityFlag
  note?: string
}

export interface ECResult {
  EC_measured_uS_cm: number | null
  EC25_uS_cm: number | null
  temperature_c: number | null
  alpha_per_degC: number
  compensation_applied: boolean
  quality: QualityFlag
  note?: string
}

export interface TDSResult {
  TDS_est_mg_L: number | null
  EC25_uS_cm: number | null
  k_factor: number
  is_estimate: true
  note: string
  quality: QualityFlag
}

// ---------------------------------------------------------------------------
// Water-quality assessment
// ---------------------------------------------------------------------------

export type AssessmentPurpose =
  | 'research_monitoring'
  | 'water_reuse'
  | 'wastewater_discharge'
  | 'drinking_water_benchmark'

export type ParameterStatus =
  | 'within_benchmark'
  | 'exceeds_acceptable'
  | 'exceeds_permissible'
  | 'unavailable'
  | 'stale'
  | 'uncalibrated'
  | 'invalid'
  | 'not_configured'

export interface BenchmarkLimit {
  parameter: string
  acceptable_min?: number
  acceptable_max?: number
  permissible_max?: number
  unit: string
  standard: string
  version: string
  note?: string
}

export interface ParameterAssessment {
  parameter: string
  measurand: Measurand
  value: number | null
  unit: string
  status: ParameterStatus
  benchmark?: BenchmarkLimit
  timestamp: string | null
  source: SourceMode
  quality: QualityFlag
  explanation: string
}

// ---------------------------------------------------------------------------
// CCME WQI
// ---------------------------------------------------------------------------

export interface CCMEWQIInput {
  parameter: string
  objective_min?: number
  objective_max?: number
  unit: string
  observations: Array<{ value: number; timestamp: string; quality: QualityFlag }>
}

export interface CCMEWQIResult {
  WQI: number | null
  F1_scope: number | null
  F2_frequency: number | null
  F3_amplitude: number | null
  category: 'Excellent' | 'Good' | 'Fair' | 'Marginal' | 'Poor' | null
  parameters_included: string[]
  parameters_failed: string[]
  n_tests: number
  n_failed: number
  reference_period: [string, string] | null
  objective_profile: string
  insufficient_data: boolean
  explanation: string
}

// ---------------------------------------------------------------------------
// Device
// ---------------------------------------------------------------------------

export type ConnectivityMethod = 'wifi_https' | 'wifi_mqtt' | 'lora_gateway' | 'offline' | 'simulated'

export interface Device {
  id: string                   // e.g. "MF-001"
  name: string
  location_description?: string
  installed_at?: string
  commissioned_at?: string
  connectivity_method: ConnectivityMethod
  reporting_interval_s: number
  firmware_version?: string
  last_telemetry_at?: string
  is_demo: boolean
  sensor_configs: SensorConfig[]
}

// ---------------------------------------------------------------------------
// User / auth
// ---------------------------------------------------------------------------

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  role: 'admin' | 'operator' | 'viewer'
  assigned_device_ids: string[]
}

// ---------------------------------------------------------------------------
// Alert
// ---------------------------------------------------------------------------

export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface Alert {
  id: string
  device_id: string
  sensor_id?: string
  severity: AlertSeverity
  title: string
  message: string
  parameter?: string
  observed_value?: number
  threshold?: number
  created_at: string
  acknowledged_at?: string
  acknowledged_by?: string
}

// ---------------------------------------------------------------------------
// Maintenance
// ---------------------------------------------------------------------------

export type MaintenanceComponent =
  | 'mycelium_media'
  | 'biochar_media'
  | 'support_media'
  | 'separator_plates'
  | 'probe_cleaning'
  | 'probe_calibration'
  | 'housing_seals'
  | 'cartridge_inspection'
  | 'effluent_cell'
  | 'general'

export interface MaintenanceEvent {
  id: string
  device_id: string
  cartridge_id?: string
  component: MaintenanceComponent
  action: string
  observation?: string
  replacement_materials?: string
  performed_by: string
  performed_at: string
  next_inspection_at?: string
  notes?: string
}

// ---------------------------------------------------------------------------
// Lab measurement
// ---------------------------------------------------------------------------

export interface LabMeasurement {
  id: string
  device_id: string
  sample_id: string
  analyte: string
  method: string
  value: number
  unit: string
  uncertainty?: number
  detection_limit?: number
  sampled_at: string
  analysed_at: string
  lab?: string
  notes?: string
  source: 'LAS_HPLC' | 'MBAS_screening' | 'TDS_gravimetric' | 'microbiological' | 'custom'
  is_MBAS_not_LAS?: boolean     // MBAS ≠ LAS-specific; flag when relevant
}
