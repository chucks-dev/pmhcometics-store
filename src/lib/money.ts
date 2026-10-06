/** All amounts in the database and API are integer kobo. */
export const formatNaira = (kobo: number | string): string =>
  "₦" + (Number(kobo) / 100).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export const nairaToKobo = (naira: number | string): number => Math.round(Number(naira) * 100);
export const koboToNaira = (kobo: number | string): number => Number(kobo) / 100;
