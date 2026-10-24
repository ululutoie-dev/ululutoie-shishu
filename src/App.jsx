import { lazy, Suspense, useEffect, useState } from 'react'
import { book } from './data/songs.js'
import { Cover, SongList, Lyrics } from './views.jsx'
import { defaultTheme } from './lib/theme.js'
import { hasBackend } from './lib/supabase.js'
import { staticSongs, fetchSongs, withUrl } from './lib/songs.js'

const DesignEditor = lazy(() => import('./design/DesignEditor.jsx')) // 公開側の読み込みを軽く保つ
const Admin = lazy(() => import('./admin/Admin.jsx'))

// ハッシュルーティング: #/ 表紙, #/songs 目次, #/songs/<id> 歌詞, #/admin 歌詞管理, #/design デザイン調整（どこからもリンクしない）
const parse = (h) => h.replace(/^#\/?/, '').split('/').filter(Boolean)
function useRoute() {
  const [r, setR] = useState(parse(window.location.hash))
  useEffect(() => {
    const on = () => { setR(parse(window.location.hash)); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return r
}

// 公開側の曲データ：Supabaseから取得。未設定・取得失敗・テーブルが空のときは同梱データで表示する。
function useSongs() {
  const [state, setState] = useState({ songs: staticSongs.map(withUrl), ready: !hasBackend })
  useEffect(() => {
    if (!hasBackend) return
    let live = true
    const done = (songs) => live && setState((p) => ({ songs: songs ? songs.map(withUrl) : p.songs, ready: true }))
    const t = setTimeout(() => done(null), 4000)
    fetchSongs().then((rows) => { clearTimeout(t); done(rows && rows.length ? rows : null) }).catch(() => { clearTimeout(t); done(null) })
    return () => { live = false; clearTimeout(t) }
  }, [])
  return state
}

export default function App() {
  const [a, b] = useRoute()
  const { songs, ready } = useSongs()
  if (a === 'admin') return <Suspense fallback={null}><Admin book={book} /></Suspense>
  if (a === 'design') return <Suspense fallback={null}><DesignEditor songs={staticSongs} book={book} /></Suspense>
  if (!ready) return <div className="page" />
  if (a === 'songs' && b) return <Lyrics songs={songs} id={b} book={book} overrides={defaultTheme.songOverrides[b]} />
  if (a === 'songs') return <SongList songs={songs} book={book} />
  return <Cover book={book} />
}
