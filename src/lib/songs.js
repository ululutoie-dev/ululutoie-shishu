import { supabase, hasBackend, BUCKET } from './supabase.js'
import { songs as raw } from '../data/songs.js'

// 同梱データ（Supabase未設定・取得失敗・テーブルが空のときの表示元／初回移行の元データ）。lyrics は改行区切りの1つの文字列。
export const staticSongs = raw.map((s) => ({ id: s.id, title: s.title, lyrics: s.lyrics.join('\n'), photo_path: null }))

export const photoUrl = (path) => (path && supabase ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : null)
export const withUrl = (s) => ({ ...s, photoUrl: s.photoUrl !== undefined ? s.photoUrl : photoUrl(s.photo_path) })

export async function fetchSongs() {
  if (!hasBackend) return null
  const { data, error } = await supabase.from('songs').select('id,title,lyrics,sort_order,photo_path').order('sort_order', { ascending: true })
  if (error) throw error
  return data
}
