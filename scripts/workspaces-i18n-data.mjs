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
    downloadedAs: isHe ? "הורד כ-{name}." : "Downloaded as {name}.",
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
    },
  };
}

export const workspacesEn = buildWorkspaces("en");
export const workspacesHe = buildWorkspaces("he");
