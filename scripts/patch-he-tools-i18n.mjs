/**
 * Patch messages/he.json Tools.items + Tools.cardDescriptions,
 * and locale-extensions/he.json Tools.intents for Hebrew i18n coverage.
 *
 * Run: node scripts/patch-he-tools-i18n.mjs
 */
import fs from "node:fs";

const hePath = "./messages/he.json";
const extPath = "./messages/locale-extensions/he.json";
const enCards = JSON.parse(fs.readFileSync("./scripts/data/_en-card-descriptions.json", "utf8"));
const he = JSON.parse(fs.readFileSync(hePath, "utf8"));
const ext = JSON.parse(fs.readFileSync(extPath, "utf8"));
const ru = JSON.parse(fs.readFileSync("./messages/ru.json", "utf8"));

/** camelCase hub key → kebab-case slug */
function camelToKebab(key) {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/** Collect Hebrew titles already present under *Page.tools */
const harvested = {};
for (const [ns, value] of Object.entries(he)) {
  if (!value || typeof value !== "object" || !value.tools) continue;
  for (const [key, title] of Object.entries(value.tools)) {
    if (typeof title !== "string") continue;
    harvested[camelToKebab(key)] = title;
  }
}

/** Explicit Hebrew titles for Tools.items (overrides + gaps). */
const ITEMS_HE = {
  ...harvested,
  "mp4-to-mp3": "MP4 ל-MP3",
  "video-converter": "ממיר וידאו",
  "video-metadata-cleaner": "ניקוי מטא-דאטה מווידאו",
  "video-muter": "השתקת וידאו",
  "video-resizer": "שינוי גודל וידאו",
  "video-rotator": "סיבוב וידאו",
  "video-speed": "בקרת מהירות וידאו",
  "video-speed-controller": "בקרת מהירות וידאו",
  "video-to-gif": "וידאו ל-GIF",
  "video-to-mp3": "וידאו ל-MP3",
  "video-trimmer": "חיתוך וידאו",
  "csv-to-markdown-table": "CSV לטבלת Markdown",
  "image-converter": "ממיר תמונות",
  "mp3-to-mp4": "MP3 ל-MP4",
  "mp3-to-wav": "MP3 ל-WAV",
  "sql-query-formatter": "מעצב שאילתות SQL",
  "wav-to-mp3": "WAV ל-MP3",
  "yaml-json-converter": "YAML ↔ JSON",
  "audio-compressor": "דחיסת אודיו",
  "mp3-compressor": "דחיסת MP3",
  "image-metadata-wiper": "ניקוי מטא-דאטה מתמונה",
  "image-dpi-converter": "המרת DPI לתמונה",
  "image-blur-redact": "טשטוש והסתרה בתמונה",
  "image-watermark": "סימן מים על תמונה",
  "image-grid-splitter": "פיצול תמונה לרשת",
  "svg-optimizer": "אופטימיזציית SVG",
  "audio-merger": "מיזוג אודיו",
  "audio-normalizer": "נרמול עוצמת אודיו",
  "audio-trimmer": "חיתוך אודיו",
  "fade-in-out-creator": "יצירת Fade In/Out",
  "flac-converter": "ממיר FLAC",
  "m4a-converter": "ממיר M4A",
  "mp3-converter": "ממיר MP3",
  "mp3-metadata-editor": "עורך מטא-דאטה ל-MP3",
  "mp3-speed-changer": "שינוי מהירות MP3",
  "mp3-trimmer": "חיתוך MP3",
  "mp3-volume-booster": "הגברת עוצמת MP3",
  "ogg-converter": "ממיר OGG",
  "silence-remover": "הסרת שקט",
  "voice-remover": "הסרת ווקאל",
  "favicon-generator": "מחולל Favicon",
  "base-converter": "ממיר בסיסי מספרים",
  "color-converter": "ממיר צבעים",
  "color-palette-extractor": "חילוץ פלטת צבעים",
  "hash-generator": "מחולל Hash",
  "my-ip": "כתובת ה-IP שלי",
  "password-generator": "מחולל סיסמאות",
  "ssl-decoder": "מפענח SSL",
  "storage-data-converter": "ממיר יחידות אחסון",
  "uuid-generator": "מחולל UUID",
  "global-timezone-converter": "ממיר אזורי זמן עולמי",
  // Fix previously untranslated English titles
  "base64-encoder-decoder": "מקודד / מפענח Base64",
  "html-markdown-converter": "ממיר HTML / Markdown",
  "case-converter": "ממיר רישיות",
  "json-csv-explorer": "סייר JSON ↔ CSV",
  "lorem-ipsum-generator": "מחולל Lorem Ipsum",
  "quick-note": "מנהל הערות מהיר",
  "readability-analyzer": "מנתח קריאות",
  "reading-time-calculator": "מחשבון זמן קריאה",
  "string-generator": "מחולל מחרוזות",
  "text-diff": "השוואת טקסט",
  "text-diff-checker": "בודק הבדלי טקסט",
  "text-sanitizer": "מנקה טקסט",
  "text-workspace": "סביבת עבודה לטקסט",
  "timezone-converter": "ממיר אזורי זמן",
  "unit-converter": "ממיר יחידות",
  "url-encoder-decoder": "מקודד / מפענח URL",
  "url-parameter-stripper": "מסיר פרמטרים מ-URL",
  "word-character-counter": "מונה מילים ותווים",
};

/** Hebrew card blurbs — full set aligned to EN TOOL_CARD_DESCRIPTIONS. */
const CARDS_HE = {
  "add-page-numbers": "הוסיפו מספרי עמוד ל-PDF עם מיקום ופורמט מותאמים.",
  "add-watermark": "הטביעו סימן מים טקסטואלי על PDF עם שקיפות, צבע וסיבוב.",
  "annotate-pdf": "הדגישו, ציירו והוסיפו פתקיות ל-PDF בדפדפן.",
  "apple-touch-icon": "צרו Apple Touch Icon בגודל הנכון מהלוגו שלכם.",
  "audio-compressor": "הקטינו קובץ אודיו תוך שמירה על איכות נגינה ברורה.",
  "audio-merger": "מזגו כמה קבצי אודיו לרצועה אחת רציפה.",
  "audio-normalizer": "נרמלו עוצמה בין רצועות לנגינה אחידה וחזקה יותר.",
  "audio-trimmer": "חתכו קליפי אודיו בדיוק לנקודת ההתחלה והסיום.",
  "autocad-to-pdf": "המירו שרטוטי AutoCAD לקבצי PDF לשיתוף.",
  "base-converter": "המירו מספרים בין בינארי, עשרוני, הקסדצימלי ועוד.",
  "base64-encoder-decoder": "קודדו או פענחו טקסט ונתוני Base64 מיידית.",
  "batch-rename-pdf": "שנו שמות לכמה קבצי PDF לפי תבניות ברורות ועקביות.",
  "case-converter": "המירו טקסט בין אותיות גדולות, קטנות, Title Case ועוד.",
  "color-converter": "המירו צבעים בין HEX, RGB, HSL ועוד.",
  "color-palette-extractor": "חלצו פלטת צבעים נקייה מכל תמונה.",
  "compare-pdf": "השוו שני PDF זה לצד זה וזהו שינויי טקסט במהירות.",
  "compress-image": "הקטינו גודל קובץ תמונה בלי ירידת איכות מורגשת.",
  "convert-to-png": "המירו תמונות ל-PNG לגרפיקה חדה ושקופה.",
  "crop-image": "חתכו תמונות למידות מותאמות או לאזור ממוקד.",
  "crop-pdf": "חתכו עמודי PDF כדי להסיר שוליים וקצוות מיותרים.",
  "csv-to-json": "המירו גיליונות CSV לנתוני JSON נקיים.",
  "csv-to-markdown-table": "הפכו נתוני CSV לטבלאות Markdown מוכנות להדבקה.",
  "custom-paper-margin": "שנו גודל עמודי PDF והגדירו שולי הדפסה מדויקים.",
  "data-converter-visualizer": "המירו ותצוגה מקדימה של פורמטי נתונים מובנים.",
  "delete-pdf-pages": "הסירו עמודים לא רצויים מ-PDF בכמה לחיצות.",
  "ebook-to-pdf": "המירו ספרים אלקטרוניים למסמכי PDF לשיתוף קל.",
  "excel-to-pdf": "המירו גיליונות Excel לקבצי PDF מלוטשים.",
  "extract-images": "חלצו תמונות מוטמעות מקבצי PDF.",
  "extract-pdf-pages": "חלצו עמודים נבחרים ל-PDF חדש.",
  "extract-tables-pdf": "חלצו טבלאות מ-PDF ל-CSV או Excel לעריכה.",
  "fade-in-out-creator": "הוסיפו אפקטי Fade-in ו-Fade-out חלקים לאודיו.",
  "favicon-code-generator": "צרו קטעי HTML ו-manifest לחבילת ה-Favicon.",
  "favicon-compressor": "הקטינו גודל קובץ Favicon לטעינת אתר מהירה יותר.",
  "favicon-cropper": "חתכו ומסגרו תמונות לאייקון Favicon נקי.",
  "favicon-generator": "צרו חבילות Favicon במספר גדלים מ-PNG, JPG או SVG.",
  "favicon-pack": "הורידו חבילת Favicon מלאה לכל הפלטפורמות.",
  "favicon-previewer": "צפו איך ה-Favicon נראה בדפדפנים ובמכשירים.",
  "flac-converter": "המירו FLAC לפורמטים נפוצים שניתן לנגן בכל מקום.",
  "flatten-pdf": "שטחו שכבות והערות ב-PDF לקובץ מוכן להדפסה.",
  "flip-image": "הפכו תמונות אופקית או אנכית בלחיצה אחת.",
  "generate-favicon": "צרו סט Favicon מהלוגו או מהתמונה שלכם.",
  "global-timezone-converter": "המירו שעות בין אזורי זמן ברחבי העולם מיידית.",
  "grayscale-pdf": "המירו PDF צבעוני לגווני אפור לחיסכון בדיו וגודל.",
  "hash-generator": "צרו האש מאובטח לטקסט או לקבצים.",
  "heic-to-jpg": "המירו תמונות HEIC ל-JPG לשיתוף אוניברסלי.",
  "heic-to-pdf": "המירו תמונות HEIC למסמכי PDF.",
  "html-markdown-converter": "המירו בין HTML ל-Markdown בצורה נקייה.",
  "html-to-pdf": "הפכו דפי HTML לקבצי PDF להורדה.",
  "ico-to-png": "המירו Favicon מסוג ICO לתמונות PNG.",
  "image-blur-redact": "טשטשו או הסתירו אזורים רגישים בתמונות.",
  "image-converter": "המירו תמונות בין פורמטים נפוצים במהירות.",
  "image-dpi-converter": "שנו DPI של תמונה להדפסה או למסך.",
  "image-grayscale": "המירו תמונות לשחור-לבן נקי.",
  "image-grid-splitter": "פצלו תמונות לאריחי רשת מוכנים לפוסטים.",
  "image-metadata-editor": "ערכו שדות מטא-דאטה בתמונה לפני השיתוף.",
  "image-metadata-wiper": "הסירו EXIF ומטא-דאטה מוסתר מתמונות.",
  "image-optimizer": "מטבו תמונות להקטנת גודל תוך שמירה על חדות.",
  "image-watermark": "הוסיפו סימן מים טקסטואלי או לוגו להגנה על תמונות.",
  "invoice-generator": "צרו חשבוניות מקצועיות והורידו אותן כ-PDF.",
  "iwork-to-pdf": "המירו מסמכי Apple iWork ל-PDF.",
  "jpg-to-pdf": "שלבו תמונות JPG ל-PDF אחד.",
  "json-csv-explorer": "חקרו והמירו בין נתוני JSON ו-CSV.",
  "json-formatter": "פרמטו וייפו JSON לקריאה נוחה יותר.",
  "json-minifier": "כווצו JSON להקטנת גודל המטען.",
  "json-to-csv": "המירו נתוני JSON ל-CSV מוכן לגיליון.",
  "jwt-debugger": "פענחו ובדקו אסימוני JWT בבטחה בדפדפן.",
  "lorem-ipsum-generator": "צרו טקסט מקום להדמיות וטיוטות.",
  "m4a-converter": "המירו אודיו M4A לפורמטים לשימוש בכל מקום.",
  "markdown-to-pdf": "המירו מסמכי Markdown ל-PDF מלוטש.",
  "mp3-compressor": "הקטינו קובץ MP3 תוך שמירה על אודיו ברור.",
  "mp3-converter": "המירו קבצי אודיו ל-MP3 במהירות ובפרטיות.",
  "mp3-metadata-editor": "ערכו תגי MP3 כמו כותרת, אמן ואלבום.",
  "mp3-speed-changer": "האיצו או האטו נגינת MP3 מיידית.",
  "mp3-to-mp4": "המירו MP3 לקובץ MP4 עם וידאו פשוט.",
  "mp3-to-wav": "המירו MP3 ל-WAV לאיכות ללא דחיסה.",
  "mp3-trimmer": "חתכו קבצי MP3 לטווח ההתחלה והסיום המדויק.",
  "mp3-volume-booster": "הגבירו או הנמיכו עוצמת MP3 מקומית.",
  "mp4-to-mp3": "חלצו אודיו מ-MP4 לקובץ MP3.",
  "my-ip": "הציגו את כתובת ה-IP הציבורית שלכם מיידית.",
  "n-up-pdf": "סדרו כמה עמודי PDF בגיליון אחד להדפסה.",
  "ogg-converter": "המירו אודיו OGG לפורמטים נפוצים יותר.",
  "openoffice-to-pdf": "המירו מסמכי OpenOffice ל-PDF.",
  "paint-on-image": "ציירו והוסיפו הערות על תמונות בדפדפן.",
  "password-generator": "צרו סיסמאות חזקות ומאובטחות מקומית.",
  "pdf-a-converter": "המירו PDF ל-PDF/A לארכיון לטווח ארוך.",
  "pdf-compress": "הקטינו גודל PDF לשליחה או העלאה.",
  "pdf-editor": "ערכו PDF עם כלים מקומיים בדפדפן.",
  "pdf-linearization": "ליניאריזציה של PDF לטעינה מהירה באינטרנט.",
  "pdf-merge": "מזגו כמה קבצי PDF לקובץ אחד.",
  "pdf-metadata-editor": "ערכו מטא-דאטה של PDF לפני שיתוף.",
  "pdf-password-recovery": "שחזרו סיסמת PDF קצרה שנשכחה.",
  "pdf-signature-validator": "אמתו חתימות דיגיטליות ב-PDF.",
  "pdf-split": "פצלו PDF לעמודים או קטעים נפרדים.",
  "pdf-text-editor": "הוסיפו או החליפו טקסט גלוי ב-PDF.",
  "pdf-to-booklet": "המירו PDF לפריסת חוברת להדפסה.",
  "pdf-to-epub": "המירו PDF ל-EPUB/MOBI לקריאה ניידת.",
  "pdf-to-excel": "המירו טבלאות PDF לגיליון Excel.",
  "pdf-to-html": "המירו PDF ל-HTML לעריכה באינטרנט.",
  "pdf-to-jpg": "ייצאו עמודי PDF כתמונות JPG.",
  "pdf-to-png": "ייצאו עמודי PDF כתמונות PNG.",
  "pdf-to-powerpoint": "המירו PDF למצגת PowerPoint.",
  "pdf-to-text": "חלצו טקסט מ-PDF לעריכה או ארכיון.",
  "pdf-to-word": "המירו PDF למסמך Word לעריכה.",
  "pdf-to-xps": "המירו PDF ל-XPS.",
  "png-to-ico": "המירו PNG לאייקון ICO.",
  "png-to-pdf": "המירו תמונות PNG ל-PDF.",
  "powerpoint-to-pdf": "המירו מצגות PowerPoint ל-PDF.",
  "protect-pdf": "הגנו על PDF בסיסמה מקומית בדפדפן.",
  "qr-code-generator": "צרו קודי QR מטקסט או קישור.",
  "quick-note": "שמרו ונהלו הערות קצרות באופן פרטי במכשיר.",
  "readability-analyzer": "בדקו קריאות טקסט וקבלו טיפים לכתיבה ברורה.",
  "reading-time-calculator": "העריכו כמה זמן לוקח לקרוא טקסט.",
  "redact-pdf": "הסתירו מידע רגיש ב-PDF לפני שיתוף.",
  "remove-hidden-metadata": "הסירו מטא-דאטה נסתר מ-PDF לפני שיתוף.",
  "reorder-pdf-pages": "סדרו מחדש עמודי PDF בגרירה.",
  "repair-pdf": "תקנו PDF פגום בסריקה ובנייה מחדש מקומית.",
  "resize-image": "שנו גודל תמונה בפיקסלים או באחוזים.",
  "rotate-image": "סובבו ויישרו תמונות בדפדפן.",
  "rotate-pdf": "סובבו עמודי PDF לכיוון הנכון.",
  "safe-to-share-auditor": "בדקו PDF לפני שיתוף לאיתור תוכן רגיש.",
  "sign-pdf": "חתמו על PDF עם החתימה שלכם בדפדפן.",
  "silence-remover": "הסירו קטעי שקט מרצועות אודיו.",
  "ssl-decoder": "פענחו פרטי תעודת SSL/TLS מקומית.",
  "storage-data-converter": "המירו בין יחידות אחסון כמו MB, GB ו-TB.",
  "string-generator": "צרו מחרוזות אקראיות ו-UUID לבדיקות ומזהים.",
  "svg-optimizer": "מטבו קבצי SVG להקטנת גודל וניקוי קוד.",
  "svg-to-favicon": "המירו SVG לחבילת Favicon.",
  "svg-to-png": "המירו SVG ל-PNG באיכות גבוהה.",
  "text-diff": "השוו שני טקסטים והדגישו כל שינוי.",
  "text-diff-checker": "השוו טקסט מקורי ומעודכן זה לצד זה.",
  "text-sanitizer": "נקו טקסט מ-OCR ו-PDF — רווחים, שורות ותווים נסתרים.",
  "text-workspace": "כתבו, מצאו, החליפו וייצאו טקסט בסביבה פרטית.",
  "timeline-gantt-generator": "בנו ציר זמן ותרשים גאנט והורידו כ-PDF.",
  "timezone-converter": "המירו שעות בין אזורי זמן ברחבי העולם.",
  "transparent-favicon": "צרו Favicon עם רקע שקוף.",
  "unit-converter": "המירו אורך, משקל, טמפרטורה ועוד.",
  "unlock-pdf": "הסירו סיסמה מ-PDF שאתם מורשים לפתוח.",
  "url-encoder-decoder": "קודדו או פענחו מחרוזות URL בבטחה בדפדפן.",
  "url-parameter-stripper": "הסירו פרמטרי מעקב מכתובות URL מקומית.",
  "user-agent-parser": "פענחו מחרוזות User-Agent לדפדפן ומכשיר.",
  "uuid-generator": "צרו מזהי UUID ייחודיים מיידית.",
  "video-compressor": "הקטינו גודל קובץ וידאו תוך שמירה על איכות סבירה.",
  "video-converter": "המירו וידאו בין פורמטים נפוצים מקומית.",
  "video-metadata-cleaner": "הסירו מטא-דאטה מווידאו (זמן צילום, GPS, דגם מכשיר) מקומית.",
  "video-muter": "השתיקו את שמע הווידאו בלי לקודד מחדש את התמונה.",
  "video-resizer": "שנו רזולוציית וידאו למידות יעד ברורות.",
  "video-rotator": "סובבו וידאו לכיוון הנכון מקומית בדפדפן.",
  "video-speed": "שנו את מהירות הנגינה של הווידאו.",
  "video-speed-controller": "שלטו במהירות הווידאו — האצה או האטה.",
  "video-to-gif": "המירו קטעי וידאו ל-GIF מונפש.",
  "video-to-mp3": "חלצו אודיו מווידאו לקובץ MP3.",
  "video-to-mp4": "המירו וידאו לקבצי MP4 תואמים לרוב המכשירים.",
  "video-trimmer": "חתכו קליפים מווידאו ישירות בדפדפן.",
  "voice-remover": "הפחיתו ווקאל כדי לבודד רצועות אינסטרומנטליות.",
  "wav-to-mp3": "המירו הקלטות WAV לקבצי MP3 קומפקטיים.",
  "webp-to-jpg": "המירו WebP ל-JPG לתאימות רחבה יותר.",
  "word-character-counter": "ספרו מילים, תווים ומדדי קריאה מיידית.",
  "word-to-pdf": "המירו מסמכי Word לקבצי PDF לשיתוף.",
  "yaml-json-converter": "המירו בין YAML ל-JSON עם עיצוב נקי.",
};

/** Extra intents for tools missing from locale-extensions (video/audio/etc.). */
const INTENTS_HE = {
  "video-metadata-cleaner":
    "הסירו מטא-דאטה מווידאו (זמן צילום, GPS ודגם מכשיר) מקומית עם העתקת זרם — בלי העלאה לשרת.",
  "video-trimmer": "חתכו קטעי וידאו לטווח התחלה וסיום מדויק בדפדפן.",
  "video-muter": "השתיקו שמע בווידאו בלי לקודד מחדש את התמונה.",
  "video-speed": "שנו את מהירות הנגינה של קובץ הווידאו מקומית.",
  "video-speed-controller": "שלטו במהירות הווידאו — האצה או האטה — מקומית בדפדפן.",
  "video-resizer": "שנו את רזולוציית הווידאו למידות היעד שלכם.",
  "video-rotator": "סובבו וידאו לכיוון הנכון בלי להעלות קבצים.",
  "video-converter": "המירו וידאו בין פורמטים נפוצים מקומית בדפדפן.",
  "video-to-gif": "המירו קטע וידאו ל-GIF מונפש מקומית.",
  "video-to-mp3": "חלצו אודיו מווידאו לקובץ MP3 במכשיר שלכם.",
  "mp4-to-mp3": "חלצו אודיו מ-MP4 לקובץ MP3 מקומית.",
  "video-to-mp4": "המירו וידאו ל-MP4 תואם לרוב המכשירים.",
  "video-compressor": "הקטינו גודל קובץ וידאו מקומית בדפדפן.",
  "audio-trimmer": "חתכו אודיו לפי גל — התחלה וסיום מדויקים.",
  "audio-compressor": "הקטינו קובץ אודיו תוך שמירה על בהירות.",
  "audio-merger": "מזגו כמה קבצי אודיו לרצועה אחת.",
  "audio-normalizer": "נרמלו עוצמת אודיו לנגינה אחידה.",
  "mp3-trimmer": "חתכו קבצי MP3 לטווח הרצוי מקומית.",
  "mp3-converter": "המירו אודיו ל-MP3 במהירות ובפרטיות.",
  "mp3-compressor": "הקטינו קובץ MP3 מקומית בדפדפן.",
  "mp3-volume-booster": "התאימו עוצמת MP3 מקומית.",
  "mp3-speed-changer": "שנו מהירות נגינת MP3 מקומית.",
  "mp3-metadata-editor": "ערכו תגי MP3 כמו כותרת ואמן במכשיר.",
  "image-metadata-wiper": "הסירו EXIF ומטא-דאטה מוסתר מתמונות מקומית.",
  "image-watermark": "הוסיפו סימן מים לתמונות להגנה לפני שיתוף.",
  "image-blur-redact": "טשטשו או הסתירו אזורים רגישים בתמונה.",
  "password-generator": "צרו סיסמאות חזקות מקומית בדפדפן.",
  "hash-generator": "צרו האש לטקסט או קבצים מקומית.",
  "uuid-generator": "צרו מזהי UUID ייחודיים מיידית.",
  "my-ip": "הציגו את כתובת ה-IP הציבורית שלכם.",
  "favicon-generator": "צרו חבילת Favicon מהתמונה שלכם מקומית.",
  "unit-converter": "המירו יחידות אורך, משקל ושטח מקומית.",
  "timezone-converter": "המירו שעות בין אזורי זמן מקומית.",
  "case-converter": "המירו רישיות טקסט בין פורמטים נפוצים.",
  "word-character-counter": "ספרו מילים ותווים בטקסט מקומית.",
  "yaml-json-converter": "המירו בין YAML ל-JSON מקומית בדפדפן.",
  "csv-to-markdown-table": "הפכו CSV לטבלת Markdown מוכנה להדבקה.",
  "sql-query-formatter": "פרמטו שאילתות SQL לקריאה נוחה יותר.",
};

// --- Apply items ---
he.Tools = he.Tools || {};
he.Tools.items = { ...he.Tools.items, ...ITEMS_HE };

// Ensure every RU item key exists in HE (fallback to harvested/ITEMS or keep existing)
for (const slug of Object.keys(ru.Tools?.items || {})) {
  if (!he.Tools.items[slug]) {
    he.Tools.items[slug] = ITEMS_HE[slug] || harvested[slug] || ru.Tools.items[slug];
  }
}

// --- Apply cardDescriptions ---
he.Tools.cardDescriptions = { ...he.Tools.cardDescriptions, ...CARDS_HE };
for (const slug of Object.keys(enCards)) {
  if (!he.Tools.cardDescriptions[slug]) {
    he.Tools.cardDescriptions[slug] = CARDS_HE[slug] || enCards[slug];
  }
}

// --- Apply intents in extensions ---
ext.Tools = ext.Tools || {};
ext.Tools.intents = { ...(ext.Tools.intents || {}), ...INTENTS_HE };
// Prefer card description as intent when still missing
for (const slug of Object.keys(he.Tools.cardDescriptions)) {
  if (!ext.Tools.intents[slug]) {
    ext.Tools.intents[slug] = he.Tools.cardDescriptions[slug];
  }
}

fs.writeFileSync(hePath, JSON.stringify(he, null, 2) + "\n");
fs.writeFileSync(extPath, JSON.stringify(ext, null, 2) + "\n");

const stillEnItems = Object.entries(he.Tools.items).filter(([, v]) => /^[A-Za-z0-9 /↔|&'.\-]+$/.test(v));
console.log("HE items:", Object.keys(he.Tools.items).length);
console.log("HE cards:", Object.keys(he.Tools.cardDescriptions).length);
console.log("HE intents:", Object.keys(ext.Tools.intents).length);
console.log("Possibly still-English item titles:", stillEnItems.length, stillEnItems.slice(0, 15).map(([k]) => k));
