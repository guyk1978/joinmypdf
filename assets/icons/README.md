# JoinMyPDF — PWA & favicon assets

Place or regenerate icons in this folder (`assets/icons/`). They are copied to `public/icons/` during `npm run dev` / `npm run build`.

## Required file names

| File | Size | Use |
|------|------|-----|
| `favicon-16x16.png` | 16×16 | Browser tab (small) |
| `favicon-32x32.png` | 32×32 | Browser tab (standard) |
| `favicon.ico` | multi | Legacy browsers |
| `favicon.svg` | vector | Modern browser tab |
| `apple-touch-icon.png` | 180×180 | iOS / iPad Add to Home Screen |
| `android-chrome-192x192.png` | 192×192 | Android PWA (required) |
| `android-chrome-512x512.png` | 512×512 | Android PWA splash (required) |

## Source artwork

Edit `icon-source.svg`, then run:

```bash
node scripts/generate-pwa-icons.mjs
```

This regenerates all PNGs and `favicon.ico` from the master SVG.
