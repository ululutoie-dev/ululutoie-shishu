import { displayLines } from './lib/phrases.js'
import { songVars } from './lib/theme.js'

const titleOf = (s, book) => s.title || book.untitledLabel
const pad = (n) => String(n).padStart(2, '0')

export function Cover({ book }) {
  return (
    <main className="page cover">
      <div className="cover-body">
        <h1 className="cover-name">{book.artist}</h1>
        <p className="cover-sub">{book.subtitle}</p>
      </div>
      <a className="cover-link" href="#/songs">目次</a>
    </main>
  )
}

export function SongList({ songs, book }) {
  return (
    <main className="page">
      <nav className="topnav"><a href="#/">表紙</a></nav>
      <ol className="toc">
        {songs.map((s, i) => (
          <li key={s.id}>
            <a href={`#/songs/${s.id}`}>
              <span className="toc-no">{pad(i + 1)}</span>
              <span className="toc-title">{titleOf(s, book)}</span>
            </a>
          </li>
        ))}
      </ol>
    </main>
  )
}

// 歌詞の1つの表示単位＝1つの <p>。原稿の行頭の字下げは保持し、画面幅で折り返した続きは1字ぶら下げて区別する。
export function Lyrics({ songs, id, book, overrides }) {
  const i = songs.findIndex((x) => x.id === id)
  if (i < 0) return <SongList songs={songs} book={book} />
  const s = songs[i]
  return (
    <main className="page" style={songVars(overrides)}>
      <nav className="topnav"><a href="#/songs">‹ 目次</a></nav>
      <header className="song-head">
        <p className="lyrics-no">{pad(i + 1)}</p>
        <h2 className="heading">{titleOf(s, book)}</h2>
      </header>
      <div className="lyrics">
        {s.lyrics.flatMap((l, k) => displayLines(l).map((d, j) => (
          d.blank ? <div className="stanza-gap" key={`${k}-${j}`} aria-hidden="true" />
                  : <p className="line" key={`${k}-${j}`} style={d.indent ? { paddingLeft: `${1 + d.indent}em` } : undefined}>{d.t}</p>
        )))}
      </div>
      <hr className="end-rule" />
      <nav className="topnav foot"><a href="#/songs">‹ 目次へ戻る</a></nav>
    </main>
  )
}
