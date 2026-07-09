const MOBI_MAX_RECORD_SIZE = 4096;
const MOBI_PALMDB_HEADER_LEN = 78;
const MOBI_PALMDOC_HEADER_LEN = 16;
const MOBI_MOBIHEADER_LEN = 232;
const RECORD0_RESERVE = 10240;

type ExthRecord = { type: number; value: string | Uint8Array };

function writeAscii(view: DataView, offset: number, value: string, length: number) {
  for (let i = 0; i < length; i += 1) {
    view.setUint8(offset + i, i < value.length ? value.charCodeAt(i) : 0);
  }
}

function writeUint32(view: DataView, offset: number, value: number) {
  view.setUint32(offset, value >>> 0, false);
}

function writeUint16(view: DataView, offset: number, value: number) {
  view.setUint16(offset, value & 0xffff, false);
}

function underlineTitle(value: string): string {
  return value.replace(/[^-A-Za-z0-9]/g, "_").slice(0, 31) || "book";
}

function minimizeHtml(html: string): string {
  return html.replace(/\s+/g, " ").replace(/[\t\r\n]/g, "").trim();
}

function palmDocLz77Pack(data: Uint8Array): Uint8Array {
  const out: number[] = [];
  if (data.length === 0) return new Uint8Array();

  const tailLen = data[data.length - 1] ?? 0;
  const bodyEnd = data.length - 1 - tailLen;
  const body = data.subarray(0, Math.max(0, bodyEnd));
  const tail = data.subarray(Math.max(0, bodyEnd));

  const ldata = body.length;
  for (let i = 0; i < ldata; i += 1) {
    let found = false;
    if (i > 10 && ldata - i > 10) {
      let boundOffset = i - 2047;
      let reset = false;
      if (boundOffset < 0) boundOffset = 0;
      else reset = true;

      const slice = body.subarray(boundOffset, i);
      const needle = body.subarray(i, Math.min(i + 3, ldata));
      let f = -1;
      for (let k = slice.length - needle.length; k >= 0; k -= 1) {
        let match = true;
        for (let n = 0; n < needle.length; n += 1) {
          if (slice[k + n] !== needle[n]) {
            match = false;
            break;
          }
        }
        if (match) {
          f = k;
          break;
        }
      }

      if (f !== -1) {
        for (let chunkLen = 10; chunkLen > 2; chunkLen -= 1) {
          const chunk = body.subarray(i, Math.min(i + chunkLen, ldata));
          let j = -1;
          for (let k = slice.length - chunk.length; k >= 0; k -= 1) {
            let match = true;
            for (let n = 0; n < chunk.length; n += 1) {
              if (slice[k + n] !== chunk[n]) {
                match = false;
                break;
              }
            }
            if (match) {
              j = k;
              break;
            }
          }
          if (j !== -1) {
            let m = i - j;
            if (reset) {
              m = i - 2047 + j;
              reset = false;
            }
            const code = 0x8000 + ((m << 3) & 0x3ff8) + (chunk.length - 3);
            out.push((code >> 8) & 0xff, code & 0xff);
            i += chunk.length - 1;
            found = true;
            break;
          }
        }
      }
    }

    if (found) continue;

    const och = body[i]!;
    if (och === 0x20 && i + 1 < ldata) {
      const onch = body[i + 1]!;
      if (onch >= 0x40 && onch < 0x80) {
        out.push(onch ^ 0x80);
        i += 1;
        continue;
      }
      out.push(och);
      continue;
    }

    if (och === 0 || (och > 8 && och < 0x80)) {
      out.push(och);
      continue;
    }

    let j = i;
    const binseq: number[] = [];
    while (j < ldata && binseq.length < 8) {
      const ch = body[j]!;
      if (ch === 0 || (ch > 8 && ch < 0x80)) break;
      binseq.push(ch);
      j += 1;
    }
    out.push(binseq.length);
    out.push(...binseq);
    i += binseq.length - 1;
  }

  out.push(...tail);
  return new Uint8Array(out);
}

function buildFlis(): Uint8Array {
  const buf = new ArrayBuffer(36);
  const view = new DataView(buf);
  writeUint32(view, 0, 1179404627);
  writeUint32(view, 4, 8);
  writeUint16(view, 8, 65);
  writeUint16(view, 10, 0);
  writeUint32(view, 12, 0);
  writeUint32(view, 16, 0xffffffff);
  writeUint16(view, 20, 1);
  writeUint16(view, 22, 3);
  writeUint32(view, 24, 3);
  writeUint32(view, 28, 1);
  writeUint32(view, 32, 0xffffffff);
  return new Uint8Array(buf);
}

function buildFcis(textLength: number): Uint8Array {
  const buf = new ArrayBuffer(44);
  const view = new DataView(buf);
  writeUint32(view, 0, 1178814803);
  writeUint32(view, 4, 20);
  writeUint32(view, 8, 16);
  writeUint32(view, 12, 1);
  writeUint32(view, 16, 0);
  writeUint32(view, 20, textLength);
  writeUint32(view, 24, 0);
  writeUint32(view, 28, 32);
  writeUint32(view, 32, 8);
  writeUint16(view, 36, 1);
  writeUint16(view, 38, 1);
  writeUint32(view, 40, 0);
  return new Uint8Array(buf);
}

function encodeExthString(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function buildExth(records: ExthRecord[]): Uint8Array {
  const chunks: Uint8Array[] = [];
  let headerLength = 12;
  for (const record of records) {
    const valueBytes =
      typeof record.value === "string" ? encodeExthString(record.value) : record.value;
    headerLength += 8 + valueBytes.length;
  }
  const padding = (4 - (headerLength % 4)) % 4;
  headerLength += padding;

  const header = new Uint8Array(headerLength);
  const view = new DataView(header.buffer);
  writeAscii(view, 0, "EXTH", 4);
  writeUint32(view, 4, headerLength);
  writeUint32(view, 8, records.length);
  let offset = 12;
  for (const record of records) {
    const valueBytes =
      typeof record.value === "string" ? encodeExthString(record.value) : record.value;
    writeUint32(view, offset, record.type);
    writeUint32(view, offset + 4, valueBytes.length + 8);
    offset += 8;
    header.set(valueBytes, offset);
    offset += valueBytes.length;
  }
  return header;
}

function splitTextRecords(html: string): Uint8Array[] {
  const encoder = new TextEncoder();
  const source = encoder.encode(html);
  const records: Uint8Array[] = [];
  let offset = 0;

  while (offset < source.length) {
    let end = Math.min(offset + MOBI_MAX_RECORD_SIZE - 1, source.length);
    const chunk = source.subarray(offset, end);
    const withPad = new Uint8Array(chunk.length + 1);
    withPad.set(chunk, 0);
    withPad[chunk.length] = 0;
    records.push(palmDocLz77Pack(withPad));
    offset = end;
  }

  if (records.length === 0) {
    records.push(palmDocLz77Pack(new Uint8Array([0])));
  }

  return records;
}

export function createMobiFromHtml(options: {
  title: string;
  author?: string;
  html: string;
  language?: string;
}): Uint8Array {
  const title = options.title.trim() || "Document";
  const author = options.author?.trim() || "JoinMyPDF";
  const bookHtml = minimizeHtml(
    `<html><head><guide><reference title="start" filepos=0 type="text" /></guide></head><body>${options.html}</body></html>`,
  );
  const textBytes = new TextEncoder().encode(bookHtml);
  const textRecords = splitTextRecords(bookHtml);

  const trailingRecords: Uint8Array[] = [
    new Uint8Array([0, 0]),
    buildFlis(),
    buildFcis(textBytes.length),
    new Uint8Array([0xe9, 0x8e, 0x0d, 0x0a]),
  ];

  const allRecords: Uint8Array[] = [new Uint8Array(RECORD0_RESERVE), ...textRecords, ...trailingRecords];
  const recordCount = allRecords.length;
  const timestamp = Math.floor(Date.now() / 1000);
  const uniqueId = (Math.random() * 0xffffffff) >>> 0;

  const exth = buildExth([
    { type: 100, value: author },
    { type: 109, value: "EBOK" },
  ]);

  const fullNameOffset =
    MOBI_PALMDOC_HEADER_LEN + MOBI_MOBIHEADER_LEN + exth.length + 1;
  const record0 = new Uint8Array(RECORD0_RESERVE);
  const r0 = new DataView(record0.buffer);

  writeUint16(r0, 0, 2);
  writeUint16(r0, 2, 0);
  writeUint32(r0, 4, textBytes.length);
  writeUint16(r0, 8, textRecords.length);
  writeUint16(r0, 10, MOBI_MAX_RECORD_SIZE);
  writeUint16(r0, 12, 2);

  writeAscii(r0, MOBI_PALMDOC_HEADER_LEN, "MOBI", 4);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 4, MOBI_MOBIHEADER_LEN);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 8, 2);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 12, 65001);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 16, uniqueId + 1);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 20, 6);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 24, 6);
  for (let i = 0; i < 7; i += 1) {
    writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 28 + i * 4, 0xffffffff);
  }
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 56, 1033);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 84, 80);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 88, 0xffffffff);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 92, 0xffffffff);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 96, 1);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 108, textRecords.length);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 112, 0xffffffff);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 116, 0);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 120, 0xffffffff);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 124, 0xffffffff);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 128, 1);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 132, title.length);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 136, fullNameOffset);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 140, 0);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 144, 0xffffffff);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 148, recordCount - 4);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 152, recordCount - 3);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 156, 1);
  writeUint32(r0, MOBI_PALMDOC_HEADER_LEN + 160, 1);

  record0.set(exth, MOBI_PALMDOC_HEADER_LEN + MOBI_MOBIHEADER_LEN);
  const titleOffset = MOBI_PALMDOC_HEADER_LEN + MOBI_MOBIHEADER_LEN + exth.length;
  record0.set(new TextEncoder().encode(title), titleOffset);
  allRecords[0] = record0;

  const offsets: number[] = [];
  let cursor = MOBI_PALMDB_HEADER_LEN + 2 + recordCount * 8;
  for (let i = 0; i < recordCount; i += 1) {
    offsets.push(cursor);
    if (i === 0) cursor = MOBI_PALMDB_HEADER_LEN + 2 + recordCount * 8 + RECORD0_RESERVE;
    else cursor += allRecords[i]!.length;
  }

  const totalSize = cursor;
  const out = new Uint8Array(totalSize);
  const view = new DataView(out.buffer);
  writeAscii(view, 0, underlineTitle(title), 32);
  writeUint16(view, 32, 0);
  writeUint16(view, 34, 0);
  writeUint32(view, 36, timestamp);
  writeUint32(view, 40, timestamp);
  writeUint32(view, 44, timestamp);
  writeUint32(view, 48, 0);
  writeUint32(view, 52, 0);
  writeUint32(view, 56, 0);
  writeAscii(view, 60, "BOOK", 4);
  writeAscii(view, 64, "MOBI", 4);
  writeUint32(view, 68, uniqueId);
  writeUint32(view, 72, 0);
  writeUint16(view, 76, recordCount);

  let metaOffset = MOBI_PALMDB_HEADER_LEN;
  for (let i = 0; i < recordCount; i += 1) {
    writeUint32(view, metaOffset, offsets[i]!);
    view.setUint8(metaOffset + 4, 0);
    writeUint16(view, metaOffset + 5, i);
    metaOffset += 8;
  }
  view.setUint8(metaOffset, 0);
  view.setUint8(metaOffset + 1, 0);

  let dataOffset = MOBI_PALMDB_HEADER_LEN + 2 + recordCount * 8;
  for (let i = 0; i < recordCount; i += 1) {
    out.set(allRecords[i]!, dataOffset);
    dataOffset += allRecords[i]!.length;
  }

  return out;
}
