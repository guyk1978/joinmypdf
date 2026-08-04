/** Assign File objects onto a hidden <input type="file"> and fire change for React. */
export function assignFilesToInput(input: HTMLInputElement, files: File[]): boolean {
  if (!files.length) return false;
  try {
    const transfer = new DataTransfer();
    const selected = input.multiple ? files : files.slice(0, 1);
    for (const file of selected) {
      if (file) transfer.items.add(file);
    }
    if (!transfer.files.length) return false;

    input.files = transfer.files;

    // React listens for bubbled native change/input on the root — fire both.
    input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
    input.dispatchEvent(new Event("change", { bubbles: true, composed: true }));

    // Confirm the assignment stuck (some browsers reject invalid FileList writes).
    return Boolean(input.files && input.files.length > 0);
  } catch {
    return false;
  }
}

export function findFileInput(root: ParentNode | null | undefined): HTMLInputElement | null {
  if (!root) return null;
  // Prefer the primary immersive dropzone input over compact “add more” zones.
  const primary = root.querySelector<HTMLInputElement>(
    '.im-dropzone:not(.im-dropzone--compact) input[type="file"]',
  );
  if (primary) return primary;
  return root.querySelector<HTMLInputElement>('input[type="file"]');
}

/**
 * Push cloud/local File objects into the tool the same way a device upload does:
 * assign onto the hidden file input so existing onChange handlers run.
 */
export function injectFilesIntoToolRoot(
  root: ParentNode | null | undefined,
  files: File[],
): boolean {
  const input = findFileInput(root);
  if (!input || !files.length) return false;
  return assignFilesToInput(input, files);
}
