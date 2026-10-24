// 歌詞テキストの扱い（表示と編集補助）。歌詞の文字は変更しない。
// 改行 = 次の行 / 空行 = 段落の区切り（空行を重ねるほど間が広がる）。全角スペースはそのまま保持する。
// 「空行」は何も書かれていない行（半角スペース/タブのみも含む）だけ。全角スペースを含む行は、字下げ・間隔として入力された行なので空行にしない。
const isBlank = (line) => /^[ \t]*$/.test(line)
// 行頭の全角スペースの数（字下げ）。表示側で、折り返しの続きの位置を決めるために使う。文字列自体は変更しない。
export const leadingIndent = (line) => /^\u3000*/.exec(line)[0].length

export function toParagraphs(text) {
  const paras = []
  let cur = null, blanks = 0
  for (const line of (text || '').replace(/\r\n?/g, '\n').split('\n')) {
    if (isBlank(line)) { blanks += 1; if (cur) { paras.push(cur); cur = null } }
    else {
      if (!cur) cur = { lines: [], breaks: paras.length ? blanks : 0 }
      cur.lines.push(line); blanks = 0
    }
  }
  if (cur) paras.push(cur)
  return paras // [{ lines: string[], breaks: 直前の空行の数 }]
}

// 編集補助（管理者が押したときだけ働く。自動では実行しない）：
// 行の途中の全角スペースを改行に置き換える。行頭の全角スペース（字下げ）は先頭のフレーズに残す。
export function splitFullWidthGaps(text) {
  return text.replace(/\r\n?/g, '\n').split('\n').flatMap((line) => {
    if (isBlank(line)) return [line]
    const lead = /^\u3000*/.exec(line)[0]
    return line.slice(lead.length).split(/\u3000+/).filter((p) => p !== '').map((p, i) => (i === 0 ? lead + p : p))
  }).join('\n')
}
