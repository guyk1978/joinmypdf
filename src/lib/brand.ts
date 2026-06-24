export const BRAND_NAME_EN = "JoinMyPDF";
export const BRAND_NAME_HE = "הצטרף לפידיאף שלי";
/** Hebrew logo wordmark split around the eye mark (mirrors JOINMY + eye + PDF). */
export const BRAND_LOGO_HE_BEFORE = "הצטרף ל";
export const BRAND_LOGO_HE_AFTER = "פידיאף שלי";

export function getBrandName(locale?: string): string {
  return locale === "he" ? BRAND_NAME_HE : BRAND_NAME_EN;
}