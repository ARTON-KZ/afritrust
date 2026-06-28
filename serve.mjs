// Minimal static dev server for the afritrust site.
// Serves the project root at http://localhost:3000
// Usage: node serve.mjs   (optional: PORT=4000 node serve.mjs)

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { join, extname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".map": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json",
};

async function resolvePath(urlPath) {
  // Decode, strip query/hash, and prevent path traversal outside ROOT.
  let pathname = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  if (pathname.endsWith("/")) pathname += "index.html";
  const safe = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  let filePath = join(ROOT, safe);
  if (!filePath.startsWith(ROOT)) return null;

  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = join(filePath, "index.html");
    return filePath;
  } catch {
    return filePath; // let the read fail -> 404
  }
}

const server = createServer(async (req, res) => {
  const filePath = await resolvePath(req.url || "/");
  if (!filePath) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  try {
    const body = await readFile(filePath);
    const type = MIME[extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>404 Not Found</h1>");
  }
});

server.listen(PORT, () => {
  console.log(`afritrust dev server running at http://localhost:${PORT}`);
  console.log(`serving: ${ROOT}`);
});
