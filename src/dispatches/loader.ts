// Vite's import.meta.glob with `as: 'raw'` bundles all .md files as strings.
const files = import.meta.glob('./*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

export function loadDispatch(filename: string): string {
  const key = `./${filename}.md`;
  return files[key] ?? `*Dispatch missing: ${filename}*`;
}
