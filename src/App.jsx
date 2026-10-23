import { lazy, Suspense, useEffect, useState } from 'react'
import { book, songs as staticSongs } from './data/songs.js'
import { defaultTheme, applyTheme } from './lib/theme.js'
import { hasBackend, loadBook } from './lib/store.js'
import { Cover, SongList, Lyrics } from './views.jsx'

const Admin = lazy(() => import('./admin/Admin.jsx')) // 公開側の読み込みを軽く保つ

// ハッシュルーティング: #/ 表紙, #/songs 目次, #/songs/<id> 歌詞, #/admin 管理画面（どこからもリンクしない）
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

export default function App() {
  const [a, b] = useRoute()
  // バックエンド未設定なら同梱の songs.js をそのまま使う。設定済みなら保存済みデータを読む。
  const [data, setData] = useState({ songs: staticSongs, theme: defaultTheme, ready: !hasBackend })
  useEffect(() => {
    if (!hasBackend) return
    let live = true
    const done = (d) => live && setData((p) => ({ ...p, ...d, ready: true }))
    const t = setTimeout(() => done({}), 4000) // 取得に失敗・遅延しても同梱データで表示
    loadBook().then((r) => { clearTimeout(t); done(r ? { songs: r.songs, theme: { ...defaultTheme, ...r.theme } } : {}) }).catch(() => { clearTimeout(t); done({}) })
    return () => { live = false; clearTimeout(t) }
  }, [])
  useEffect(() => { applyTheme(data.theme) }, [data.theme])

  if (!data.ready) return <div className="page" />
  if (a === 'admin') return <Suspense fallback={null}><Admin initial={data} book={book} /></Suspense>
  if (a === 'songs' && b) return <Lyrics songs={data.songs} id={b} book={book} />
  if (a === 'songs') return <SongList songs={data.songs} book={book} />
  return <Cover book={book} />
}
