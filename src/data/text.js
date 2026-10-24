// 歌詞を書くための text`...` の部品。入力した文字列をそのまま使い、
// 書き出しの直後の改行と、閉じる ` の直前の改行を1つずつ取り除くだけ（空白・全角スペース・空行は変更しない）。
export const text = (strings) => strings.raw[0].replace(/^\n/, '').replace(/\n$/, '')
