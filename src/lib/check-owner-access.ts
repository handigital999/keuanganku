import { createServerSupabase } from './supabase-server'
import { NextResponse } from 'next/server'

/**
 * Check if a company is owner role
 * Returns { isOwner, error, response }
 * If isOwner is true or error exists, caller should return response immediately
 */
export async function checkOwnerAccess(company_id: string) {
  try {
    const supabase = createServerSupabase()
    const { data, error } = await supabase
      .from('companies')
      .select('role')
      .eq('id', company_id)
      .single()

    if (error) {
      return {
        isOwner: false,
        error: true,
        response: NextResponse.json({ error: 'Perusahaan tidak ditemukan' }, { status: 404 }),
      }
    }

    if (data?.role === 'owner') {
      return {
        isOwner: true,
        error: false,
        response: NextResponse.json(
          { error: 'Owner user tidak dapat mengubah data. Akses ditolak.' },
          { status: 403 }
        ),
      }
    }

    return { isOwner: false, error: false, response: null }
  } catch (err) {
    return {
      isOwner: false,
      error: true,
      response: NextResponse.json({ error: 'Kesalahan validasi akses' }, { status: 500 }),
    }
  }
}
