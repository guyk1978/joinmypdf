/** Browser stub for optional Node built-ins referenced by bundled CJS deps. */
const noop = async () => undefined;

export function dirname(): string {
  return "/";
}

export function join(...parts: string[]): string {
  return parts.filter(Boolean).join("/");
}

const pathStub = { promises: { writeFile: noop }, dirname, join };

export default pathStub;
export const promises = { writeFile: noop };
