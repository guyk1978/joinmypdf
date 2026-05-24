import { zipSync } from "fflate";

export async function zipBlobs(entries: { name: string; blob: Blob }[]): Promise<Blob> {
  if (!entries.length) throw new Error("Nothing to zip.");
  const files: Record<string, Uint8Array> = {};
  for (const entry of entries) {
    files[entry.name] = new Uint8Array(await entry.blob.arrayBuffer());
  }
  const zipped = zipSync(files);
  return new Blob([zipped as BlobPart], { type: "application/zip" });
}
