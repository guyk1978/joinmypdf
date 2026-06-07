/** Workspaces status/progress labels — imported by generate-locale-extensions.mjs */

function op(locale, en, he) {
  return locale === "he" ? he : en;
}

function buildWorkspaces(locale) {
  const isHe = locale === "he";

  const common = {
    choosePdf: isHe ? "בחר קובץ PDF." : "Please choose a PDF file.",
    emptyPdf: isHe ? "הקובץ ריק. בחר PDF אחר." : "That file is empty. Choose another PDF.",
    chooseDocx: isHe ? "בחר קובץ Word בפורמט .docx." : "Please choose a .docx Word file.",
    emptyDocx: isHe ? "הקובץ ריק. בחר מסמך אחר." : "That file is empty. Choose another document.",
    chooseXlsx: isHe ? "בחר קובץ Excel בפורמט .xlsx." : "Please choose a .xlsx Excel file.",
    emptyXlsx: isHe ? "הקובץ ריק. בחר חוברת עבודה אחרת." : "That file is empty. Choose another workbook.",
    choosePptx: isHe ? "בחר קובץ PowerPoint בפורמט .pptx." : "Please choose a .pptx PowerPoint file.",
    emptyPptx: isHe ? "הקובץ ריק. בחר מצגת אחרת." : "That file is empty. Choose another presentation.",
    readingPdf: isHe ? "קורא PDF…" : "Reading PDF…",
    readingWorkbook: isHe ? "קורא חוברת עבודה…" : "Reading workbook…",
    fileReadyAction: isHe ? "{name} מוכן — {action} כשתרצה." : "{name} ready — {action} when you are.",
    conversionCompletePdf: isHe
      ? "ההמרה הושלמה. הורד את ה-PDF למטה."
      : "Conversion complete. Download your PDF below.",
    conversionCompleteLandscapePdf: isHe
      ? "ההמרה הושלמה. הורד את ה-PDF לרוחב למטה."
      : "Conversion complete. Download your landscape PDF below.",
    conversionCompleteWord: isHe
      ? "ההמרה הושלמה. הורד את מסמך Word למטה."
      : "Conversion complete. Download your Word document below.",
    conversionCompleteText: isHe
      ? "ההמרה הושלמה. הורד את קובץ הטקסט למטה."
      : "Conversion complete. Download your text file below.",
    couldNotOpenPdf: isHe
      ? "לא ניתן לפתוח את ה-PDF. אם הוא מוגן, הזן את הסיסמה למטה."
      : "Could not open this PDF. If it is protected, enter the password below.",
    wrongPassword: isHe ? "לא ניתן לפתוח עם הסיסמה הזו. בדוק ונסה שוב." : "Could not open with that password. Check and try again.",
    enterPassword: isHe ? "הזן את סיסמת ה-PDF כדי לפתוח את הקובץ." : "Enter the PDF password to open this file.",
    adjustTryAgain: isHe ? "התאם ונסה שוב." : "Adjust and try again.",
    tryAgainOrChoose: isHe ? "נסה שוב או בחר קובץ אחר." : "Try again or choose another file.",
    conversionCompleteAuto: isHe
      ? "ההמרה הושלמה. ההורדה אמורה להתחיל אוטומטית."
      : "Conversion complete. Your download should start automatically.",
    chooseOdf: isHe
      ? "בחר קובץ OpenOffice (.odt, .ods או .odp)."
      : "Please choose a .odt, .ods, or .odp OpenOffice file.",
    emptyOdf: isHe ? "הקובץ ריק. בחר מסמך אחר." : "That file is empty. Choose another document.",
    chooseEpub: isHe ? "בחר קובץ .epub." : "Please choose an .epub file.",
    emptyEpub: isHe ? "הקובץ ריק. בחר ספר אלקטרוני אחר." : "That file is empty. Choose another eBook.",
    chooseIwork: isHe
      ? "בחר קובץ .pages, .numbers או .keynote."
      : "Please choose a .pages, .numbers, or .keynote file.",
    emptyIwork: isHe ? "הקובץ ריק. בחר מסמך iWork אחר." : "That file is empty. Choose another iWork document.",
    chooseCad: isHe
      ? "בחר קובץ שרטוט AutoCAD (.dxf או .dwg)."
      : "Please choose a .dxf or .dwg AutoCAD drawing file.",
    emptyCad: isHe ? "הקובץ ריק. בחר שרטוט אחר." : "That file is empty. Choose another drawing.",
    noHeicFiles: isHe
      ? "לא זוהו קבצי HEIC/HEIF. בחר תמונות .heic או .heif."
      : "No HEIC/HEIF files detected. Choose .heic or .heif images.",
    resetSample: isHe ? "אפס לדוגמה" : "Reset sample",
    remove: isHe ? "הסר" : "Remove",
    dropPdfHint: isHe ? "גרור PDF לכאן או לחץ לעיון" : "Drop a PDF here or click to browse",
    pageNumber: isHe ? "עמוד {page}" : "Page {page}",
    readyLabel: isHe ? "מוכן:" : "Ready:",
    renderingPage: isHe ? "מרנדר עמוד…" : "Rendering page…",
    clearAll: isHe ? "נקה הכל" : "Clear all",
    untitledBook: isHe ? "ספר ללא שם" : "Untitled book",
    chapterCount: isHe ? "{count} פרק/ים" : "{count} chapter(s)",
    loadPages: isHe ? "טען עמודים" : "Load pages",
    enterPasswordPreview: isHe ? "הזן סיסמה לתצוגה מקדימה" : "Enter password to preview pages",
    loadingPdf: isHe ? "טוען PDF…" : "Loading PDF…",
    downloadAllZip: isHe ? "הורד הכל כ-ZIP" : "Download all as ZIP",
    selectedFile: isHe ? "קובץ נבחר" : "Selected file",
    chooseAnotherFile: isHe ? "בחר קובץ אחר" : "Choose another file",
    clientSideOnly: isHe ? "רק בצד הלקוח" : "Client-side only",
    processing: isHe ? "מעבד…" : "Processing…",
    optional: isHe ? "אופציונלי" : "Optional",
    undo: isHe ? "בטל" : "Undo",
    loadingPreview: isHe ? "טוען תצוגה מקדימה…" : "Loading preview…",
    pageCount: isHe ? "{count} עמוד/ים" : "{count} page(s)",
    slideCount: isHe ? "{count} שקף/ים" : "{count} slide(s)",
    mbUnit: "MB",
    formatPdf: "PDF",
    formatPng: "PNG",
    formatJpg: "JPG",
    imagePreviews: isHe ? "תצוגות מקדימות של תמונות" : "Image previews",
    activePage: isHe ? "עמוד פעיל" : "Active page",
    close: isHe ? "סגור" : "Close",
    fontSizePx: "{size}px",
    presets: {
      paper: {
        letter: isHe ? 'Letter ארה"ב (8.5" × 11")' : 'US Letter (8.5" × 11")',
        a4: isHe ? "A4 (210 × 297 מ\"מ)" : "A4 (210 × 297 mm)",
        a5: isHe ? "A5 (148 × 210 מ\"מ)" : "A5 (148 × 210 mm)",
        b5: isHe ? "B5 (176 × 250 מ\"מ)" : "B5 (176 × 250 mm)",
        legal: isHe ? 'Legal ארה"ב (8.5" × 14")' : 'US Legal (8.5" × 14")',
        tabloid: isHe ? 'Tabloid / A3 (11" × 17")' : 'Tabloid / A3 (11" × 17")',
      },
      watermarkPosition: {
        center: isHe ? "מרכז" : "Center",
        topLeft: isHe ? "למעלה משמאל" : "Top left",
        topCenter: isHe ? "למעלה במרכז" : "Top center",
        topRight: isHe ? "למעלה מימין" : "Top right",
        middleLeft: isHe ? "אמצע משמאל" : "Middle left",
        middleRight: isHe ? "אמצע מימין" : "Middle right",
        bottomLeft: isHe ? "למטה משמאל" : "Bottom left",
        bottomCenter: isHe ? "למטה במרכז" : "Bottom center",
        bottomRight: isHe ? "למטה מימין" : "Bottom right",
      },
      pageNumberPosition: {
        topLeft: isHe ? "למעלה משמאל" : "Top Left",
        topCenter: isHe ? "למעלה במרכז" : "Top Center",
        topRight: isHe ? "למעלה מימין" : "Top Right",
        bottomLeft: isHe ? "למטה משמאל" : "Bottom Left",
        bottomCenter: isHe ? "למטה במרכז" : "Bottom Center",
        bottomRight: isHe ? "למטה מימין" : "Bottom Right",
      },
      pageNumberColor: {
        black: isHe ? "שחור" : "Black",
        gray: isHe ? "אפור" : "Gray",
        blue: isHe ? "כחול" : "Blue",
        red: isHe ? "אדום" : "Red",
      },
      duplexFlip: {
        longEdge: isHe
          ? "הדפס duplex עם היפוך על הקצה הארוך (סטנדרטי לחוברות לאורך)."
          : "Print duplex with flip on the long edge (standard for portrait booklets).",
        shortEdge: isHe
          ? "הדפס duplex עם היפוך על הקצה הקצר (נפוץ לפריסות לרוחב)."
          : "Print duplex with flip on the short edge (common for landscape layouts).",
      },
      auditKind: {
        regex: isHe ? "התאמת דפוס" : "Pattern match",
        annotation: isHe ? "הערה" : "Annotation",
        signature: isHe ? "חתימה" : "Signature",
        hiddenComment: isHe ? "הערה נסתרת" : "Hidden comment",
      },
      auditPattern: {
        "credit-card": isHe ? "מספר כרטיס אשראי / חיוב" : "Credit / debit card number",
        ssn: isHe ? "מספר ביטוח לאומי (ארה\"ב)" : "US Social Security number",
        "israel-id": isHe ? "מספר ת.ז (ישראל)" : "Israeli ID number (ת.ז)",
        "id-label-he": isHe ? "תווית ת.ז / תעודת זהות" : "ID label (ת.ז / תעודת זהות)",
        iban: isHe ? "IBAN / חשבון בנק" : "IBAN / bank account",
        email: isHe ? "כתובת דוא\"ל" : "Email address",
        phone: isHe ? "מספר טלפון" : "Phone number",
        "confidential-en": isHe ? "סימון סודי (אנגלית)" : "Confidential marker",
        "confidential-he": isHe ? "סימון סודי (עברית)" : "Hebrew confidential marker",
        password: isHe ? "תווית סיסמה / אישורים" : "Password / credential label",
        "signature-text": isHe ? "טקסט בלוק חתימה" : "Signature block text",
      },
      auditFinding: {
        hiddenSignature: isHe ? "שדה חתימה נסתר" : "Hidden signature field",
        signatureInk: isHe ? "חתימה או סימון דיו" : "Signature or ink markup",
        hiddenComment: isHe ? "הערת {subtype} נסתרת" : "Hidden {subtype} comment",
        visibleComment: isHe ? "הערת {subtype}" : "{subtype} annotation",
      },
      iworkPackage: isHe ? "חבילת מסמך Apple iWork" : "Apple iWork document package",
      marginSide: {
        top: isHe ? "עליון" : "Top",
        right: isHe ? "ימין" : "Right",
        bottom: isHe ? "תחתון" : "Bottom",
        left: isHe ? "שמאל" : "Left",
      },
      metadataField: {
        title: isHe ? "כותרת" : "Title",
        author: isHe ? "מחבר" : "Author",
        subject: isHe ? "נושא" : "Subject",
        keywords: isHe ? "מילות מפתח" : "Keywords",
        creator: isHe ? "יישום יוצר" : "Creator application",
        producer: isHe ? "תוכנת ייצור" : "Producer software",
        creationDate: isHe ? "תאריך יצירה" : "Creation date",
        modificationDate: isHe ? "תאריך שינוי" : "Modification date",
        "xmp-packet": isHe ? "חבילת מטא-דאטה XMP" : "XMP metadata packet",
        "xmp-creator": isHe ? "כלי יוצר XMP" : "XMP creator tool",
        "xmp-author": isHe ? "מחבר XMP" : "XMP author",
        "xmp-title": isHe ? "כותרת XMP" : "XMP title",
        "xmp-software": isHe ? "תוכנה XMP" : "XMP software",
      },
    },
  };

  const convertProgress = {
    loading: isHe ? "טוען PDF…" : "Loading PDF…",
    building: isHe ? "בונה…" : "Building…",
    parsing: isHe ? "מנתח…" : "Parsing…",
    rendering: isHe ? "מרנדר פריסה…" : "Rendering layout…",
    buildingPdf: isHe ? "בונה PDF…" : "Building PDF…",
    buildingLandscapePdf: isHe ? "בונה PDF לרוחב…" : "Building landscape PDF…",
    extractingPage: isHe
      ? "מחלץ — עמוד {current} מתוך {total}…"
      : "Extracting — page {current} of {total}…",
    extractingTextPage: isHe
      ? "מחלץ טקסט — עמוד {current} מתוך {total}…"
      : "Extracting text — page {current} of {total}…",
    extractingRowsPage: isHe
      ? "מחלץ שורות — עמוד {current} מתוך {total}…"
      : "Extracting rows — page {current} of {total}…",
    readingSlide: isHe
      ? "קורא שקף {current} מתוך {total}…"
      : "Reading slide {current} of {total}…",
    readingPresentation: isHe ? "קורא מצגת…" : "Reading presentation…",
    renderingSheets: isHe ? "מרנדר {count} גיליון/ים…" : "Rendering {count} sheet(s)…",
    renderingTables: isHe ? "מרנדר טבלאות…" : "Rendering spreadsheet tables…",
    readingWorkbook: isHe ? "קורא חוברת Excel…" : "Reading Excel workbook…",
    buildingWord: isHe ? "בונה מסמך Word…" : "Building Word document…",
    buildingExcel: isHe ? "בונה חוברת Excel…" : "Building Excel workbook…",
    buildingPowerpoint: isHe ? "בונה קובץ PowerPoint…" : "Building PowerPoint file…",
    buildingText: isHe ? "בונה קובץ טקסט…" : "Building text file…",
    preparingFlatten: isHe ? "מכין שיטוח…" : "Preparing flatten…",
    flatteningPage: isHe
      ? "משטח עמוד {current} מתוך {total}…"
      : "Flattening page {current} of {total}…",
    processing: isHe ? "מעבד…" : "Processing…",
  };

  return {
    common,
    "word-to-pdf": {
      status: {
        invalidType: common.chooseDocx,
        emptyFile: common.emptyDocx,
        fileReady: op(locale, "{name} ready — convert to PDF when you are.", "{name} מוכן — המר ל-PDF כשתרצה."),
      },
      progress: {
        parsing: isHe ? "מנתח מסמך Word…" : "Parsing Word document…",
        rendering: isHe ? "מרנדר פריסת מסמך…" : "Rendering document layout…",
        building: convertProgress.buildingPdf,
      },
      privacyNote: isHe
        ? "ניתוח Word ויצירת PDF רצים לחלוטין בדפדפן. המסמך לא עוזב את המכשיר."
        : "Word parsing and PDF generation run entirely in your browser. Your document never leaves your device.",
      convertLabel: isHe ? "המר ל-PDF" : "Convert to PDF",
      downloadLabel: isHe ? "הורד PDF" : "Download PDF",
      stickyDownloadLabel: isHe ? "הורד PDF" : "Download PDF",
      stickyConvertLabel: isHe ? "המר ל-PDF" : "Convert to PDF",
    },
    "excel-to-pdf": {
      status: {
        invalidType: common.chooseXlsx,
        emptyFile: common.emptyXlsx,
        sheetsReady: isHe
          ? "{name} מוכן — זוהו {count} גיליון/ים."
          : "{name} ready — {count} sheet(s) detected.",
      },
      progress: {
        parsing: convertProgress.readingWorkbook,
        rendering: convertProgress.renderingTables,
        renderingSheets: convertProgress.renderingSheets,
        building: convertProgress.buildingLandscapePdf,
      },
      privacyNote: isHe
        ? "ניתוח Excel ויצירת PDF רצים לחלוטין בדפדפן. הגיליון לא עוזב את המכשיר."
        : "Excel parsing and PDF generation run entirely in your browser. Your spreadsheet never leaves your device.",
      fileTypeLabel: isHe ? "Excel (.xlsx)" : "Excel (.xlsx)",
      convertLabel: isHe ? "המר ל-PDF" : "Convert to PDF",
      downloadLabel: isHe ? "הורד PDF" : "Download PDF",
      outputHint: isHe
        ? "כל הגיליונות הלא-ריקים מיוצאים ל-PDF לרוחב. טבלאות רחבות עלולות להתכווץ."
        : "All non-empty sheets export into one landscape PDF. Wide tables may shrink to fit page width.",
      readySuffix: isHe ? " · A4 לרוחב" : " · landscape A4",
      stickyDownloadLabel: isHe ? "הורד PDF" : "Download PDF",
      stickyConvertLabel: isHe ? "המר ל-PDF" : "Convert to PDF",
    },
    "powerpoint-to-pdf": {
      status: {
        invalidType: common.choosePptx,
        emptyFile: common.emptyPptx,
      },
      progress: {
        parsing: convertProgress.readingPresentation,
        readingSlide: convertProgress.readingSlide,
        rendering: isHe ? "מרנדר פריסת שקפים…" : "Rendering slide layout…",
        building: convertProgress.buildingLandscapePdf,
      },
      privacyNote: isHe
        ? "ניתוח PowerPoint ויצירת PDF רצים בדפדפן. המצגת לא עוזבת את המכשיר."
        : "PowerPoint parsing and PDF generation run entirely in your browser. Your presentation never leaves your device.",
      fileTypeLabel: isHe ? "PowerPoint (.pptx)" : "PowerPoint (.pptx)",
      convertLabel: isHe ? "המר ל-PDF" : "Convert to PDF",
      downloadLabel: isHe ? "הורד PDF" : "Download PDF",
      outputHint: isHe
        ? "טקסט השקפים מיוצא ל-PDF לרוחב. תמונות, אנימציות ופריסות מורכבות עלולות להפשט."
        : "Slide text exports into a landscape PDF. Images, animations, and complex layouts may simplify.",
      stickyDownloadLabel: isHe ? "הורד PDF" : "Download PDF",
      stickyConvertLabel: isHe ? "המר ל-PDF" : "Convert to PDF",
    },
    "pdf-to-word": {
      status: {
        invalidType: common.choosePdf,
        emptyFile: common.emptyPdf,
        fileReady: op(locale, "{name} ready — convert to Word when you are.", "{name} מוכן — המר ל-Word כשתרצה."),
      },
      progress: {
        loading: convertProgress.loading,
        building: convertProgress.buildingWord,
        extractingPage: convertProgress.extractingTextPage,
      },
      privacyNote: isHe
        ? "ניתוח PDF וייצוא Word רצים בדפדפן. המסמך לא עוזב את המכשיר."
        : "PDF parsing and Word export run entirely in your browser. Your document never leaves your device.",
      convertLabel: isHe ? "המר ל-Word" : "Convert to Word",
      downloadLabel: isHe ? "הורד מסמך Word (.docx)" : "Download Word document (.docx)",
      outputHint: isHe
        ? "מתאים ל-PDF עם טקסט ניתן לבחירה. עמודים סרוקים בלבד עשויים לדרוש OCR."
        : "Best for PDFs with selectable text. Scanned image-only pages may need OCR in another app.",
      stickyDownloadLabel: isHe ? "הורד .docx" : "Download .docx",
      stickyConvertLabel: isHe ? "המר ל-Word" : "Convert to Word",
    },
    "pdf-to-excel": {
      status: {
        invalidType: common.choosePdf,
        emptyFile: common.emptyPdf,
      },
      progress: {
        loading: convertProgress.loading,
        building: convertProgress.buildingExcel,
        extractingPage: convertProgress.extractingRowsPage,
      },
      privacyNote: isHe
        ? "ניתוח PDF ויצירת Excel רצים בדפדפן. המסמך לא עוזב את המכשיר."
        : "PDF parsing and Excel generation run entirely in your browser. Your document never leaves your device.",
      fileTypeLabel: isHe ? "PDF" : "PDF",
      convertLabel: isHe ? "המר ל-Excel" : "Convert to Excel",
      downloadLabel: isHe ? "הורד Excel (.xlsx)" : "Download Excel (.xlsx)",
      outputHint: isHe
        ? "כל עמוד PDF הופך לגיליון עם טקסט מקובץ לפי מיקום. טבלאות עשויות לדרוש ניקוי."
        : "Each PDF page becomes a worksheet with text grouped into rows and columns by position. Tables may need cleanup.",
      stickyDownloadLabel: isHe ? "הורד .xlsx" : "Download .xlsx",
      stickyConvertLabel: isHe ? "המר ל-Excel" : "Convert to Excel",
    },
    "pdf-to-powerpoint": {
      status: {
        invalidType: common.choosePdf,
        emptyFile: common.emptyPdf,
      },
      progress: {
        loading: convertProgress.loading,
        building: convertProgress.buildingPowerpoint,
        extractingPage: convertProgress.extractingTextPage,
      },
      privacyNote: isHe
        ? "ניתוח PDF ויצירת PowerPoint רצים בדפדפן. המסמך לא עוזב את המכשיר."
        : "PDF parsing and PowerPoint generation run entirely in your browser. Your document never leaves your device.",
      convertLabel: isHe ? "המר ל-PowerPoint" : "Convert to PowerPoint",
      downloadLabel: isHe ? "הורד PowerPoint (.pptx)" : "Download PowerPoint (.pptx)",
      outputHint: isHe
        ? "כל עמוד PDF הופך לשקף עם טקסט מחולץ. עמודים סרוקים ללא טקסט עלולים להיות ריקים."
        : "Each PDF page becomes one slide with extracted text. Scanned pages without selectable text may be blank.",
      stickyDownloadLabel: isHe ? "הורד .pptx" : "Download .pptx",
      stickyConvertLabel: isHe ? "המר ל-PowerPoint" : "Convert to PowerPoint",
    },
    "pdf-to-text": {
      status: {
        invalidType: common.choosePdf,
        emptyFile: common.emptyPdf,
        fileReady: op(locale, "{name} ready — convert to text when you are.", "{name} מוכן — המר לטקסט כשתרצה."),
      },
      progress: {
        loading: convertProgress.loading,
        building: convertProgress.buildingText,
        extractingPage: convertProgress.extractingTextPage,
      },
      privacyNote: isHe
        ? "חילוץ טקסט מ-PDF רץ בדפדפן. המסמך לא עוזב את המכשיר."
        : "PDF text extraction runs entirely in your browser. Your document never leaves your device.",
      convertLabel: isHe ? "המר לטקסט" : "Convert to Text",
      downloadLabel: isHe ? "הורד קובץ טקסט (.txt)" : "Download text file (.txt)",
      outputHint: isHe
        ? "מתאים ל-PDF עם טקסט ניתן לבחירה. עמודים סרוקים בלבד עשויים לדרוש OCR."
        : "Best for PDFs with selectable text. Scanned image-only pages may need OCR in another app.",
      stickyDownloadLabel: isHe ? "הורד .txt" : "Download .txt",
      stickyConvertLabel: isHe ? "המר לטקסט" : "Convert to Text",
    },
    "flatten-pdf": {
      status: {
        invalidType: common.choosePdf,
        emptyFile: common.emptyPdf,
        fileReady: op(locale, "{name} ready — flatten when you are.", "{name} מוכן — שטח כשתרצה."),
        starting: isHe ? "מתחיל שיטוח…" : "Starting flatten…",
        downloaded: isHe ? "PDF משוטח הורד כ-{name}." : "Flattened PDF downloaded as {name}.",
      },
      progress: {
        loading: convertProgress.loading,
        preparing: convertProgress.preparingFlatten,
        flatteningPage: convertProgress.flatteningPage,
      },
      privacyNote: isHe
        ? "שיטוח רץ לחלוטין בדפדפן. ה-PDF לא עוזב את המכשיר."
        : "Flattening runs entirely in your browser. Your PDF never leaves your device.",
      flattenLabel: isHe ? "שטח PDF" : "Flatten PDF",
      flattenAgainLabel: isHe ? "שטח שוב" : "Flatten again",
      adjustPassword: isHe ? "התאם את הקובץ או הסיסמה ונסה שוב." : "Adjust your file or password and try again.",
      ui: {
        passwordLabel: isHe ? "סיסמת PDF" : "PDF password",
        passwordHint: isHe ? "(רק אם הקובץ מוגן)" : "(only if the file is protected)",
        passwordPlaceholder: common.optional,
      },
    },
    sign: {
      status: {
        loadedSign: isHe
          ? "נטענו {count} עמוד/ים. צור חתימה, ואז לחץ עליה כדי למקם במסמך."
          : "Loaded {count} page(s). Create a signature, then click it to place on the document.",
        loaded: isHe ? "נטענו {count} עמוד/ים." : "Loaded {count} page(s).",
        couldNotOpen: common.couldNotOpenPdf,
        wrongPassword: common.wrongPassword,
        signatureSaved: isHe
          ? "החתימה נשמרה. לחץ שוב להוספת עותקים, או גרור למיקום."
          : "Signature saved. Click it again to add more copies, or drag to position.",
        addedOnPage: isHe
          ? "נוספה חתימה בעמוד {page}. גרור למיקום."
          : "Added signature on page {page}. Drag to position.",
        placeSignature: isHe ? "הנח לפחות חתימה אחת במסמך." : "Place at least one signature on the document.",
        enterPassword: common.enterPassword,
        applying: isHe ? "מחיל חתימות…" : "Applying signatures…",
        downloaded: isHe ? "PDF חתום הורד כ-{name}." : "Signed PDF downloaded as {name}.",
        adjustPlacement: isHe ? "התאם מיקום ונסה שוב." : "Adjust placement and try again.",
      },
      privacyNote: isHe
        ? "חתימות מעובדות מקומית בדפדפן. המסמך לא עוזב את המכשיר."
        : "Signatures are processed locally in your browser. Your document never leaves your device.",
      signDownloadLabel: isHe ? "חתום והורד PDF" : "Sign & Download PDF",
      stickyLabel: isHe ? "חתום והורד" : "Sign & Download",
      ui: {
        signatureAlt: isHe ? "חתימה" : "Signature",
        removeSignature: isHe ? "הסר חתימה זו" : "Remove this signature",
        resizeSignature: isHe ? "שנה גודל חתימה" : "Resize signature",
        signaturesOnPage: isHe
          ? "{count} חתימה/ות בעמוד זה — גרור להזזה, פינה לשינוי גודל."
          : "{count} signature(s) on this page — drag to move, corner to resize.",
        placeHint: isHe ? "לחץ על חתימה שמורה למטה כדי למקם בעמוד זה." : "Click a saved signature below to place it on this page.",
        passwordLabel: isHe ? "סיסמת PDF (קבצים מוגנים)" : "PDF password (protected files)",
        passwordPlaceholder: common.enterPasswordPreview,
        loadPages: common.loadPages,
        libraryTitle: isHe ? "החתימות שלך" : "Your Signatures",
        newSignature: isHe ? "+ חדש" : "+ New",
        libraryHint: isHe
          ? "לחץ על חתימה להוספת עותק נוסף בעמוד הפעיל. השתמש באותה חתימה בין עמודים."
          : "Click a signature to place another copy on the active page. Reuse the same signature across pages.",
        libraryEmpty: isHe ? "אין חתימות עדיין. צור אחת כדי להתחיל." : "No signatures yet. Create one to get started.",
        placeOnPage: isHe ? "הנח בעמוד {page}" : "Place on page {page}",
        defaultSignatureLabel: isHe ? "חתימה {n}" : "Signature {n}",
        removeNamed: isHe ? "הסר {label}" : "Remove {label}",
        modalTitle: isHe ? "צור את החתימה שלך" : "Create your signature",
        modalClose: common.close,
        tabDraw: isHe ? "ציור" : "Draw",
        tabType: isHe ? "הקלדה" : "Type",
        drawHint: isHe ? "השתמש בעכבר או באצבע כדי לצייר את החתימה." : "Use your mouse or finger to draw your signature.",
        clearPad: isHe ? "נקה לוח" : "Clear pad",
        typeLabel: isHe ? "הקלד את שמך" : "Type your name",
        typePlaceholder: isHe ? "שם מלא" : "Your full name",
        typePreview: isHe ? "תצוגה מקדימה" : "Preview",
        cancel: isHe ? "ביטול" : "Cancel",
        useSignature: isHe ? "השתמש בחתימה" : "Use signature",
        drawFirst: isHe ? "צייר את החתימה על הלוח קודם." : "Draw your signature on the pad first.",
        saveFailed: isHe ? "לא ניתן לשמור את החתימה." : "Could not save signature.",
        createFailed: isHe ? "לא ניתן ליצור חתימה." : "Could not create signature.",
        drawnSignatureLabel: isHe ? "חתימה מצוירת" : "Drawn signature",
        activePage: common.activePage,
      },
    },
    redact: {
      status: {
        loadedMarkDrag: isHe
          ? "נטענו {count} עמוד/ים. גרור מלבנים על תוכן רגיש, ואז לחץ על הסתר PDF."
          : "Loaded {count} page(s). Drag rectangles over sensitive content, then click Redact PDF.",
        loadedMark: isHe
          ? "נטענו {count} עמוד/ים. סמן אזורים להסתרה."
          : "Loaded {count} page(s). Mark areas to redact.",
        couldNotOpen: common.couldNotOpenPdf,
        wrongPassword: common.wrongPassword,
        drawBox: isHe ? "צייר לפחות תיבת הסתרה אחת לפני שמירה." : "Draw at least one redaction box before saving.",
        enterPassword: common.enterPassword,
        applying: isHe ? "מחיל הסתרות…" : "Applying redactions…",
        downloaded: isHe ? "PDF מוסתר הורד כ-{name}." : "Redacted PDF downloaded as {name}.",
        adjustFile: isHe ? "התאם את הקובץ ונסה שוב." : "Adjust your file and try again.",
        enterKeyword: isHe ? "הזן מילה או ביטוי לחיפוש." : "Enter a word or phrase to search.",
        searchingKeyword: isHe ? "מחפש התאמות טקסט…" : "Searching for text matches…",
        noKeywordMatches: isHe ? "לא נמצאו התאמות לביטוי שחיפשת." : "No matches found for that phrase.",
        keywordMatchesAdded: isHe
          ? "נוספו {count} תיבת/ות הסתרה מהחיפוש. כוונן ידנית לפני ייצוא."
          : "Added {count} redaction box(es) from search. Fine-tune manually before export.",
      },
      privacyNote: isHe
        ? "כל תהליכי ההסתרה מתבצעים מקומית בדפדפן."
        : "All redaction processes are executed locally in your browser.",
      redactLabel: isHe ? "הסתר PDF" : "Redact PDF",
      redactingLabel: isHe ? "מסתיר…" : "Redacting…",
      ui: {
        markHint: isHe ? "לחץ וגרור לסימון אזורים להסתרה." : "Click and drag to mark areas to black out.",
        passwordLabel: isHe ? "סיסמת PDF (נדרש לקבצים מוגנים)" : "PDF password (required for protected files)",
        passwordPlaceholder: common.enterPasswordPreview,
        loadPages: common.loadPages,
        clearAll: common.clearAll,
        keywordHeading: isHe ? "חיפוש לפי מילת מפתח" : "Search by keyword",
        keywordHint: isHe
          ? "מצא טקסט ניתן לחילוץ והוסף תיבות הסתרה אוטומטית. עמודים מסומנים נשרפים לתמונה — לא רק מכוסים."
          : "Find extractable text and add redaction boxes automatically. Marked pages are burned to images—not just covered.",
        keywordLabel: isHe ? "מילה או ביטוי" : "Word or phrase",
        keywordPlaceholder: isHe ? "למשל שם לקוח או מספר חשבון" : "e.g. customer name or account number",
        keywordCaseSensitive: isHe ? "רגיש לרישיות" : "Case sensitive",
        keywordFind: isHe ? "מצא והוסף תיבות" : "Find & add boxes",
        keywordSearching: isHe ? "מחפש…" : "Searching…",
      },
    },
    "compare-pdf": {
      status: {
        comparing: isHe ? "משווה מסמכים בדפדפן…" : "Comparing documents in your browser…",
        foundDiffs: isHe
          ? "נמצאו הבדלים ב-{diffPages} מתוך {pageCount} עמוד/ים. השתמש במקרא ובבקרי העמודים למטה."
          : "Found differences on {diffPages} of {pageCount} page(s). Use the legend and page controls below.",
        noDiffs: isHe
          ? "לא זוהו הבדלי טקסט בעמודים שהושוו (שינויי פריסה בלבד עלולים לא להופיע)."
          : "No text differences detected on compared pages (layout-only changes may not appear).",
      },
      progress: {
        loading: isHe ? "טוען PDF…" : "Loading PDFs…",
        analyzingPage: isHe
          ? "מנתח עמוד {current} מתוך {total}…"
          : "Analyzing page {current} of {total}…",
      },
      privacyNote: isHe
        ? "הקבצים לא עוזבים את הדפדפן. שני ה-PDF נקראים עם pdf.js מקומית."
        : "Your files never leave your browser. Both PDFs are parsed with pdf.js locally.",
      compareLabel: isHe ? "השוואת PDF" : "Compare PDFs",
      comparingLabel: isHe ? "משווה…" : "Comparing…",
      ui: {
        labelOriginalBaseline: isHe ? "מקור (בסיס)" : "Original (baseline)",
        labelRevised: isHe ? "גרסה מעודכנת (להשוואה)" : "Revised (compare to)",
        showHighlights: isHe ? "הצג הדגשות" : "Show highlights",
        legendRemoved: isHe ? "הוסר / רק במקור" : "Removed / original only",
        legendAdded: isHe ? "נוסף / רק בגרסה המעודכנת" : "Added / revised only",
        legendMoved: isHe ? "הוזז (אותו טקסט, מיקום חדש)" : "Moved (same text, new position)",
        pageOf: isHe ? "עמוד {current} מתוך {total}" : "Page {current} of {total}",
        pagesVs: isHe ? " · {left} מול {right} עמודים" : " · {left} vs {right} pages",
        previousPage: isHe ? "עמוד קודם" : "Previous page",
        nextPage: isHe ? "עמוד הבא" : "Next page",
        jumpToPage: isHe ? "קפיצה לעמוד" : "Jump to page",
        pageOption: isHe ? "עמוד {page}" : "Page {page}",
        pageOptionChanges: isHe ? " · יש שינויים" : " · has changes",
        noDiffsOnPage: isHe ? "אין הבדלי טקסט מודגשים בעמוד זה." : "No highlighted text differences on this page.",
        panelOriginal: isHe ? "מקור" : "Original",
        panelRevised: isHe ? "מעודכן" : "Revised",
        stickyMergePdf: isHe ? "מיזוג PDF" : "Merge PDF",
      },
    },
    "crop-pdf": {
      status: {
        invalidType: common.choosePdf,
        emptyFile: common.emptyPdf,
        reading: common.readingPdf,
        fileReady: isHe
          ? "{name} מוכן — התאם את מסגרת החיתוך, ואז החל."
          : "{name} ready — adjust the crop frame, then apply.",
        cropping: isHe ? "חותך עמודים…" : "Cropping pages…",
        complete: isHe ? "חיתוך הושלם. ההורדה אמורה להתחיל אוטומטית." : "Crop complete. Your download should start automatically.",
        tryAgain: common.tryAgainOrChoose,
      },
      privacyNote: isHe
        ? "חיתוך רץ לחלוטין בדפדפן. ה-PDF לא עוזב את המכשיר."
        : "Cropping runs entirely in your browser. Your PDF never leaves your device.",
      applyLabel: isHe ? "החל חיתוך והורד" : "Apply crop & download",
      stickyApplyLabel: isHe ? "החל חיתוך" : "Apply crop",
      stickyDefaultLabel: isHe ? "חיתוך PDF" : "Crop PDF",
      ui: {
        pageSummary: isHe ? "{count} עמוד/ים · אותו חיתוך בכל העמודים" : "{count} page(s) · same crop on all pages",
        cropInstructions: isHe
          ? "גרור את המסגרת להזזה. משוך פינות או קצוות לשינוי גודל. אותו חיתוך חל על כל עמוד."
          : "Drag the frame to move it. Pull corners or edges to resize. The same crop applies to every page.",
        resetFrame: isHe ? "אפס מסגרת" : "Reset frame",
      },
    },
    protect: {
      privacyNote: isHe
        ? "הקובץ מוצפן מקומית בדפדפן ולעולם לא נוגע בשרתים שלנו."
        : "Your file is encrypted locally in your browser and never touches our servers.",
      protectLabel: isHe ? "הגן על PDF" : "Protect PDF",
      protectingLabel: isHe ? "מגן…" : "Protecting…",
      ui: {
        selectedFile: common.selectedFile,
        passwordLabel: isHe ? "סיסמה" : "Password",
        confirmPasswordLabel: isHe ? "אימות סיסמה" : "Confirm password",
        passwordPlaceholder: isHe ? "הזן סיסמה" : "Enter password",
        confirmPlaceholder: isHe ? "הזן סיסמה שוב" : "Re-enter password",
      },
    },
    unlock: {
      privacyNote: isHe
        ? "פענוח סיסמה מתבצע מקומית בדפדפן. אנחנו לא שומרים ולא רואים את הסיסמאות או הקבצים שלך."
        : "Password decryption happens locally in your browser. We never store or see your passwords or files.",
      unlockLabel: isHe ? "הסר נעילה" : "Unlock PDF",
      unlockingLabel: isHe ? "מסיר נעילה…" : "Unlocking…",
      ui: {
        selectedFile: common.selectedFile,
        passwordProtectedBadge: isHe ? "מוגן בסיסמה" : "Password protected",
        passwordLabel: isHe ? "סיסמת PDF נוכחית" : "Current PDF password",
        passwordPlaceholderLocked: isHe ? "הזן סיסמה לפתיחת PDF זה" : "Enter password to open this PDF",
        passwordPlaceholderUnlocked: isHe ? "השאר ריק אם לא נדרש" : "Leave blank if not required",
      },
    },
    "rotate-pdf": {
      status: {
        invalidType: common.choosePdf,
        emptyFile: common.emptyPdf,
        reading: isHe ? "קורא עמודי PDF…" : "Reading PDF pages…",
        fileReady: isHe ? "{name} מוכן — סובב עמודים, ואז הורד." : "{name} ready — rotate pages, then download.",
        applying: isHe ? "מחיל סיבובים…" : "Applying rotations…",
        complete: isHe ? "הסיבוב הושלם. ההורדה אמורה להתחיל אוטומטית." : "Rotation complete. Your download should start automatically.",
        tryAgain: common.tryAgainOrChoose,
      },
      privacyNote: isHe
        ? "סיבוב רץ לחלוטין בדפדפן. ה-PDF לא עוזב את המכשיר."
        : "Rotation runs entirely in your browser. Your PDF never leaves your device.",
      saveLabel: isHe ? "שמור PDF מסובב" : "Save rotated PDF",
      rotateLabel: isHe ? "סובב PDF" : "Rotate PDF",
      ui: {
        pageSummary: isHe
          ? "{count} עמוד/ים · השתמש בבקרי סיבוב לכל עמוד או גלובליים"
          : "{count} page(s) · use per-page or global rotate controls",
        rotateAllCw: isHe ? "סובב הכל עם כיוון השעון" : "Rotate all clockwise",
        rotateAllCcw: isHe ? "סובב הכל נגד כיוון השעון" : "Rotate all counter-clockwise",
        clockwise: isHe ? "↺ עם כיוון השעון" : "↺ Clockwise",
        counterClockwise: isHe ? "↻ נגד כיוון השעון" : "↻ Counter",
        resetRotations: isHe ? "אפס סיבובים" : "Reset rotations",
      },
    },
    "delete-pages": {
      status: {
        loaded: isHe
          ? "נטענו {count} עמוד/ים. גרור לסדר, וסמן עמודים להסרה."
          : "Loaded {count} page(s). Drag to reorder, then mark pages to remove.",
        selectionCleared: isHe
          ? "הבחירה נוקתה. גרור כרטיסים לסדר מחדש וסמן עמודים להסרה."
          : "Selection cleared. Drag cards to reorder and mark pages to remove.",
        markRequired: isHe ? "סמן לפחות עמוד אחד למחיקה." : "Mark at least one page for deletion.",
        deleting: isHe ? "מחיל סדר עמודים ומסיר עמודים שנבחרו…" : "Applying page order and removing selected pages…",
        downloaded: isHe
          ? "הורד {name} ({remaining} עמוד/ים נותרו)."
          : "Downloaded {name} ({remaining} page(s) remaining).",
        adjustSelection: isHe ? "התאם את הבחירה ונסה שוב." : "Adjust your selection and try again.",
      },
      privacyNote: isHe
        ? "הסרת עמודים מתבצעת מקומית בדפדפן. הקובץ לא עוזב את המכשיר."
        : "Page removal is processed locally in your browser. Your file never leaves your device.",
      deleteLabel: isHe ? "מחק עמודים" : "Delete Pages",
      deletingLabel: isHe ? "מוחק…" : "Deleting…",
      ui: {
        markedCount: isHe ? "· {count} עמוד/ים מסומנים" : "· {count} page(s) marked",
        loadingThumb: isHe ? "טוען…" : "Loading…",
        restorePage: isHe ? "שחזר עמוד {page}" : "Restore page {page}",
        markPage: isHe ? "סמן עמוד {page} למחיקה" : "Mark page {page} for deletion",
        undo: common.undo,
        reorderHint: isHe
          ? "גרור תמונות ממוזערות לסדר עמודים. לחץ על סמל הפח לסימון למחיקה."
          : "Drag thumbnails to reorder pages. Click the trash icon to mark for deletion.",
        clearSelection: isHe ? "נקה בחירה" : "Clear selection",
      },
    },
    "openoffice-to-pdf": {
      status: {
        invalidType: common.chooseOdf,
        emptyFile: common.emptyOdf,
        readingStructure: isHe ? "קורא מבנה OpenDocument…" : "Reading OpenDocument structure…",
        extracting: isHe ? "מחלץ תוכן…" : "Extracting content…",
        fileReadyMeta: isHe
          ? "{name} מוכן ({format}, {size}) — המר כשתהיה מוכן."
          : "{name} ready ({format}, {size}) — convert when you are set.",
        complete: common.conversionCompleteAuto,
        tryAgain: common.tryAgainOrChoose,
      },
      progress: {
        extracting: isHe ? "פותח ארכיון OpenDocument…" : "Unpacking OpenDocument archive…",
        parsing: isHe ? "מנתח content.xml…" : "Parsing content.xml…",
        layout: isHe ? "בונה פריסת PDF…" : "Building PDF layout…",
        finalizing: isHe ? "מסיים הורדה…" : "Finalizing download…",
      },
      privacyNote: isHe
        ? "המרת OpenOffice פותחת ומרכיבה את הקובץ לחלוטין בדפדפן. שום דבר לא מועלה לשרתים."
        : "OpenOffice conversion unpacks and compiles your file entirely in your browser. Nothing is uploaded to our servers.",
      convertLabel: isHe ? "המר ל-PDF" : "Convert to PDF",
      stickyConvertLabel: isHe ? "OpenOffice ל-PDF" : "OpenOffice to PDF",
    },
    "markdown-to-pdf": {
      status: {
        fileLoaded: isHe ? "{name} נטען — ערוך או המר כשתרצה." : "{name} loaded — edit or convert when ready.",
        compiling: isHe ? "מרכיב Markdown…" : "Compiling Markdown…",
        complete: common.conversionCompleteAuto,
        adjustMarkdown: isHe ? "התאם את ה-Markdown ונסה שוב." : "Adjust your Markdown and try again.",
      },
      progress: {
        parsing: isHe ? "מנתח Markdown…" : "Parsing Markdown…",
        rendering: isHe ? "מחיל ערכת פריסה…" : "Applying layout theme…",
        building: convertProgress.buildingPdf,
      },
      privacyNote: isHe
        ? "ניתוח Markdown ורינדור PDF רצים בדפדפן. ההערות לא עוזבות את המכשיר."
        : "Markdown parsing and PDF rendering run entirely in your browser. Your notes never leave your device.",
      convertLabel: isHe ? "המר ל-PDF" : "Convert to PDF",
      downloadLabel: isHe ? "הורד PDF" : "Download PDF",
      stickyConvertLabel: isHe ? "Markdown ל-PDF" : "Markdown to PDF",
      ui: {
        tabEditor: isHe ? "כתיבה / הדבקה" : "Write / paste",
        tabUpload: isHe ? "העלאת .md" : "Upload .md",
        themeLabel: isHe ? "ערכת עיצוב" : "Theme",
        themeGithub: isHe ? "GitHub" : "GitHub",
        themeMinimalDark: isHe ? "מינימלי כהה" : "Minimal dark",
        themeAcademic: isHe ? "אקדמי" : "Academic",
        sourceHeading: isHe ? "מקור Markdown" : "Markdown source",
        previewHeading: isHe ? "תצוגה מקדימה HTML" : "Live HTML preview",
        editorPlaceholder: isHe ? "# כותרת\n\nכתוב Markdown כאן…" : "# Title\n\nWrite Markdown here…",
        editorAriaLabel: isHe ? "עורך מקור Markdown" : "Markdown source editor",
        previewUnavailable: isHe ? "תצוגה מקדימה לא זמינה — בדוק תחביר." : "Preview unavailable — check syntax.",
      },
    },
    "html-to-pdf": {
      status: {
        fileLoaded: isHe ? "{name} נטען — התאם הגדרות והמר." : "{name} loaded — adjust settings and convert.",
        preparingSandbox: isHe ? "מכין sandbox…" : "Preparing sandbox…",
        complete: common.conversionCompleteAuto,
        adjustHtml: isHe ? "התאם את ה-HTML ונסה שוב." : "Adjust your HTML and try again.",
      },
      progress: {
        rendering: isHe ? "מרנדר HTML ב-sandbox…" : "Rendering HTML in sandbox…",
        capturing: isHe ? "לוכד פריסת DOM…" : "Capturing DOM layout…",
        building: isHe ? "בונה עמודי PDF…" : "Building PDF pages…",
      },
      privacyNote: isHe
        ? "רינדור HTML ויצירת PDF רצים ב-sandbox של הדפדפן. הקוד לא עוזב את המכשיר."
        : "HTML rendering and PDF compilation run inside your browser sandbox. Your source code never leaves your device.",
      convertLabel: isHe ? "המר ל-PDF" : "Convert to PDF",
      stickyConvertLabel: isHe ? "HTML ל-PDF" : "HTML to PDF",
      ui: {
        tabUpload: isHe ? "העלאת קובץ" : "Upload File",
        tabPaste: isHe ? "הדבקת קוד" : "Paste Code",
        orientationLabel: isHe ? "כיוון" : "Orientation",
        orientationPortrait: isHe ? "לאורך" : "Portrait",
        orientationLandscape: isHe ? "לרוחב" : "Landscape",
        marginLabel: isHe ? "שוליים" : "Margin",
        marginNormal: isHe ? "רגיל" : "Normal",
        marginNone: isHe ? "ללא" : "None",
        sourceHeading: isHe ? "מקור HTML" : "HTML source",
        previewHeading: isHe ? "תצוגה מקדימה" : "Live preview",
        previewIframeTitle: isHe ? "תצוגה מקדימה HTML" : "HTML Preview",
        editorPlaceholder: isHe
          ? "<!doctype html><html><body><h1>שלום</h1></body></html>"
          : "<!doctype html><html><body><h1>Hello</h1></body></html>",
        editorAriaLabel: isHe ? "עורך מקור HTML" : "HTML source editor",
      },
    },
    "ebook-to-pdf": {
      status: {
        invalidType: common.chooseEpub,
        emptyFile: common.emptyEpub,
        readingStructure: isHe ? "קורא מבנה ספר אלקטרוני…" : "Reading eBook structure…",
        preparing: isHe ? "מכין המרה…" : "Preparing conversion…",
        fileReadyChapters: isHe
          ? "{name} מוכן — זוהו {count} פרק/ים ({size})."
          : "{name} ready — {count} chapter(s) detected ({size}).",
        complete: common.conversionCompleteAuto,
        tryAgain: common.tryAgainOrChoose,
      },
      progress: {
        extracting: isHe ? "פותח ארכיון EPUB…" : "Unpacking EPUB archive…",
        parsing: isHe ? "קורא מבנה פרקים…" : "Reading chapter structure…",
        layout: isHe ? "מדפדף מסמך PDF…" : "Paginating PDF document…",
        finalizing: isHe ? "מסיים הורדה…" : "Finalizing download…",
      },
      privacyNote: isHe
        ? "חילוץ EPUB ויצירת PDF רצים ב-sandbox של הדפדפן. הספר לא עוזב את המכשיר."
        : "EPUB extraction and PDF generation run entirely in your browser memory sandbox. Your eBook never leaves your device.",
      convertLabel: isHe ? "המר ל-PDF" : "Convert to PDF",
      stickyConvertLabel: isHe ? "ספר אלקטרוני ל-PDF" : "eBook to PDF",
      ui: {
        fontSizeLabel: isHe ? "גודל גופן יעד" : "Target font size",
        fontSmall: isHe ? "קטן" : "Small",
        fontMedium: isHe ? "בינוני" : "Medium",
        fontLarge: isHe ? "גדול" : "Large",
        marginsLabel: isHe ? "שולי עמוד" : "Page margins",
        marginNormal: isHe ? "רגיל" : "Normal",
        marginCompact: isHe ? "צפוף" : "Compact",
      },
    },
    "iwork-to-pdf": {
      status: {
        invalidType: common.chooseIwork,
        emptyFile: common.emptyIwork,
        fileReady: isHe ? "{name} מוכן ({size}). לחץ המר ל-PDF." : "{name} ready ({size}). Click Convert to PDF.",
        preparing: isHe ? "מכין חילוץ…" : "Preparing extraction…",
        complete: common.conversionCompleteAuto,
        tryAgain: common.tryAgainOrChoose,
      },
      progress: {
        reading: isHe ? "קורא מיכל iWork…" : "Reading iWork container…",
        extracting: isHe ? "מחלץ PDF תצוגה מקדימה…" : "Extracting QuickLook preview PDF…",
        finalizing: isHe ? "מסיים הורדה…" : "Finalizing download…",
      },
      privacyNote: isHe
        ? "חילוץ iWork רץ ב-sandbox של הדפדפן. הקבצים לא עוזבים את המכשיר."
        : "iWork extraction runs entirely in your browser sandbox. Files never leave your device.",
      convertLabel: isHe ? "המר ל-PDF" : "Convert to PDF",
      stickyConvertLabel: isHe ? "iWork ל-PDF" : "iWork to PDF",
    },
    "autocad-to-pdf": {
      status: {
        invalidType: common.chooseCad,
        emptyFile: common.emptyCad,
        readingDrawing: isHe ? "קורא שרטוט…" : "Reading drawing…",
        dwgDetected: isHe
          ? "זוהה .dwg בינארי — שמור כ-DXF ב-AutoCAD כדי להמיר כאן."
          : "Binary .dwg detected — save as DXF in AutoCAD to convert here.",
        fileReady: isHe ? "{name} מוכן — לחץ המר ל-PDF כשתהיה מוכן." : "{name} ready — click Convert to PDF when you are set.",
        complete: common.conversionCompleteAuto,
        tryAgain: common.tryAgainOrChoose,
      },
      progress: {
        parsing: isHe ? "מנתח ישויות וקטור DXF…" : "Parsing DXF vector entities…",
        layout: isHe ? "מרנדר PDF שרטוט…" : "Rendering blueprint PDF…",
        finalizing: isHe ? "מסיים הורדה…" : "Finalizing download…",
      },
      privacyNote: isHe
        ? "המרת AutoCAD רצה בדפדפן. השרטוט לא עוזב את המכשיר."
        : "AutoCAD conversion runs entirely in your browser. Your drawing never leaves your device.",
      convertLabel: isHe ? "המר ל-PDF" : "Convert to PDF",
      useDxfLabel: isHe ? "השתמש בקובץ DXF" : "Use DXF file",
      stickyConvertLabel: isHe ? "AutoCAD ל-PDF" : "AutoCAD to PDF",
      ui: {
        dwgTitle: isHe ? "שמור כ-DXF לדיוק וקטורי מלא" : "Save as DXF for full vector precision",
        dwgBody: isHe
          ? "לעיבוד מאובטח לחלוטין בדפדפן, שמור את קובץ AutoCAD בפורמט DXF (.dxf) והעלה אותו כאן."
          : "To guarantee 100% serverless data security, please save your AutoCAD file as an AutoCAD DXF (.dxf) format within your CAD application and drop it here.",
        dwgSteps: isHe
          ? "ב-AutoCAD: קובץ → שמירה בשם → AutoCAD DXF (.dxf), ואז העלה את קובץ ה-.dxf כאן."
          : "In AutoCAD: File → Save As → AutoCAD DXF (.dxf), then upload the .dxf file here.",
      },
    },
    "add-watermark": {
      status: {
        invalidType: common.choosePdf,
        emptyFile: common.emptyPdf,
        fileReady: isHe ? "{name} מוכן — כוון סימן מים, ואז החל." : "{name} ready — tune the watermark, then apply.",
        textRequired: isHe ? "הזן טקסט סימן מים לפני החלה." : "Enter watermark text before applying.",
        stamping: isHe ? "מוסיף סימן מים לכל עמוד…" : "Stamping watermark on every page…",
        complete: isHe ? "סימן מים הוחל. ההורדה אמורה להתחיל אוטומטית." : "Watermark applied. Your download should start automatically.",
        tryAgain: common.tryAgainOrChoose,
      },
      privacyNote: isHe
        ? "סימני מים רצים לחלוטין בדפדפן. ה-PDF לא עוזב את המכשיר."
        : "Watermarking runs entirely in your browser. Your PDF never leaves your device.",
      applyLabel: isHe ? "החל סימן מים והורד" : "Apply watermark & download",
      stickyApplyLabel: isHe ? "הוסף סימן מים" : "Add watermark",
      ui: {
        pageSummary: isHe ? "{count} עמוד/ים · תצוגה מקדימה מציגה עמוד 1" : "{count} page(s) · preview shows page 1",
        settingsHeading: isHe ? "הגדרות סימן מים" : "Watermark settings",
        textLabel: isHe ? "טקסט" : "Text",
        textPlaceholder: isHe ? "סודי" : "CONFIDENTIAL",
        opacityLabel: isHe ? "שקיפות" : "Opacity",
        colorLabel: isHe ? "צבע" : "Color",
        fontSizeLabel: isHe ? "גודל גופן" : "Font size",
        rotationLabel: isHe ? "סיבוב" : "Rotation",
        positionLabel: isHe ? "מיקום" : "Position",
        previewHeading: isHe ? "תצוגה מקדימה חיה" : "Live preview",
        resetSettings: isHe ? "אפס הגדרות" : "Reset settings",
        loadingPreview: common.loadingPreview,
      },
    },
    "add-page-numbers": {
      status: {
        fileReady: isHe ? "PDF מוכן — בחר אפשרויות מספור למטה." : "PDF ready — choose numbering options below.",
        startMin: isHe ? "עמוד התחלה חייב להיות לפחות 1." : "Start page must be at least 1.",
        startMax: isHe ? "עמוד התחלה לא יכול לעלות על {pageCount}." : "Start page cannot exceed {pageCount}.",
        adding: isHe ? "מוסיף מספרי עמוד…" : "Adding page numbers…",
        downloaded: isHe ? "PDF עם מספרים הורד כ-{name}." : "Numbered PDF downloaded as {name}.",
        adjustOptions: isHe ? "התאם אפשרויות ונסה שוב." : "Adjust options and try again.",
      },
      privacyNote: isHe
        ? "מספור עמודים מתבצע מקומית בדפדפן. הקובץ לא עוזב את המכשיר."
        : "Page numbering is processed locally in your browser. Your file never leaves your device.",
      addLabel: isHe ? "הוסף מספרי עמודים" : "Add Page Numbers",
      ui: {
        positionLabel: isHe ? "מיקום" : "Position",
        startLabel: isHe ? "התחל מעמוד" : "Start from page",
        formatLabel: isHe ? "פורמט" : "Format",
        fontSizeLabel: isHe ? "גודל גופן" : "Font size",
        fontColorLabel: isHe ? "צבע גופן" : "Font color",
        fontStyleLabel: isHe ? "סגנון גופן" : "Font style",
        formatNumber: isHe ? "מספר בלבד (למשל 1)" : "Number only (e.g. 1)",
        formatPageOf: isHe ? "עמוד X מתוך Y (למשל עמוד 1 מתוך 10)" : "Page X of Y (e.g. Page 1 of 10)",
        sizeSmall: isHe ? "קטן" : "Small",
        sizeMedium: isHe ? "בינוני" : "Medium",
        sizeLarge: isHe ? "גדול" : "Large",
        styleRegular: isHe ? "רגיל" : "Regular",
        styleBold: isHe ? "מודגש" : "Bold",
        sizeHintSmall: "9px",
        sizeHintMedium: "12px",
        sizeHintLarge: "16px",
      },
    },
    "extract-images": {
      status: {
        fileReady: isHe ? "{name} מוכן — חלץ תמונות מוטמעות." : "{name} ready — extract embedded images.",
        scanning: isHe ? "סורק PDF לאובייקטי תמונה…" : "Scanning PDF for image objects...",
        scanningPage: isHe ? "סורק עמוד {page} מתוך {total}…" : "Scanning page {page} of {total}...",
        found: isHe ? "נמצאו {count} אובייקט/י תמונה. מוכן לחילוץ." : "Found {count} image object(s). Ready to extract.",
        none: isHe ? "לא נמצאו אובייקטי תמונה מוטמעים." : "No embedded image objects detected.",
        buildingZip: isHe ? "בונה ZIP…" : "Building ZIP...",
        zipDownloaded: isHe ? "ZIP עם {count} קובצ/י תמונה הורד." : "Downloaded ZIP with {count} image file(s).",
        tryAgain: common.tryAgainOrChoose,
      },
      privacyNote: isHe
        ? "חילוץ תמונות רץ לחלוטין בדפדפן. ה-PDF לא עוזב את המכשיר."
        : "Image extraction runs entirely in your browser. Your PDF never leaves your device.",
      extractLabel: isHe ? "חלץ תמונות" : "Extract images",
      extractAgainLabel: isHe ? "חלץ שוב" : "Extract again",
      downloadZipLabel: common.downloadAllZip,
      stickyExtractLabel: isHe ? "חלץ תמונות" : "Extract images",
      stickyDownloadLabel: isHe ? "הורד ZIP" : "Download ZIP",
      ui: {
        imageAlt: isHe ? "תמונה {index} בעמוד {page}" : "Extracted image {index} on page {page}",
        thumbLabel: isHe ? "עמוד {page} · תמונה {index}" : "Page {page} · Image {index}",
        downloadImage: isHe ? "הורד תמונה" : "Download image",
        gridLabel: isHe ? "תמונות שחולצו" : "Extracted images",
      },
    },
    "pdf-to-png": {
      status: {
        fileReady: isHe ? "{name} מוכן — ייצא עמודים כ-PNG." : "{name} ready — export pages as PNG.",
        rendering: isHe ? "מרנדר {count} עמוד/ים ב-{scale}×…" : "Rendering {count} page(s) at {scale}×…",
        exported: isHe ? "יוצאו {count} עמוד/י PNG." : "Exported {count} PNG page(s).",
        zipDownloaded: isHe ? "ZIP עם {count} קובצ/י PNG הורד." : "Downloaded ZIP with {count} PNG file(s).",
        tryAgain: isHe ? "נסה לייצא שוב או בחר קובץ אחר." : "Try exporting again or choose another file.",
      },
      privacyNote: isHe
        ? "רינדור PDF רץ לחלוטין בדפדפן. המסמך לא עוזב את המכשיר."
        : "PDF rendering runs entirely in your browser. Your document never leaves your device.",
      exportLabel: isHe ? "ייצא עמודי PNG" : "Export PNG pages",
      reexportLabel: isHe ? "ייצא PNG שוב" : "Re-export PNG pages",
      downloadZipLabel: common.downloadAllZip,
      stickyExportLabel: isHe ? "ייצא PNG" : "Export PNG",
      stickyDownloadLabel: isHe ? "הורד ZIP" : "Download ZIP",
      ui: {
        downloadPng: isHe ? "הורד PNG" : "Download PNG",
        gridLabel: isHe ? "עמודי PNG שיוצאו" : "Exported PNG pages",
      },
    },
    "remove-hidden-metadata": {
      status: {
        scanning: isHe ? "סורק מטא-דאטה…" : "Scanning metadata...",
        found: isHe ? "נמצאו {count} שדות מטא-דאטה." : "Found {count} metadata field(s).",
        noneDetected: isHe ? "לא זוהה מטא-דאטה סטנדרטי." : "No document metadata detected.",
        removing: isHe ? "מסיר מטא-דאטה…" : "Removing metadata...",
        downloaded: isHe ? "PDF נקי הורד כ-{name}." : "Clean PDF downloaded as {name}.",
        adjustTryAgain: isHe ? "התאם את הקובץ או הסיסמה ונסה שוב." : "Adjust your file or password and try again.",
      },
      privacyNote: isHe
        ? "סריקה והסרת מטא-דאטה מתבצעות מקומית בדפדפן."
        : "Metadata scanning and removal happen locally in your browser.",
      cleanLabel: isHe ? "נקה והורד" : "Clean & download",
      cleanAgainLabel: isHe ? "נקה והורד שוב" : "Clean & download again",
      stickyLabel: isHe ? "נקה והורד" : "Clean & download",
      ui: {
        passwordLabel: isHe ? "סיסמת PDF (רק אם הקובץ מוגן)" : "PDF password (only if the file is protected)",
        passwordPlaceholder: common.optional,
        rescan: isHe ? "סרוק מחדש עם סיסמה זו" : "Rescan with this password",
        metadataHeading: isHe ? "מטא-דאטה שנמצא בקובץ" : "Metadata found in this file",
        scanningInline: isHe ? "סורק…" : "Scanning...",
        noInfoFields: isHe
          ? "לא זוהו שדות Info סטנדרטיים. ייתכן שעדיין יש מטא-דאטה מוטמע."
          : "No standard Info fields were detected. Embedded metadata may still exist.",
      },
    },
    "pdf-password-recovery": {
      status: {
        checking: isHe ? "בודק הצפנה…" : "Checking encryption...",
        fileReady: isHe ? "{name} מוכן — הגדר אפשרויות ונסה שחזור." : "{name} ready — configure options and try recovery.",
        notEncrypted: isHe ? "PDF זה לא נראה מוגן בסיסמה." : "This PDF does not appear to be password-protected.",
        notEncryptedForm: isHe
          ? "PDF זה לא נראה מוצפן. השתמש בהסרת נעילה אם אתה זוכר את הסיסמה."
          : "This PDF does not look encrypted. Use Unlock PDF if you already know the password.",
        charsetRequired: isHe ? "בחר לפחות סט תווים אחד לניסוי." : "Select at least one character set to try.",
        lengthOrder: isHe ? "אורך מינימלי לא יכול לעלות על מקסימלי." : "Minimum length cannot exceed maximum length.",
        maxLength: isHe ? "אורך מקסימלי הוא {max} לשחזור בדפדפן." : "Maximum length is {max} for browser recovery.",
        starting: isHe
          ? "משחזר סיסמה ב-Worker ברקע — הקובץ לא עוזב את הדפדפן."
          : "Recovering password in a background worker — your file never leaves this browser.",
        progress: isHe ? "מנסה סיסמאות… {tried} מתוך ~{total} ניסיונות" : "Trying passwords… {tried} of ~{total} attempts",
        found: isHe ? "נמצאה סיסמה. אפשר לחשוף ולהוריד PDF ללא נעילה." : "Password found. You can reveal it and download an unlocked PDF.",
        foundEmpty: isHe ? "נמצאה סיסמה (ריקה). אפשר להוריד PDF ללא נעילה." : "Password found (empty password). You can download an unlocked PDF.",
        notFound: isHe ? "לא נמצאה התאמה ב-~{tried} ניסיונות." : "No match in ~{tried} attempts.",
        limit: isHe
          ? "הגעת למגבלת ניסיונות. צמצם חיפוש או השתמש בהסרת נעילה אם אתה זוכר את הסיסמה."
          : "Attempt limit reached. Narrow the search or use Unlock PDF if you remember the password.",
        stopped: isHe ? "השחזור נעצר." : "Recovery stopped.",
        adjustOptions: isHe ? "התאם אפשרויות ונסה שוב." : "Adjust options and try again.",
      },
      privacyNote: isHe
        ? "הקובץ לא עוזב את הדפדפן. brute-force רץ מקומית."
        : "Your file never leaves your browser. Brute-force runs locally.",
      startLabel: isHe ? "התחל שחזור" : "Start recovery",
      stopLabel: isHe ? "עצור" : "Stop",
      stickyLabel: isHe ? "התחל שחזור" : "Start recovery",
      downloadUnlockedLabel: isHe ? "הורד PDF ללא נעילה" : "Download unlocked PDF",
      ui: {
        encryptedBadge: isHe ? "· מוגן בסיסמה" : "· Password-protected",
        notEncryptedBadge: isHe ? "· לא מוצפן" : "· Not encrypted",
        charsetHeading: isHe ? "סטי תווים לניסוי" : "Character sets to try",
        special: isHe ? "מיוחדים" : "Special",
        tryCommon: isHe ? "סיסמאות נפוצות קודם" : "Common passwords first",
        customChars: isHe ? "תווים נוספים (אופציונלי)" : "Extra characters (optional)",
        customPlaceholder: isHe ? "למשל #@" : "e.g. #@",
        minLength: isHe ? "אורך מינימלי" : "Minimum length",
        maxLength: isHe ? "אורך מקסימלי" : "Maximum length",
        estimatedAttempts: isHe ? "מרחב חיפוש משוער: ~{count} ניסיונות" : "Estimated search space: ~{count} attempts",
        workerProgress: isHe ? "שחזור בתהליך (Web Worker)" : "Recovery in progress (Web Worker)",
        recoveredPassword: isHe ? "סיסמה ששוחזרה" : "Recovered password",
        emptyPassword: isHe ? "(ריק)" : "(empty)",
        hide: isHe ? "הסתר" : "Hide",
        reveal: isHe ? "חשוף" : "Reveal",
      },
    },
    "batch-rename-pdf": {
      status: {
        noPdfs: isHe ? "לא זוהו קבצי PDF." : "No PDF files detected.",
        filesAdded: isHe ? "נוספו {count} קובצ/י PDF. התאם כללים ותצוגה מקדימה." : "Added {count} PDF file(s). Adjust rules and preview.",
        packaging: isHe ? "אורז PDF עם שמות חדשים לארכיון ZIP…" : "Packaging renamed PDFs into a ZIP archive...",
        downloaded: isHe ? "הורדו {count} PDF עם שמות חדשים כקובץ ZIP." : "Downloaded {count} renamed PDF(s) as a ZIP file.",
        adjustRules: isHe ? "התאם כללים ונסה שוב." : "Adjust rules and try again.",
      },
      privacyNote: isHe
        ? "הקבצים לא עוזבים את הדפדפן. שינוי שם ואריזה מתבצעים מקומית."
        : "Your files never leave your browser. Renaming and packaging run locally.",
      downloadLabel: isHe ? "שנה שם והורד הכל (ZIP)" : "Rename & download all (ZIP)",
      stickyLabel: isHe ? "שנה שם והורד" : "Rename & download",
      ui: {
        addFiles: isHe ? "הוסף קבצי PDF" : "Add PDF files",
        addFolder: isHe ? "הוסף תיקייה" : "Add folder",
        clearAll: common.clearAll,
        fileSummary: isHe
          ? "נבחרו {count} קובץ/ים · ממוין אלפביתית לפי שם"
          : "{count} file(s) selected · sorted alphabetically by name",
        previewHeading: isHe ? "תצוגה מקדימה" : "Preview",
        originalColumn: isHe ? "מקור" : "Original",
        newNameColumn: isHe ? "שם חדש" : "New name",
        rulesHeading: isHe ? "כללי שינוי שם" : "Rename rules",
        textPrefix: isHe ? "קידומת טקסט" : "Text prefix",
        textSuffix: isHe ? "סיומת טקסט" : "Text suffix",
        prefixPlaceholder: isHe ? "למשל דוח" : "e.g. Report",
        suffixPlaceholder: isHe ? "למשל סופי" : "e.g. final",
        addSequence: isHe ? "הוסף מספר סידורי" : "Add sequence number",
        preserveExtension: isHe ? "שמור סיומת .pdf" : "Preserve .pdf extension",
        lowercase: isHe ? "המר לאותיות קטנות" : "Convert to lowercase",
        replaceSpaces: isHe ? "החלף רווחים ב-" : "Replace spaces with",
        startAt: isHe ? "התחל מ-" : "Start at",
        digits: isHe ? "ספרות" : "Digits",
        numberSeparator: isHe ? "מפריד מספר" : "Number separator",
        findReplaceLegend: isHe ? "חיפוש והחלפה בשם קובץ" : "Find & replace in filename",
        caseSensitive: isHe ? "רגיש לרישיות" : "Case sensitive",
        findPlaceholder: isHe ? "חפש" : "Find",
        replacePlaceholder: isHe ? "החלף ב-" : "Replace with",
        datePrefix: isHe ? "קידומת תאריך (YYYY-MM-DD)" : "Date prefix (YYYY-MM-DD)",
        sequentialNumbering: isHe ? "מספור סידורי" : "Sequential numbering",
        lowercaseNames: isHe ? "שמות באותיות קטנות" : "Lowercase names",
        spacesToDashes: isHe ? "רווחים → מקפים" : "Spaces → dashes",
        enableTextReplacement: isHe ? "הפעל החלפת טקסט" : "Enable text replacement",
      },
    },
    "pdf-text-editor": {
      status: {
        loadedClick: isHe
          ? "נטענו {count} עמוד/ים. הקלד טקסט, בחר עמוד, ולחץ על התצוגה לשיבוץ."
          : "Loaded {count} page(s). Type text, pick a page, then click the preview to place it.",
        couldNotOpen: common.couldNotOpenPdf,
        enterText: isHe ? "הקלד טקסט לפני שיבוץ." : "Enter text before placing.",
        layerAdded: isHe ? "שכבת טקסט נוספה ({count} סה\"כ)." : "Text layer added ({count} total).",
        addLayer: isHe ? "הוסף לפחות שכבת טקסט אחת לפני הורדה." : "Add at least one text layer before downloading.",
        enterPassword: common.enterPassword,
        applying: isHe ? "מחיל שכבות טקסט…" : "Applying text layers…",
        downloaded: isHe ? "PDF ערוך הורד כ-{name}." : "Edited PDF downloaded as {name}.",
        adjustFile: isHe ? "התאם את הקובץ ונסה שוב." : "Adjust your file and try again.",
      },
      privacyNote: isHe
        ? "עריכת טקסט מתבצעת לחלוטין בדפדפן — הקובץ לא עוזב את המכשיר."
        : "Text editing runs entirely in your browser—your file never leaves your device.",
      stickyLabel: isHe ? "החל והורד" : "Apply & download",
      ui: {
        passwordLabel: isHe ? "סיסמת PDF (לקבצים מוגנים)" : "PDF password (for protected files)",
        textLabel: isHe ? "טקסט להוספה" : "Text to add",
        textPlaceholder: isHe ? "למשל תאריך מעודכן או הערה" : "e.g. updated date or note",
        pageLabel: isHe ? "עמוד פעיל" : "Active page",
        pageOption: isHe ? "עמוד {page}" : "Page {page}",
        fontSizeLabel: isHe ? "גודל גופן" : "Font size",
        colorLabel: isHe ? "צבע" : "Color",
        coverExistingLabel: isHe ? "כסה טקסט קיים (רקע לבן)" : "Cover existing text (white background)",
        loadingPreview: isHe ? "טוען תצוגה מקדימה…" : "Loading preview…",
        clickToPlace: isHe ? "לחץ על התצוגה לשיבוץ הטקסט" : "Click the preview to place text",
        layerSummary: isHe ? "עמוד {page}: {text}" : "Page {page}: {text}",
        removeLayer: isHe ? "הסר" : "Remove",
      },
    },
    "pdf-to-booklet": {
      status: {
        invalidType: common.choosePdf,
        loadingPreviews: isHe ? "טוען תצוגות מקדימות…" : "Loading page previews…",
        planReady: isHe
          ? "{pages} עמוד/ים → {sheets} גיליון/ים פיזיים · {sides} צד/ים להדפסה"
          : "{pages} page(s) → {sheets} physical sheet(s) · {sides} side(s) to print",
        planReadySimple: isHe ? "מוכן להטלת חוברת." : "Ready for saddle-stitch imposition.",
        planReadyPad: isHe
          ? "{count} עמוד/ים ריקים יתווספו לקיפול נכון."
          : "{count} blank page(s) will be added for correct folding.",
        fileReady: isHe
          ? "{pages} עמוד/ים → {sheets} גיליונות, {sides} צד/י הדפסה. {note}"
          : "{pages} page(s) → {sheets} physical sheet(s), {sides} print sides. {note}",
        building: isHe ? "יוצר PDF חוברת מוטבע מקומית…" : "Creating imposed booklet PDF locally…",
        downloaded: isHe
          ? "PDF חוברת עם {sides} צד/י הדפסה הורד."
          : "Downloaded booklet PDF with {sides} print sides.",
      },
      privacyNote: isHe
        ? "הקובץ לא עוזב את הדפדפן. הטלה מקומית להדפסת חוברת."
        : "Your file never leaves your browser. Imposition runs locally for booklet printing.",
      createLabel: isHe ? "צור PDF חוברת" : "Create booklet PDF",
      buildingLabel: isHe ? "בונה חוברת…" : "Building booklet…",
      stickyLabel: isHe ? "צור חוברת" : "Create booklet",
      stickyCropLabel: isHe ? "חיתוך PDF" : "Crop PDF",
      clearFileLabel: isHe ? "נקה קובץ" : "Clear file",
      ui: {
        settingsHeading: isHe ? "הגדרות חוברת" : "Booklet settings",
        paperSize: isHe ? "גודל נייר" : "Paper size",
        foldStyle: isHe ? "סגנון קיפול" : "Fold style",
        width: isHe ? "רוחב" : "Width",
        height: isHe ? "גובה" : "Height",
        units: isHe ? "יחידות" : "Units",
        customSize: isHe ? "גודל מותאם…" : "Custom size…",
        saddleStitch: isHe ? "חוברת סיכה (סטנדרטי)" : "Saddle-stitch booklet (standard)",
        inches: isHe ? "אינץ'" : "Inches",
        centimeters: isHe ? "סנטימטרים" : "Centimeters",
        millimeters: isHe ? "מילימטרים" : "Millimeters",
        duplexPrinting: isHe ? "הדפסה דuplex" : "Duplex printing",
        flipLongEdge: isHe ? "היפוך על קצה ארוך (חוברות לאורך)" : "Flip on long edge (portrait booklets)",
        flipShortEdge: isHe ? "היפוך על קצה קצר (לרוחב)" : "Flip on short edge (landscape)",
        outputSummary: isHe
          ? "נייר פלט: {paper} · {sheets} גיליון/ים · {sides} צד/ים להדפסה"
          : "Output paper: {paper} · {sheets} sheet(s) · {sides} sides to print",
        livePreview: isHe ? "תצוגה מקדימה חיה" : "Live sheet preview",
        previousSide: isHe ? "צד קודם" : "Previous side",
        nextSide: isHe ? "צד הבא" : "Next side",
        jumpToSide: isHe ? "קפיצה לצד הדפסה" : "Jump to print side",
        sheetSide: isHe
          ? "גיליון {sheet} · {side}"
          : "Sheet {sheet} · {side}",
        sideFront: isHe ? "קדמי (חיצוני)" : "Front (outside)",
        sideBack: isHe ? "אחורי (פנימי)" : "Back (inside)",
        foldLine: isHe ? "קו קיפול" : "Fold line",
        fold: isHe ? "קיפול" : "Fold",
        pageLabel: isHe ? "עמוד {page}" : "Page {page}",
        blank: isHe ? "ריק" : "Blank",
        blankPadding: isHe ? "ריפוד ריק" : "Blank padding",
        emptySlot: isHe ? "משבצת ריקה" : "Empty slot",
        foldHint: isHe
          ? "לאחר הדפסה דuplex וקיפול, סדר העמודים יתאים לקריאה רציפה. נוספו עמודים ריקים כדי שהמספר יהיה כפולה של 4."
          : "After duplex printing and folding, page order matches continuous reading. Blank pages pad so page count is a multiple of four.",
        previewPageAlt: isHe ? "תצוגה מקדימה עמוד {page}" : "Preview page {page}",
      },
    },
    "custom-paper-margin": {
      status: {
        fileReady: isHe ? "{name} מוכן — הגדר גודל נייר ושוליים, ואז החל." : "{name} ready — set paper size and margins, then apply.",
        applying: isHe ? "משנה גודל ומחיל שוליים מקומית…" : "Resizing and applying margins locally…",
        downloaded: isHe ? "הורדו {count} עמוד/ים על {paper} עם השוליים שלך." : "Downloaded {count} page(s) on {paper} with your margins.",
      },
      privacyNote: isHe
        ? "ה-PDF לא עוזב את הדפדפן. שינוי גודל ושוליים מתבצעים מקומית."
        : "Your PDF never leaves your browser. Resizing and margins run locally.",
      applyLabel: isHe ? "החל על כל העמודים" : "Apply to all pages",
      applyingLabel: isHe ? "מחיל…" : "Applying…",
      stickyLabel: isHe ? "החל שוליים" : "Apply margins",
      stickyBookletLabel: isHe ? "חוברת" : "Booklet",
      ui: {
        targetPaper: isHe ? "נייר יעד" : "Target paper",
        marginUnits: isHe ? "יחידות שוליים" : "Margin units",
        width: isHe ? "רוחב" : "Width",
        height: isHe ? "גובה" : "Height",
        customUnits: isHe ? "יחידות מותאמות" : "Custom units",
        customSize: isHe ? "גודל מותאם…" : "Custom size…",
        millimeters: isHe ? "מילימטרים" : "Millimeters",
        inches: isHe ? "אינץ'" : "Inches",
        linkMargins: isHe ? "אותו שוליים מכל הצדדים" : "Same margin on all sides",
        trimHeading: isHe ? "חיתוך קצוות מקור (אופציונלי)" : "Trim source edges (optional)",
        trimHint: isHe
          ? "התאם שברי חיתוך (0–1). השתמש ב"
          : "Adjust crop fractions (0–1). Use ",
        trimLink: isHe ? "חיתוך PDF" : "Crop PDF",
        trimHintSuffix: isHe
          ? " לעורך חיתוך ויזואלי בקבצים מורכבים."
          : " for a visual crop editor on complex files.",
        dragHint: isHe ? "גרור ידיות להתאמת שוליים על התצוגה המקדימה." : "Drag handles to adjust margins on the preview.",
        marginHandle: isHe ? "שוליים {side}" : "{side} margin",
        livePreviewHeading: isHe ? "תצוגה מקדימה חיה — עמוד 1" : "Live preview — page 1",
        previewLegend: isHe
          ? "מסגרת חיצונית = נייר שנבחר · פנימית = אזור תוכן"
          : "Outer frame = selected paper · inner = content area",
        loadingPreview: common.loadingPreview,
        cropNx: isHe ? "שמאל (nx)" : "Left (nx)",
        cropNy: isHe ? "עליון (ny)" : "Top (ny)",
        cropNw: isHe ? "רוחב (nw)" : "Width (nw)",
        cropNh: isHe ? "גובה (nh)" : "Height (nh)",
      },
    },
    "safe-to-share-auditor": {
      status: {
        fileLoaded: isHe ? "PDF נטען. לחץ \"הרץ ביקורת\" לסריקה." : 'PDF loaded. Click "Run audit" to scan.',
        scanning: isHe ? "סורק שכבות טקסט, הערות וחתימות…" : "Scanning text layers, annotations, and signatures…",
        found: isHe ? "נמצאו {count} פריט/ים רגישים." : "Found {count} sensitive item(s).",
        none: isHe ? "לא זוהו דפוסים רגישים ברורים." : "No obvious sensitive patterns detected.",
        redacting: isHe ? "מסתיר את כל האזורים שסומנו מקומית…" : "Redacting all flagged areas locally…",
        redacted: isHe ? "PDF מוסתר עם {count} אזור/ים הורד." : "Downloaded redacted PDF with {count} area(s) removed.",
      },
      privacyNote: isHe
        ? "ה-PDF לא עוזב את הדפדפן. הביקורת רצה מקומית."
        : "Your PDF never leaves your browser. The audit runs locally.",
      auditLabel: isHe ? "הרץ ביקורת" : "Run audit",
      auditingLabel: isHe ? "סורק…" : "Scanning…",
      redactAllLabel: isHe ? "הסתר / הסר את כל המסומנים" : "Redact / remove all flagged",
      redactingLabel: isHe ? "מסתיר…" : "Redacting…",
      stickyAuditLabel: isHe ? "הרץ ביקורת" : "Run audit",
      stickyRedactLabel: isHe ? "הסתר PDF" : "Redact PDF",
      ui: {
        noFindingsOnPage: isHe ? "אין פריטים מסומנים בעמוד זה." : "No flagged items on this page.",
        disclaimer: isHe
          ? "סריקות אוטומטיות עלולות לפספס תוכן. השתמש בהסתר PDF, הסרת מטא-דאטה ושיטוח לפני שיתוף."
          : "Automated scans can miss content. Use Redact PDF, Remove Metadata, and Flatten PDF before sharing.",
        totalFindings: isHe ? "סה״כ ממצאים" : "Total findings",
        highRisk: isHe ? "סיכון גבוה" : "High risk",
        annotations: isHe ? "הערות" : "Annotations",
        signaturesInk: isHe ? "חתימות / דיו" : "Signatures / ink",
        previousPage: isHe ? "עמוד קודם" : "Previous page",
        nextPage: isHe ? "עמוד הבא" : "Next page",
        jumpToPage: isHe ? "קפיצה לעמוד" : "Jump to page",
        visualMapHeading: isHe ? "מפת רגישות ויזואלית" : "Visual sensitivity map",
        loadingMap: isHe ? "טוען מפה…" : "Loading map…",
        mapAlt: isHe ? "מפת מסמך עמוד {page}" : "Document map page {page}",
        mapLegend: isHe
          ? "{count} ממצא/ים בעמוד זה — אדום = גבוה, כתום = בינוני, כחול = נמוך"
          : "{count} finding(s) on this page — red = high, amber = medium, blue = low risk",
        findingsHeading: isHe ? "ממצאים בעמוד {page}" : "Findings on page {page}",
        scanningPage: isHe ? "סורק עמוד {current} מתוך {total}…" : "Scanning page {current} of {total}…",
        pageFlagged: isHe ? " · מסומן" : " · flagged",
      },
    },
    "heic-to-pdf": {
      status: {
        noHeic: common.noHeicFiles,
        filesAddedSkipped: isHe
          ? "נוספו {count} קובצ/י HEIC. דולגו {skipped} קובץ/ים לא נתמכים."
          : "{count} HEIC file(s) added. Skipped {skipped} unsupported file(s).",
        filesAdded: isHe
          ? "נוספו {count} קובצ/י HEIC. סדר מחדש במידת הצורך, ואז המר."
          : "{count} HEIC file(s) added. Reorder if needed, then convert.",
        starting: isHe ? "מתחיל המרה…" : "Starting conversion…",
        complete: isHe ? "ההמרה הושלמה. הורד את ה-PDF למטה." : "Conversion complete. Download your PDF below.",
        tryAgain: common.tryAgainOrChoose,
      },
      progress: {
        preparing: isHe ? "מכין תמונות HEIC…" : "Preparing HEIC images…",
        decoding: isHe
          ? "מפענח {name} ({current} מתוך {total})…"
          : "Decoding {name} ({current} of {total})…",
        buildingPage: isHe
          ? "בונה PDF — עמוד {current} מתוך {total}…"
          : "Building PDF — page {current} of {total}…",
        building: convertProgress.buildingPdf,
      },
      privacyNote: isHe
        ? "פענוח HEIC ויצירת PDF רצים בדפדפן. התמונות לא עוזבות את המכשיר."
        : "HEIC decoding and PDF creation run entirely in your browser. Your photos never leave your device.",
      convertLabel: isHe ? "יצירת PDF" : "Create PDF",
      downloadLabel: isHe ? "הורד PDF" : "Download PDF",
      stickyConvertLabel: isHe ? "יצירת PDF" : "Create PDF",
      stickyDownloadLabel: isHe ? "הורד PDF" : "Download PDF",
      ui: {
        filesSelected: isHe ? "נבחרו {count} קובצ/י HEIC" : "{count} HEIC file(s) selected",
        totalReorderHint: isHe ? "{size} סה״כ · גרור שורות לסדר עמודים" : "{size} total · drag rows to reorder pages",
        outputHint: isHe
          ? "כל HEIC הופך לעמוד PDF ברזולוציה מלאה. Live Photo עלול להוסיף מספר עמודים מקובץ אחד."
          : "Each HEIC becomes one PDF page at full image resolution. Live Photo bursts may add multiple pages from a single file.",
      },
    },
  };
}

export const workspacesEn = buildWorkspaces("en");
export const workspacesHe = buildWorkspaces("he");
