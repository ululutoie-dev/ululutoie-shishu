import { useEffect, useRef, useState } from 'react'
import { supabase, hasBackend, saveBook } from '../lib/store.js'
import { themeVars, fonts, defaultTheme } from '../lib/theme.js'
import { Cover, SongList, Lyrics } from '../views.jsx'
import './admin.css'

const toLines = (text) => text.replace(/\r\n?/g, '\n').split('\n').reduceRight((a, l) => (a.length || l !== '' ? [l, ...a] : a), [])
const newId = () => 'song-' + Date.now().toString(36)

export default function Admin({ initial, book }) {
  const [session, setSession] = useState(undefined)
  useEffect(() => {
    if (!supabase) { setSession(null); return }
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])
  if (!hasBackend) return <Shell><h1>保存先が未設定です</h1><p>環境変数 VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を設定してください（README参照）。設定するまで、この画面からの保存・ログインはできません。</p></Shell>
  if (session === undefined) return <Shell />
  if (!session) return <Login />
  return <Editor initial={initial} book={book} email={session.user.email} />
}

function Shell({ children }) { return <div className="admin"><div className="adm-narrow">{children}</div></div> }

function Login() {
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState('')
  const go = async (e) => {
    e.preventDefault(); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
    if (error) setErr('ログインできませんでした。')
  }
  return (
    <Shell>
      <h1>編集画面ログイン</h1>
      <form onSubmit={go} className="adm-col">
        <input type="email" placeholder="メールアドレス" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        <input type="password" placeholder="パスワード" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
        <button className="primary" type="submit">ログイン</button>
        {err && <p className="err">{err}</p>}
      </form>
      <p><a href="#/">公開ページへ</a></p>
    </Shell>
  )
}

function Editor({ initial, book, email }) {
  const [songs, setSongs] = useState(initial.songs)
  const [theme, setTheme] = useState({ ...defaultTheme, ...initial.theme })
  const saved = useRef(JSON.stringify({ songs: initial.songs, theme: { ...defaultTheme, ...initial.theme } }))
  const [sel, setSel] = useState(0)
  const [text, setText] = useState(initial.songs[0]?.lyrics.join('\n') ?? '')
  const [tab, setTab] = useState('songs')
  const [view, setView] = useState('lyrics')
  const [msg, setMsg] = useState('')
  const dirty = JSON.stringify({ songs, theme }) !== saved.current
  const cur = songs[sel]

  useEffect(() => { setText(songs[sel]?.lyrics.join('\n') ?? '') }, [sel, songs[sel]?.id]) // eslint-disable-line
  useEffect(() => {
    const h = (e) => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const patch = (p) => setSongs((a) => a.map((s, i) => (i === sel ? { ...s, ...p } : s)))
  const move = (i, d) => {
    const j = i + d; if (j < 0 || j >= songs.length) return
    setSongs((a) => { const b = [...a]; [b[i], b[j]] = [b[j], b[i]]; return b })
    if (sel === i) setSel(j); else if (sel === j) setSel(i)
  }
  const remove = (i) => {
    const name = songs[i].title || '（曲名未設定）'
    if (!window.confirm(`「${name}」を削除します。保存するまで公開ページには反映されません。よろしいですか？`)) return
    setSongs((a) => a.filter((_, k) => k !== i)); setSel(Math.max(0, Math.min(sel, songs.length - 2)))
  }
  const add = () => { setSongs((a) => [...a, { id: newId(), title: '', lyrics: [] }]); setSel(songs.length); setTab('songs') }
  const save = async () => {
    if (songs.length === 0 && !window.confirm('曲が0件の状態は保存できません。')) return
    if (songs.length === 0) return
    if (!window.confirm('この内容を公開ページに反映します。よろしいですか？（以前の内容は履歴として残ります）')) return
    setMsg('保存中…')
    try { await saveBook({ songs, theme }); saved.current = JSON.stringify({ songs, theme }); setMsg('保存しました。公開ページを再読み込みすると反映されます。') }
    catch (e) { setMsg('保存に失敗しました：' + (e.message || e)) }
  }
  const set = (k) => (e) => setTheme((t) => ({ ...t, [k]: e.target.type === 'range' ? Number(e.target.value) : e.target.value }))
  const Range = ({ k, label, min, max, step, unit = '' }) => (
    <label className="adm-row"><span>{label}<b>{theme[k]}{unit}</b></span><input type="range" min={min} max={max} step={step} value={theme[k]} onChange={set(k)} /></label>
  )

  return (
    <div className="admin">
      <header className="adm-bar">
        <strong>編集画面</strong>
        <span className="adm-mail">{email}</span>
        <a href="#/">公開ページ</a>
        <button onClick={() => supabase.auth.signOut()}>ログアウト</button>
      </header>
      <div className="adm-grid">
        <section className="adm-panel">
          <div className="adm-tabs">
            <button className={tab === 'songs' ? 'on' : ''} onClick={() => setTab('songs')}>曲</button>
            <button className={tab === 'design' ? 'on' : ''} onClick={() => setTab('design')}>デザイン</button>
          </div>
          {tab === 'songs' && (<>
            <ol className="adm-songs">
              {songs.map((s, i) => (
                <li key={s.id} className={i === sel ? 'on' : ''}>
                  <button className="pick" onClick={() => { setSel(i); setView('lyrics') }}>{String(i + 1).padStart(2, '0')}　{s.title || book.untitledLabel}</button>
                  <button aria-label="上へ" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                  <button aria-label="下へ" disabled={i === songs.length - 1} onClick={() => move(i, 1)}>↓</button>
                  <button aria-label="削除" className="danger" onClick={() => remove(i)}>削除</button>
                </li>
              ))}
            </ol>
            <button onClick={add}>＋ 曲を追加</button>
            {cur && (<div className="adm-col">
              <label>曲名<input value={cur.title ?? ''} onChange={(e) => patch({ title: e.target.value })} placeholder="（空欄なら曲名未確認と表示）" /></label>
              <label>歌詞（1行＝原稿の1行。全角スペースはそのまま保持）
                <textarea rows={18} value={text} spellCheck={false} onChange={(e) => { setText(e.target.value); patch({ lyrics: toLines(e.target.value) }) }} />
              </label>
              <p className="hint">空行を入れた場合のみ、段落の空きとして表示されます。</p>
            </div>)}
          </>)}
          {tab === 'design' && (<div className="adm-col">
            <label className="adm-row"><span>背景色</span><input type="color" value={theme.bg} onChange={set('bg')} /></label>
            <label className="adm-row"><span>文字色</span><input type="color" value={theme.ink} onChange={set('ink')} /></label>
            {[['fontTitle', 'タイトルの書体'], ['fontBody', '本文の書体']].map(([k, l]) => (
              <label className="adm-row" key={k}><span>{l}</span>
                <select value={theme[k]} onChange={set(k)}>{Object.entries(fonts).map(([v, f]) => <option key={v} value={v}>{f.label}</option>)}</select></label>
            ))}
            <Range k="fsLyric" label="本文の文字サイズ" min={0.85} max={1.35} step={0.01} unit="rem" />
            <Range k="lhLyric" label="行間" min={1.6} max={2.8} step={0.05} />
            <Range k="gapTitle" label="曲名と歌詞の間" min={1} max={6} step={0.1} unit="rem" />
            <Range k="pageX" label="ページ左右の余白" min={16} max={64} step={1} unit="px" />
            <Range k="pageY" label="ページ上下の余白" min={24} max={96} step={1} unit="px" />
            <Range k="ruleAlpha" label="区切り線の濃さ" min={0.05} max={0.6} step={0.01} />
            <button onClick={() => setTheme(defaultTheme)}>デザインを初期値に戻す</button>
            <p className="hint">デザインの変更は歌詞データに影響しません。</p>
          </div>)}
        </section>
        <section className="adm-prev">
          <div className="adm-tabs">
            {[['cover', '表紙'], ['list', '目次'], ['lyrics', '歌詞']].map(([v, l]) => <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>{l}</button>)}
          </div>
          <div className="preview-frame" style={themeVars(theme)}>
            {view === 'cover' && <Cover book={book} />}
            {view === 'list' && <SongList songs={songs} book={book} />}
            {view === 'lyrics' && (cur ? <Lyrics songs={songs} id={cur.id} book={book} /> : null)}
          </div>
        </section>
      </div>
      <footer className="adm-save">
        <span>{msg || (dirty ? '未保存の変更があります（公開ページには未反映）' : '保存済み')}</span>
        <button className="primary" disabled={!dirty} onClick={save}>保存して公開に反映</button>
      </footer>
    </div>
  )
}
