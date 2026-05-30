// TODO SESSION 2-1: 500자 chunk + 100자 overlap으로 분할.
export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 100,
): string[] {
  const clean = text.trim();
  if (!clean) return [];
  if (clean.length <= chunkSize) return [clean];

  const chunks: string[] = [];
  const step = chunkSize - overlap;
  for (let start = 0; start < clean.length; start += step) {
    chunks.push(clean.slice(start, start + chunkSize));
    if (start + chunkSize >= clean.length) break;
  }
  return chunks;
}
