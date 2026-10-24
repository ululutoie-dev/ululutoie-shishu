import { createClient } from '@supabase/supabase-js'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
// anon キーは公開されても安全な設計（権限はRLS/Storageポリシーで守る）。service_role キーは使わない。
export const supabase = url && key ? createClient(url, key) : null
export const hasBackend = !!supabase
export const BUCKET = 'song-photos'
