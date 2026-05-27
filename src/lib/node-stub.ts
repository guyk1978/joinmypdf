/** Browser stub for optional Node built-ins referenced by pptxgenjs. */
const noop = async () => undefined;

export default { promises: { writeFile: noop } };
export const promises = { writeFile: noop };
