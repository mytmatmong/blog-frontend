/**
 * Chuyển đổi mã ngôn ngữ / flag emoji / mã quốc gia thành URL ảnh cờ FlagCDN.
 * Giúp hiển thị lá cờ rõ ràng trên mọi HĐH (đặc biệt là Windows không render được emoji cờ).
 */
export function getFlagUrl(flagOrCode?: string | number | null): string {
  if (flagOrCode === null || flagOrCode === undefined || flagOrCode === '') {
    return 'https://flagcdn.com/w20/un.png';
  }

  let val = String(flagOrCode).trim();

  // Kiểm tra nếu là Unicode Regional Indicator Symbol (vd: 🇻🇳, 🇺🇸, 🇬🇧, 🇯🇵)
  const codePoint1 = val.codePointAt(0);
  if (codePoint1 && codePoint1 >= 127462 && codePoint1 <= 127487) {
    const char1 = String.fromCharCode(codePoint1 - 127397);
    const codePoint2 = val.codePointAt(2) || val.codePointAt(1);
    const char2 =
      codePoint2 && codePoint2 >= 127462 && codePoint2 <= 127487
        ? String.fromCharCode(codePoint2 - 127397)
        : '';
    val = (char1 + char2).toLowerCase();
  } else {
    val = val.toLowerCase();
  }

  // Ánh xạ mã ngôn ngữ phổ biến sang mã quốc gia FlagCDN
  const langToCountryMap: Record<string, string> = {
    vi: 'vn',
    en: 'us',
    gb: 'gb',
    ja: 'jp',
    jp: 'jp',
    zh: 'cn',
    cn: 'cn',
    ko: 'kr',
    kr: 'kr',
    de: 'de',
    fr: 'fr',
    es: 'es',
    ru: 'ru',
    it: 'it',
  };

  if (langToCountryMap[val]) {
    val = langToCountryMap[val];
  } else if (val.length > 2) {
    val = val.substring(0, 2);
  }

  return `https://flagcdn.com/w20/${val}.png`;
}
