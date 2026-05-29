export function cleanAugmentDescription(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\|[a-zA-Z]+/g, '')
    .replace(/;[^|<\s]+/g, '')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
