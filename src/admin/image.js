// 管理画面で選んだ写真を、保存前にブラウザ内で縮小する（長辺1600px・JPEG）。縦横比は保つ。
export async function resizeImage(file, max = 1600) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('JPEG・PNG・WebPの画像を選んでください。')
  if (file.size > 25 * 1024 * 1024) throw new Error('画像が大きすぎます（25MBまで）。')
  let bmp
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }) } catch { throw new Error('画像を読み込めませんでした。別の画像を試してください。') }
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k)
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(bmp, 0, 0, w, h)
  const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.86))
  if (!blob) throw new Error('画像の変換に失敗しました。')
  return blob
}
