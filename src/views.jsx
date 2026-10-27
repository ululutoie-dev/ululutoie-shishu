import { useState } from 'react'
import { toParagraphs, leadingIndent } from './lib/lyrics.js'
import { photoUrl } from './lib/songs.js'
import { songVars } from './lib/theme.js'

const titleOf = (s, book) => s.title || book.untitledLabel
const pad = (n) => String(n).padStart(2, '0')

export function Cover({ book, collections = [] }) {
  return (
    <main className="page cover">
      <div className="cover-body">
        <h1 className="cover-name">{book.artist}</h1>
        <p className="cover-sub">{book.subtitle}</p>
      </div>
      <section className="collection-entry" aria-label="詩集一覧">
        {collections.map((c, i) => (
          <a className="collection-link" href={`#/collection/${c.id}/songs`} key={c.id}>
            <span className="collection-no">{pad(i + 1)}</span>
            <span className="collection-title">{c.title}</span>
          </a>
        ))}
      </section>
                  {book.eventLink?.url ? <a className="event-link" href={book.eventLink.url} target="_blank" rel="noopener noreferrer">{book.eventLink.label || 'LIVE／EVENT'}</a> : null}
    </main>
  )
}

// 詩集のジャケット（目次ページの上部）。画像は public/covers/<詩集id>.jpg（.png / .webp も可）を探す。
// 詩集データの cover に 'covers/xxx.jpg' のように書けば、その画像を使う（省略可）。
// 見つからない・読み込めないときは何も表示しない（ページはそのまま表示される）。
const COVER_EXTS = ['jpg', 'png', 'webp']
export function AlbumCover({ collection }) {
  const urls = collection.cover ? [photoUrl(collection.cover)] : COVER_EXTS.map((ext) => photoUrl(`covers/${collection.id}.${ext}`))
  const [i, setI] = useState(0)        // 何番目の候補を試しているか
  const [loaded, setLoaded] = useState(false)
  if (i >= urls.length) return null    // 候補がすべて見つからなかった
  return (
    <figure className="album-cover" style={loaded ? undefined : { display: 'none' }}>
      <img src={urls[i]} alt={`${collection.title} ジャケット`} decoding="async" onLoad={() => setLoaded(true)} onError={() => setI((n) => n + 1)} />
    </figure>
  )
}

export function SongList({ songs, book, collection }) {
  return (
    <main className="page">
      <nav className="topnav"><a href="#/">表紙</a>{collection ? <span className="nav-sep"> / {collection.title}</span> : null}</nav>
      {collection ? <AlbumCover key={collection.id} collection={collection} /> : null}
      <ol className="toc">
        {songs.map((s, i) => (
          <li key={s.id}>
            <a href={collection ? `#/collection/${collection.id}/songs/${s.id}` : `#/songs/${s.id}`}>
              <span className="toc-no">{pad(i + 1)}</span>
              <span className="toc-title">{titleOf(s, book)}</span>
            </a>
          </li>
        ))}
      </ol>
    </main>
  )
}

// 行頭の全角スペース（字下げ）はそのまま表示する。そのうえで、折り返しの続きは「字下げ＋1字」下げ、入力した改行と見分けられるようにする。
const indentStyle = (n) => (n ? { paddingLeft: `calc(var(--hang) + ${n}em)`, textIndent: `calc((var(--hang) + ${n}em) * -1)` } : undefined)

// 歌詞本文の表示（通常表示）。データ(歌詞の文字列)だけを受け取り、曲名・写真・ページ構成には関与しない。
// 改行＝次の行（1つの <p>）、空行＝段落の区切り（<div class="para"> の間）。全角スペースは white-space: pre-wrap でそのまま表示。
// 将来のアニメーション表示も toParagraphs() の結果（段落→行）を使えば、改行・段落の情報を失わずに作れる。
export function LyricsText({ text }) {
  return (
    <div className="lyrics">
      {toParagraphs(text).map((p, k) => (
        <div className="para" key={k} style={p.breaks > 1 ? { marginTop: `calc(var(--para-gap) * ${p.breaks})` } : undefined}>
          {p.lines.map((l, j) => <p className="line" key={j} style={indentStyle(leadingIndent(l))}>{l}</p>)}
        </div>
      ))}
    </div>
  )
}

// 曲ごとの表示方式。曲データに display を足したときに、ここから選ぶ（未指定は 'normal'）。今は通常表示のみ。
export const displayModes = { normal: LyricsText }

export function Lyrics({ songs, id, book, overrides, collection }) {
  const i = songs.findIndex((x) => x.id === id)
  if (i < 0) return <SongList songs={songs} book={book} />
  const s = songs[i]
  const Body = displayModes[s.display] || displayModes.normal
  return (
    <main className="page" style={songVars(overrides)}>
      <nav className="topnav"><a href={collection ? `#/collection/${collection.id}/songs` : '#/songs'}>‹ 目次</a></nav>
      {s.photoUrl ? <figure className="song-photo"><img src={s.photoUrl} alt="" loading="lazy" decoding="async" /></figure> : null}
      <header className="song-head">
        <p className="lyrics-no">{pad(i + 1)}</p>
        <h2 className="heading">{titleOf(s, book)}</h2>
      </header>
      <Body text={s.lyrics} />
      <hr className="end-rule" />
      <nav className="topnav foot"><a href={collection ? `#/collection/${collection.id}/songs` : '#/songs'}>‹ 目次へ戻る</a></nav>
    </main>
  )
}
