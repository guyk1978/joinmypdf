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
