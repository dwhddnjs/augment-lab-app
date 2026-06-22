// Cleans augment descriptions from both data sources:
//  - EN (wiki): pipe markup ("power|ap"), ";color", "{{ template }}"
//  - KO (game stringtable): rich tags (<scaleAD>…), "%i:icon%" refs, "@var@" number placeholders
export function cleanAugmentDescription(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, '\n') // line breaks
    .replace(/<[^>]+>/g, '') // rich/HTML-like tags
    .replace(/\(%i:[^%]*%\)/g, '') // (%i:scaleAP%) icon refs in parens
    .replace(/%i:[^%]*%/g, '') // %i:scaleAD% icon refs
    .replace(/@[^@]+@%?/g, '') // @BaseCD@ / @ADAmp*100@% number placeholders (eat trailing %)
    .replace(/\{\{[^}]*\}\}/g, '') // {{ template }}
    .replace(/\|[a-zA-Z]+/g, '') // |ap pipe markup
    .replace(/;[^|<\s]+/g, '') // ;color markup
    .replace(/\(\s*\)/g, '') // empty parens left behind
    .replace(/\s+([.,%)])/g, '$1') // tidy space before punctuation
    .replace(/[ \t]{2,}/g, ' ') // collapse runs of spaces
    .replace(/\n{2,}/g, '\n')
    .trim();
}
