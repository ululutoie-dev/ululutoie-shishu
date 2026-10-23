import { splitLine } from './lib/phrases.js'

const titleOf = (s, book) => s.title || book.untitledLabel
const pad = (n) => String(n).padStart(2, '0')

export function Cover({ book }) {
  return (
    <main className="page cover">
      <div className="cover-body">
        <h1 className="cover-name">{book.artist}</h1>
        <p className="cover-sub">{book.subtitle}</p>
        <hr className="rule short" />
      </div>
      <a className="cover-link" href="#/songs">目次</a>
    </main>
  )
}

export function SongList({ songs, book }) {
  return (
    <main className="page">
      <nav className="topnav"><a href="#/">表紙</a></nav>
      <h2 className="heading sm">目次</h2>
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

// 原稿の1行＝1つの <p>。画面幅による折り返しは、字下げ（ぶら下げ）で原稿の改行と区別する。
// 空文字の行（管理画面で意図的に入れた空行）だけが段落の空きになる。
export function LyricLine({ text }) {
  if (text === '') return <div className="stanza-gap" aria-hidden="true" />
  const { lead, phrases } = splitLine(text)
  return (
    <p className="line">
      {phrases.map((p, i) => (
        <span key={i} className="phrase" style={{ marginLeft: i === 0 && lead ? `${lead}em` : undefined, marginRight: p.gap ? `${p.gap}em` : undefined }}>{p.t}</span>
      ))}
    </p>
  )
}

export function Lyrics({ songs, id, book }) {
  const i = songs.findIndex((x) => x.id === id)
  if (i < 0) return <SongList songs={songs} book={book} />
  const s = songs[i]
  return (
    <main className="page">
      <nav className="topnav"><a href="#/songs">‹ 目次</a></nav>
      <header className="song-head">
        <p className="lyrics-no">{pad(i + 1)}</p>
        <h2 className="heading">{titleOf(s, book)}</h2>
      </header>
      <div className="lyrics">{s.lyrics.map((l, k) => <LyricLine key={k} text={l} />)}</div>
      <hr className="rule short left" />
      <nav className="topnav foot"><a href="#/songs">‹ 目次へ戻る</a></nav>
    </main>
  )
}
