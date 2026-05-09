// 日本語トークナイザー
export function tokenize(text: string): string {
  const segmenter = new Intl.Segmenter("ja", {
    granularity: "word",
  })

  const tokens: string[] = []

  for (const { segment, isWordLike } of segmenter.segment(text)) {
    if (isWordLike) {
      tokens.push(segment)
    }
  }

  return tokens.join(" ")
}