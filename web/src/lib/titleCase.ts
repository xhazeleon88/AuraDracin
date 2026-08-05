/** Words kept lowercase in mid-title (unless first/last word). */
const SMALL_WORDS = new Set([
  // Indonesian
  "yang",
  "dan",
  "di",
  "ke",
  "dari",
  "untuk",
  "pada",
  "dengan",
  "atau",
  "ini",
  "itu",
  "oleh",
  "tentang",
  "seperti",
  "hingga",
  "sampai",
  "setelah",
  "sebelum",
  "karena",
  "jika",
  "kalau",
  "saat",
  "ketika",
  "dalam",
  "atas",
  "bawah",
  "antara",
  "saja",
  "juga",
  "pun",
  "lah",
  "kah",
  "sudah",
  "belum",
  "tidak",
  "bukan",
  "akan",
  "telah",
  "serta",
  "maupun",
  "demi",
  "bagi",
  "tanpa",
  "terhadap",
  "kepada",
  "sebagai",
  "adalah",
  "ada",
  "agar",
  "supaya",
  "bahwa",
  "namun",
  "tetapi",
  "lalu",
  "kemudian",
  "via",
  "per",
  // English leftovers after partial translate
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "of",
  "to",
  "in",
  "on",
  "at",
  "for",
  "from",
  "with",
  "by",
  "as",
  "into",
  "over",
  "after",
  "before",
  "vs",
  "vs.",
]);

function capitalizeWord(word: string) {
  if (!word) return word;
  // Keep short all-caps tokens (CEO, OK, TV) and mixed brands like iDrama-ish tokens
  if (/^[A-Z0-9]{2,6}$/.test(word)) return word;
  if (/^[A-Z]+$/.test(word) && word.length <= 5) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Title Case for Aura drama titles.
 * Example: "dua sahabat jadi ipar hamil" → "Dua Sahabat Jadi Ipar Hamil"
 * Small words like "yang" stay lowercase unless first/last.
 */
export function toDramaTitleCase(input: string) {
  const text = input.replace(/\s+/g, " ").trim();
  if (!text) return text;

  const parts = text.split(/(\s+|[-–—:/])/);
  const words = parts.filter((p) => !/^\s+$/.test(p) && !/^[-–—:/]$/.test(p));
  const lastWordIndex = words.length - 1;
  let wordIndex = -1;

  return parts
    .map((part) => {
      if (/^\s+$/.test(part) || /^[-–—:/]$/.test(part)) return part;

      wordIndex += 1;
      const isFirst = wordIndex === 0;
      const isLast = wordIndex === lastWordIndex;

      // Preserve leading punctuation like “(Sulih suara)”
      const match = part.match(/^([“"'([]*)(.*?)([”"')\]]*)$/);
      if (!match) return capitalizeWord(part);
      const [, lead, core, trail] = match;
      if (!core) return part;

      const lower = core.toLowerCase();
      if (!isFirst && !isLast && SMALL_WORDS.has(lower)) {
        return `${lead}${lower}${trail}`;
      }
      return `${lead}${capitalizeWord(core)}${trail}`;
    })
    .join("");
}
