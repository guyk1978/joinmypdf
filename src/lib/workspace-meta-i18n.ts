type MetaWs = {
  wsCommon: (key: string, values?: Record<string, string | number>) => string;
};

export function formatPageCount(ws: MetaWs, count: number): string {
  return ws.wsCommon("pageCount", { count });
}

export function formatSlideCount(ws: MetaWs, count: number): string {
  return ws.wsCommon("slideCount", { count });
}
