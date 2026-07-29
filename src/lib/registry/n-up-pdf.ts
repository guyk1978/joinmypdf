import type { ToolDocumentation } from "@/lib/types";

/**
 * Documentation overlay for `n-up-pdf` — owned by the registry, not the tool UI.
 * Editorial SEO copy: overview, HowTo steps, and tailored FAQs.
 */
export const documentation: ToolDocumentation = {
  whyItMatters:
    "Printing every page full-size wastes paper, toner, and bag space for handouts. JoinMyPDF’s N-Up PDF tool lets you create an N-Up PDF layout online—fit 2-up, 4-up, 6-up, 9-up, or a custom grid of multiple pages per sheet—without uploading the file. Under our Zero-Upload Promise, imposition runs entirely in your browser: choose a layout, set portrait or landscape sheet orientation, dial cell margins, and download a compact print-ready PDF. Prefer PDF 2-up printing for readable drafts, a 4-up PDF layout for lecture slides and study guides, or denser grids for thumbnail review packs? Local N-Up keeps contracts, unreleased decks, and student materials on your device while you cut paper use and prepare tidy handouts.",
  howTo: {
    name: "How to use N-Up PDF",
    description:
      "Arrange multiple PDF pages onto each output sheet in your browser with JoinMyPDF—local grid layouts, orientation and margin controls, and instant download under the Zero-Upload Promise.",
    steps: [
      {
        name: "Upload your PDF locally",
        text: "Upload or drag and drop your PDF into the N-Up workspace. Processing stays on your device—nothing is sent to JoinMyPDF servers.",
      },
      {
        name: "Choose layout, orientation, and margins",
        text: "Select 2-up, 4-up, 6-up, 9-up, or a custom columns×rows grid. Set sheet orientation (auto, portrait, or landscape) and cell margins so pages sit cleanly inside each cell.",
      },
      {
        name: "Convert and download",
        text: "Click Convert & Download to build the N-Up PDF in your browser and save the multi-page-per-sheet file for printing or sharing.",
      },
    ],
  },
  faq: [
    {
      question: "How does N-Up printing work?",
      answer:
        "N-Up imposition places multiple source pages on each output sheet in a grid—for example, four pages in a 2×2 layout. Each page scales proportionally inside its cell so you print more content per physical sheet.",
    },
    {
      question: "Is N-Up PDF processed locally?",
      answer:
        "Yes. Layout and rearrangement run entirely in your browser. That is our Zero-Upload Promise—your PDF never reaches JoinMyPDF servers.",
    },
    {
      question: "What layout options are available?",
      answer:
        "Use 2-up for readable drafts, 4-up for standard handouts, 6-up or 9-up for thumbnail review packs, or a custom grid with up to 4 columns and 4 rows. You can also set portrait/landscape orientation and cell margins.",
    },
    {
      question: "Does this preserve the original page order?",
      answer:
        "Yes. Pages are arranged left-to-right, top-to-bottom within each sheet, then continue on the next sheet in reading order. Page 1 stays first; only the number of pages per sheet changes.",
    },
    {
      question: "What do orientation and margins control?",
      answer:
        "Orientation sets the output sheet to auto (match the source), portrait, or landscape. Margins add inset padding inside each grid cell so content is not flush against cell borders when you print.",
    },
    {
      question: "Can I use this for double-sided printing?",
      answer:
        "Yes. Download the N-Up PDF and print duplex from your OS or printer dialog. For saddle-stitch booklets with fold imposition, use our PDF to Booklet tool instead.",
    },
    {
      question: "Is N-Up PDF free to use?",
      answer:
        "Yes. Standard in-browser N-Up layout is free—no payment, trial watermark, or account required for everyday use.",
    },
    {
      question: "Do you add a watermark to N-Up PDFs?",
      answer:
        "No. JoinMyPDF does not stamp a watermark on PDFs downloaded from this tool.",
    },
    {
      question: "Can I create multiple pages per sheet on mobile?",
      answer:
        "Yes. The tool works in modern mobile browsers. For very large multi-page files, a desktop browser usually offers more memory headroom.",
    },
    {
      question: "Are there file size or page limits?",
      answer:
        "There is no fixed JoinMyPDF upload quota because nothing is uploaded. Very large PDFs can still hit browser memory limits—try closing other tabs, or split the file first.",
    },
    {
      question: "Does N-Up layout work offline?",
      answer:
        "After the page loads once, you can keep working without a network connection because processing stays in your browser. You still need network access for the first visit.",
    },
    {
      question: "Do I need an account to create an N-Up PDF?",
      answer:
        "No account is required. Open the tool, add your PDF, choose a layout, convert, and download.",
    },
    {
      question: "What happens to my PDF after I close the tab?",
      answer:
        "The working copy lives only in your browser session. Closing or refreshing the tab clears it from memory—we do not retain your PDF on our servers.",
    },
    {
      question: "How does JoinMyPDF keep N-Up layouts private?",
      answer:
        "Grid placement, scaling, orientation, and margins all run locally in your browser tab. Combined with the Zero-Upload Promise, that keeps handouts, decks, and confidential drafts off JoinMyPDF infrastructure.",
    },
  ],
};

export default documentation;
