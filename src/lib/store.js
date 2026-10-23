import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = url && key ? createClient(url, key) : null
export const hasBackend = !!supabase

// 公開側：誰でも読める（RLSで select のみ許可）
export async function loadBook() {
  if (!supabase) return null
  const { data, error } = await supabase.from('poetry_book').select('songs,theme').eq('id', 'main').maybeSingle()
  if (error || !data || !Array.isArray(data.songs) || data.songs.length === 0) return null
  return data
}
// 管理側：ログイン済みの本人のみ書き込める（RLSで制限。画面側の制御ではない）
export async function saveBook({ songs, theme }) {
  const { error } = await supabase.from('poetry_book').upsert({ id: 'main', songs, theme, updated_at: new Date().toISOString() })
  if (error) throw error
}
