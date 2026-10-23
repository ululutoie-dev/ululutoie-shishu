import { lazy, Suspense, useEffect, useState } from 'react'
import { book, songs } from './data/songs.js'
import { Cover, SongList, Lyrics } from './views.jsx'
import { defaultTheme } from './lib/theme.js'

const DesignEditor = lazy(() => import('./design/DesignEditor.jsx')) // 公開側の読み込みを軽く保つ

// ハッシュルーティング: #/ 表紙, #/songs 目次, #/songs/<id> 歌詞, #/design デザイン調整（どこからもリンクしない）
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
  if (a === 'design') return <Suspense fallback={null}><DesignEditor songs={songs} book={book} /></Suspense>
  if (a === 'songs' && b) return <Lyrics songs={songs} id={b} book={book} overrides={defaultTheme.songOverrides[b]} />
  if (a === 'songs') return <SongList songs={songs} book={book} />
  return <Cover book={book} />
}
