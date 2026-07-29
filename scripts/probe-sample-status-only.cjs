const http = require("http");

function follow(start) {
  return new Promise(async (resolve) => {
    let cur = start;
    for (let hop = 0; hop < 6; hop++) {
      const res = await new Promise((r) => {
        const req = http.request(
          { hostname: "127.0.0.1", port: 3000, path: cur, method: "GET", timeout: 180000 },
          (resp) => {
            resp.resume();
            r({ status: resp.statusCode, location: resp.headers.location });
          },
        );
        req.on("error", (e) => r({ status: 0, error: e.message }));
        req.on("timeout", () => {
          req.destroy();
          r({ status: 0, error: "timeout" });
        });
        req.end();
      });
      if ([301, 302, 307, 308].includes(res.status) && res.location) {
        let next = res.location.startsWith("http") ? new URL(res.location).pathname : res.location;
        if (!next.startsWith("/")) next = "/" + next;
        cur = next;
        continue;
      }
      resolve({ path: start, final: cur, status: res.status, error: res.error });
      return;
    }
    resolve({ path: start, status: 0, error: "redirect-loop" });
  });
}

(async () => {
  const urls = [
    "/ru/tools/mp3-tools/szhatie-audio/",
    "/ru/tools/mp3-tools/obrezka-mp3/",
    "/ru/tools/mp3-tools/wav-v-mp3/",
    "/ru/tools/video-tools/szhatie-mp4/",
    "/ru/tools/pdf-tools/obiedinenie-pdf/",
    "/ru/tools/pdf-tools/chitatel-pdf/",
    "/ru/tools/image-tools/szhatie-izobrazheniy/",
    "/he/tools/mp3-tools/audio-compressor/",
    "/en/tools/mp3-tools/audio-compressor/",
    "/en/tools/xml-tools/",
    "/ru/tools/xml-tools/",
    "/en/all-tools/",
    "/ru/all-tools/",
    "/he/tools/",
    "/ru/tools/",
    "/en/tools/pdf-tools/this-is-not-a-tool/",
  ];
  for (const u of urls) {
    const r = await follow(u);
    const mark = r.status === 404 ? "404" : r.status === 200 ? "OK" : r.status === 0 ? "ERR" : String(r.status);
    console.log(`${mark}\t${r.status}\t${u}${r.error ? "\t" + r.error : ""}`);
  }
})();
