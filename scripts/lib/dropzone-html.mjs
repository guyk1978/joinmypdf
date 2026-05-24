/** Centered dropzone markup used across static tool pages. */

export function wrapDropzoneLabel(strongText, subText) {
  return `<label class="dropzone dropzone--upload" id="dropzone"><span class="dropzone__inner"><strong>${strongText}</strong><p>${subText}</p></span></label>`;
}

export const DROPZONE_LABEL_RE =
  /<label class="dropzone(?:\s+dropzone--upload)?" id="dropzone">(?:<span class="dropzone__inner">)?<strong>([\s\S]*?)<\/strong><p>([\s\S]*?)<\/p>(?:<\/span>)?<\/label>/i;

export function normalizeDropzoneInHtml(html) {
  return html.replace(DROPZONE_LABEL_RE, (_, strong, sub) => wrapDropzoneLabel(strong.trim(), sub.trim()));
}
