import { NextRequest, NextResponse } from 'next/server'
import type { TelemetryEvent } from '@/lib/types'

/**
 * POST /api/telemetry
 * Receives hardware telemetry from the ESP32 firmware (HTTPS POST).
 * Validates, sanitises, and stores via Supabase (when configured).
 * Never fabricates values — rejects malformed payloads.
 */
export async function POST(req: NextRequest) {
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  // Basic validation
  const ev = body as Partial<TelemetryEvent>
  if (!ev.device_id || !ev.sensor_id || !ev.observed_at) {
    return NextResponse.json({ error: 'Missing required fields: device_id, sensor_id, observed_at' }, { status: 422 })
  }

  // Reject impossibly large or small raw values
  if (ev.raw_value !== null && ev.raw_value !== undefined && !isFinite(ev.raw_value)) {
    return NextResponse.json({ error: 'raw_value must be finite' }, { status: 422 })
  }

  // Sanitise source_mode — never accept 'simulated' from hardware
  const event: TelemetryEvent = {
    ...(ev as TelemetryEvent),
    received_at: new Date().toISOString(),
    source_mode: 'hardware',  // override; hardware always 'hardware'
  }

  // TODO: insert into Supabase when configured
  // const sb = getSupabaseServerClient()
  // await sb.from('telemetry_events').insert(event)

  console.log('[telemetry] received:', event.device_id, event.sensor_id, event.raw_value, event.observed_at)

  return NextResponse.json({ ok: true, received_at: event.received_at })
}

export async function GET() {
  return NextResponse.json({ status: 'MycoFilter telemetry endpoint active', methods: ['POST'] })
}
