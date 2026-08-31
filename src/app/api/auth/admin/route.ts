import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { email, pass } = await req.json()
  // Bandingkan dengan env variables (simpan di Vercel environment variables)
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL
  const ADMIN_PASS  = process.env.ADMIN_PASSWORD
  if (email === ADMIN_EMAIL && pass === ADMIN_PASS) {
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ ok: false, message: 'Email atau password salah.' }, { status: 401 })
}
