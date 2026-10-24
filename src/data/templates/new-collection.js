// 新しい詩集のひな形（このファイル自体は使われません）。
// 手順:
//   1. このファイルを src/data/collections/ にコピーし、ファイル名を詩集の id にする（例: shishu-3.js）
//   2. 下の id・order・title・theme・曲を書き換える
//   3. GitHubに反映する（目次・表紙の一覧に自動で出ます）
import { text } from '../text.js'

export default {
  id: 'shishu-3',                 // 半角英数字とハイフン。他の詩集と重複しない。公開後は変えない
  order: 3,                       // 詩集の並び順（小さい順）
  title: 'ululuと家 3',
  subtitle: '詩集',
  theme: { bg: '#ffffff', ink: '#1c1c1c' }, // 背景色・文字色

  songs: [
    {
      id: 'first-song',           // この詩集の中で重複しない。公開後は変えない
      title: '曲名',               // 未確認なら null
      photo: null,                // 写真: 'images/shishu-3/first-song.jpg'（public/ に置いた画像）／なしは null
      lyrics: text`
ここに歌詞を書く
改行は次の行

空行は段落の区切り
`,
    },
  ],
}
