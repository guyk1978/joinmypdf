/** Assign File objects onto a hidden <input type="file"> and fire change. */
export function assignFilesToInput(input: HTMLInputElement, files: File[]): boolean {
  if (!files.length) return false;
  try {
    const transfer = new DataTransfer();
    for (const file of files) transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  } catch {
    return false;
  }
}

export function findFileInput(root: ParentNode | null | undefined): HTMLInputElement | null {
  if (!root) return null;
  return root.querySelector<HTMLInputElement>('input[type="file"]');
}
