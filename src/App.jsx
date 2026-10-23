import { useEffect, useState } from 'react'
import { book, songs } from './data/songs.js'

// ハッシュルーティング: #/ 表紙, #/songs 曲一覧, #/songs/<id> 歌詞（Vercel等でも設定不要）
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
const titleOf = (s) => s.title ?? book.untitledLabel
const pad = (n) => String(n).padStart(2, '0')

function Cover() {
  return (
    <main className="page cover">
      <h1 className="cover-name">{book.artist}</h1>
      <p className="cover-sub">{book.subtitle}</p>
      <hr className="rule short" />
      <a className="cover-link" href="#/songs">目次</a>
    </main>
  )
}

function SongList() {
  return (
    <main className="page">
      <nav className="topnav"><a href="#/">表紙</a></nav>
      <h2 className="heading">目次</h2>
      <ol className="toc">
        {songs.map((s) => (
          <li key={s.id}>
            <a href={`#/songs/${s.id}`}>
              <span className="toc-no">{pad(s.no)}</span>
              <span className="toc-title">{titleOf(s)}</span>
            </a>
          </li>
        ))}
      </ol>
    </main>
  )
}

function Lyrics({ id }) {
  const s = songs.find((x) => x.id === id)
  if (!s) return <SongList />
  return (
    <main className="page">
      <nav className="topnav"><a href="#/songs">‹ 目次</a></nav>
      <p className="lyrics-no">{pad(s.no)}</p>
      <h2 className="heading">{titleOf(s)}</h2>
      <hr className="rule" />
      <div className="lyrics">
        {s.lyrics.map((line, i) => <p className="line" key={i}>{line}</p>)}
      </div>
      <hr className="rule" />
      <nav className="topnav foot"><a href="#/songs">‹ 目次へ戻る</a></nav>
    </main>
  )
}

export default function App() {
  const [a, b] = useRoute()
  if (a === 'songs' && b) return <Lyrics id={b} />
  if (a === 'songs') return <SongList />
  return <Cover />
}
