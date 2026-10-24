import { lazy, Suspense, useEffect, useState } from 'react'
import { book, collections } from './data/songs.js'
import { songs } from './lib/songs.js'
import { Cover, CollectionList, SongList, Lyrics } from './views.jsx'
import { defaultTheme } from './lib/theme.js'

const DesignEditor = lazy(() => import('./design/DesignEditor.jsx'))

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
  const route = useRoute()
  const [a, b, c] = route
  if (a === 'design') return <Suspense fallback={null}><DesignEditor songs={songs} book={book} /></Suspense>

  // 旧URLも引き続き動くように、#/songs は詩集1の目次として扱う
  if (a === 'songs' && b) return <Lyrics songs={songs.filter(s => (s.collectionId || 'shishu-1') === 'shishu-1')} id={b} book={book} />
  if (a === 'songs') return <SongList songs={songs.filter(s => (s.collectionId || 'shishu-1') === 'shishu-1')} book={book} collection={collections[0]} />

  if (a === 'collection' && b) {
    const collection = collections.find(x => x.id === b)
    if (!collection) return <Cover book={book} collections={collections} />
    const collectionSongs = songs.filter(s => (s.collectionId || 'shishu-1') === collection.id)
    if (c === 'songs' && route[3]) return <Lyrics songs={collectionSongs} id={route[3]} book={book} collection={collection} />
    if (c === 'songs') return <SongList songs={collectionSongs} book={book} collection={collection} />
    return <SongList songs={collectionSongs} book={book} collection={collection} />
  }

  return <Cover book={book} collections={collections} />
}
