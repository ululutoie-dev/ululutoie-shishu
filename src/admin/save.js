import { supabase, BUCKET } from '../lib/supabase.js'

const fail = (msg, e) => { const err = new Error(`${msg}${e?.message ? '：' + e.message : ''}`); err.cause = e; return err }

// 下書き(draft)と読み込み時の内容(orig)の差分をSupabaseへ反映する。
// 順序：写真アップロード → 曲の追加/更新(upsert) → 削除 → 古い写真の削除（最後は失敗しても本体に影響しない）。
// 曲データの反映前に失敗したら、アップロード済みの写真を片付ける。
export async function saveAll(draft, orig) {
  const uploaded = [], oldPhotos = []
  let committed = false
  try {
    const rows = []
    for (const [i, s] of draft.entries()) {
      let path = s.photo_path
      if (s.photoFile) {
        path = `${s.id}/${Date.now()}.jpg`
        const { error } = await supabase.storage.from(BUCKET).upload(path, s.photoFile, { contentType: 'image/jpeg', cacheControl: '31536000' })
        if (error) throw fail(`写真のアップロードに失敗しました（${s.title || '曲名未設定'}）`, error)
        uploaded.push(path); if (s.photo_path) oldPhotos.push(s.photo_path)
      } else if (s.removePhoto) { if (s.photo_path) oldPhotos.push(s.photo_path); path = null }
      rows.push({ id: s.id, title: s.title === '' ? null : s.title, lyrics: s.lyrics, sort_order: i, photo_path: path })
    }
    const origById = new Map(orig.map((o) => [o.id, o]))
    const changed = rows.filter((r) => { const o = origById.get(r.id); return !o || o.title !== r.title || o.lyrics !== r.lyrics || o.sort_order !== r.sort_order || o.photo_path !== r.photo_path })
    const removed = orig.filter((o) => !draft.some((d) => d.id === o.id))
    if (changed.length) {
      const { error } = await supabase.from('songs').upsert(changed)
      if (error) throw fail('曲の保存に失敗しました', error)
    }
    committed = true
    if (removed.length) {
      const { error } = await supabase.from('songs').delete().in('id', removed.map((r) => r.id))
      if (error) throw fail('曲の削除に失敗しました（他の変更は保存済みです。再読み込みして確認してください）', error)
      removed.forEach((r) => r.photo_path && oldPhotos.push(r.photo_path))
    }
    if (oldPhotos.length) await supabase.storage.from(BUCKET).remove(oldPhotos).catch(() => {})
  } catch (e) {
    if (!committed && uploaded.length) await supabase.storage.from(BUCKET).remove(uploaded).catch(() => {})
    throw e
  }
}

// 初回移行：同梱データを登録する。既にあるIDは何もしない（何度押しても重複しない）。
export async function importStatic(rows) {
  const { error } = await supabase.from('songs').upsert(rows.map((r, i) => ({ id: r.id, title: r.title, lyrics: r.lyrics, sort_order: i })), { onConflict: 'id', ignoreDuplicates: true })
  if (error) throw fail('初期データの取り込みに失敗しました', error)
}
