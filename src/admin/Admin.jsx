import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, hasBackend } from '../lib/supabase.js'
import { staticSongs, fetchSongs, photoUrl } from '../lib/songs.js'
import { splitFullWidthGaps } from '../lib/lyrics.js'
import { themeVars, defaultTheme } from '../lib/theme.js'
import { Cover, SongList, Lyrics } from '../views.jsx'
import { resizeImage } from './image.js'
import { saveAll, importStatic } from './save.js'
import './admin.css'

const newId = () => 'song-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
const PHONES = [360, 390, 430]
const sig = (s) => JSON.stringify([s.id, s.title ?? '', s.lyrics, s.photo_path ?? null, !!s.photoFile, !!s.removePhoto])
const toDraft = (r) => ({ id: r.id, title: r.title ?? '', lyrics: r.lyrics ?? '', photo_path: r.photo_path ?? null })

function Shell({ children }) { return <div className="adm"><div className="adm-narrow">{children}</div></div> }

export default function Admin({ book }) {
  const [session, setSession] = useState(undefined)
  const [isAdmin, setIsAdmin] = useState(null)
  useEffect(() => {
    if (!supabase) { setSession(null); return }
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    setIsAdmin(null)
    if (!session) return
    supabase.rpc('is_admin').then(({ data, error }) => setIsAdmin(error ? false : !!data))
  }, [session])

  if (!hasBackend) return <Shell><h1>保存先が未設定です</h1><p>環境変数 VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を設定してください（README参照）。</p></Shell>
  if (session === undefined) return <Shell />
  if (!session) return <Login />
  if (isAdmin === null) return <Shell><p>確認中…</p></Shell>
  if (!isAdmin) return <Shell><h1>管理者として登録されていません</h1><p>{session.user.email} は管理者に登録されていません。READMEの「管理者の登録」を行ってください。</p><button onClick={() => supabase.auth.signOut()}>ログアウト</button></Shell>
  return <Editor book={book} email={session.user.email} />
}

function Login() {
  const [email, setEmail] = useState(''), [pw, setPw] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const go = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw })
    setBusy(false); if (error) setErr('ログインできませんでした。メールアドレスとパスワードを確認してください。')
  }
  return (
    <Shell>
      <h1>歌詞の管理 ログイン</h1>
      <form onSubmit={go} className="adm-col">
        <input type="email" placeholder="メールアドレス" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        <input type="password" placeholder="パスワード" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
        <button className="primary" type="submit" disabled={busy}>ログイン</button>
        {err && <p className="err">{err}</p>}
      </form>
      <p><a href="#/">詩集へ戻る</a></p>
    </Shell>
  )
}

function Editor({ book, email }) {
  const [orig, setOrig] = useState(null)
  const [draft, setDraft] = useState([])
  const [sel, setSel] = useState(0)
  const [view, setView] = useState('lyrics')
  const [width, setWidth] = useState(390)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const objUrls = useRef([])

  const load = useCallback(async (keepSel) => {
    try {
      const rows = await fetchSongs()
      setOrig(rows); setDraft(rows.map(toDraft)); setSel((s) => (keepSel ? Math.min(s, Math.max(0, rows.length - 1)) : 0))
    } catch (e) { setMsg('読み込みに失敗しました：' + (e.message || e)) }
  }, [])
  useEffect(() => { load(false) }, [load])
  useEffect(() => () => objUrls.current.forEach(URL.revokeObjectURL), [])

  const dirty = !!orig && (draft.length !== orig.length || draft.some((s, i) => sig(s) !== sig(toDraft(orig[i]))))
  useEffect(() => {
    const h = (e) => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  if (!orig) return <Shell><p>{msg || '読み込み中…'}</p></Shell>
  const cur = draft[sel]
  const patch = (p) => setDraft((a) => a.map((s, i) => (i === sel ? { ...s, ...p } : s)))
  const move = (i, d) => {
    const j = i + d; if (j < 0 || j >= draft.length) return
    setDraft((a) => { const b = [...a];[b[i], b[j]] = [b[j], b[i]]; return b })
    if (sel === i) setSel(j); else if (sel === j) setSel(i)
  }
  const remove = (i) => {
    const name = draft[i].title || '（曲名未設定）'
    if (!window.confirm(`「${name}」を削除します。\n「保存して公開に反映」を押すまで公開ページには反映されません。よろしいですか？`)) return
    setDraft((a) => a.filter((_, k) => k !== i)); setSel(Math.max(0, Math.min(sel, draft.length - 2)))
  }
  const add = () => { setDraft((a) => [...a, { id: newId(), title: '', lyrics: '', photo_path: null }]); setSel(draft.length); setView('lyrics') }
  const origOf = (id) => orig.find((o) => o.id === id)

  const pickPhoto = async (file) => {
    if (!file) return
    setMsg('')
    try {
      const blob = await resizeImage(file)
      const url = URL.createObjectURL(blob); objUrls.current.push(url)
      patch({ photoFile: blob, photoPreview: url, removePhoto: false })
    } catch (e) { setMsg(e.message) }
  }
  const dropPhoto = () => patch({ photoFile: null, photoPreview: null, removePhoto: !!cur.photo_path })
  const hasPhoto = !!cur?.photoFile || (!!cur?.photo_path && !cur?.removePhoto)

  const toSplit = () => {
    if (!window.confirm('この曲の歌詞で、行の途中にある全角スペースを改行に置き換えます（連続する全角スペースは1つの改行になり、行末の全角スペースは除かれます）。\n保存するまで公開には反映されず、「読み込み時の内容に戻す」で元に戻せます。よろしいですか？')) return
    patch({ lyrics: splitFullWidthGaps(cur.lyrics) })
  }
  const save = async () => {
    if (draft.length === 0) { setMsg('曲が1つもない状態では保存できません。'); return }
    if (!window.confirm('この内容を公開ページに反映します。よろしいですか？')) return
    setBusy(true); setMsg('保存中…')
    try { await saveAll(draft, orig); await load(true); setMsg('保存しました。公開ページを再読み込みすると反映されます。') }
    catch (e) { setMsg('保存に失敗しました：' + (e.message || e)) }
    setBusy(false)
  }
  const doImport = async () => {
    if (!window.confirm(`同梱の${staticSongs.length}曲を登録します（既に登録済みの曲は何もしません）。よろしいですか？`)) return
    setBusy(true)
    try { await importStatic(staticSongs); await load(false); setMsg('初期データを取り込みました。') } catch (e) { setMsg(e.message) }
    setBusy(false)
  }

  const preview = draft.map((s) => ({ ...s, title: s.title || null, photoUrl: s.removePhoto ? null : (s.photoPreview ?? photoUrl(s.photo_path)) }))
  return (
    <div className="adm">
      <header className="adm-bar"><strong>歌詞の管理</strong><span className="adm-mail">{email}</span><a href="#/">詩集を見る</a><button onClick={() => supabase.auth.signOut()}>ログアウト</button></header>
      {orig.length === 0 && (
        <div className="adm-banner">まだ曲が登録されていません。公開ページは同梱の{staticSongs.length}曲を表示しています。<button disabled={busy} onClick={doImport}>同梱の{staticSongs.length}曲を取り込む</button></div>
      )}
      <div className="adm-grid">
        <section className="adm-panel">
          <ol className="adm-songs">
            {draft.map((s, i) => (
              <li key={s.id} className={i === sel ? 'on' : ''}>
                <button className="pick" onClick={() => setSel(i)}>{String(i + 1).padStart(2, '0')}　{s.title || book.untitledLabel}</button>
                <button aria-label="上へ" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                <button aria-label="下へ" disabled={i === draft.length - 1} onClick={() => move(i, 1)}>↓</button>
                <button className="danger" onClick={() => remove(i)}>削除</button>
              </li>
            ))}
          </ol>
          <button onClick={add}>＋ 曲を追加</button>
          {cur && (
            <div className="adm-col">
              <label>曲名<input value={cur.title} onChange={(e) => patch({ title: e.target.value })} placeholder="（空欄なら「曲名未確認」と表示）" /></label>
              <label>歌詞
                <textarea rows={18} value={cur.lyrics} spellCheck={false} onChange={(e) => patch({ lyrics: e.target.value })} />
              </label>
              <p className="hint">改行＝次の行／空行＝段落の区切り（空行を重ねるとさらに広がります）。全角スペースはそのまま保存・表示されます。</p>
              <div className="adm-actions">
                <button onClick={toSplit}>全角スペースを改行にする</button>
                <button disabled={!origOf(cur.id) || cur.lyrics === origOf(cur.id).lyrics} onClick={() => patch({ lyrics: origOf(cur.id).lyrics })}>読み込み時の内容に戻す</button>
              </div>
              <div className="adm-photo">
                <strong>曲名の上の写真（任意）</strong>
                {hasPhoto && <img src={cur.photoPreview ?? photoUrl(cur.photo_path)} alt="" />}
                <div className="adm-actions">
                  <label className="filebtn">{hasPhoto ? '写真を変更' : '写真を選ぶ'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => { pickPhoto(e.target.files[0]); e.target.value = '' }} /></label>
                  {hasPhoto && <button className="danger" onClick={dropPhoto}>写真を削除</button>}
                </div>
                <p className="hint">長辺1600pxに縮小して保存します。写真を設定しない曲は、文字だけの表示のままです。</p>
              </div>
            </div>
          )}
        </section>
        <section className="adm-prev">
          <div className="adm-tabs">
            {[['cover', '表紙'], ['list', '目次'], ['lyrics', '歌詞']].map(([v, l]) => <button key={v} className={view === v ? 'on' : ''} onClick={() => setView(v)}>{l}</button>)}
            <span className="hint">スマホ幅：</span>
            {PHONES.map((w) => <button key={w} className={width === w ? 'on' : ''} onClick={() => setWidth(w)}>{w}px</button>)}
          </div>
          <div className="preview-frame" style={{ ...themeVars(defaultTheme), width }}>
            {view === 'cover' && <Cover book={book} />}
            {view === 'list' && <SongList songs={preview} book={book} />}
            {view === 'lyrics' && cur && <Lyrics songs={preview} id={cur.id} book={book} overrides={defaultTheme.songOverrides[cur.id]} />}
          </div>
        </section>
      </div>
      <footer className="adm-save">
        <span>{msg || (dirty ? '未保存の変更があります（公開ページには未反映）' : '保存済み')}</span>
        <button className="primary" disabled={!dirty || busy} onClick={save}>保存して公開に反映</button>
      </footer>
    </div>
  )
}
