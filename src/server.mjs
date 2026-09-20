import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createApi } from "./api.mjs";
import { openDb } from "./db.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT ?? 4173);
const isProduction = process.env.NODE_ENV === "production";

const db = await openDb({});
const seed = JSON.parse(readFileSync(join(here, "data/texts.json"), "utf8"));
await db.seed(seed.texts ?? []);

const api = createApi({
  db,
  secret: process.env.SESSION_SECRET ?? "dev-secret-change-me",
  secureCookie: isProduction,
});

const STATIC_FILES = {
  "/app.js": "public/app.js",
  "/reader-engine.js": "public/reader-engine.js",
};

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      const type = String(req.headers["content-type"] ?? "");
      if (type.includes("application/json")) {
        try {
          resolve(JSON.parse(body || "{}"));
        } catch {
          resolve({});
        }
        return;
      }
      resolve(Object.fromEntries(new URLSearchParams(body)));
    });
  });
}

function serveStatic(res, relativePath) {
  const filePath = join(here, "..", relativePath);
  if (!existsSync(filePath)) {
    res.writeHead(404);
    return res.end("not found");
  }
  res.writeHead(200, {
    "content-type": "text/javascript; charset=utf-8",
    "cache-control": "no-store",
  });
  return res.end(readFileSync(filePath, "utf8"));
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

  if (STATIC_FILES[url.pathname]) {
    return serveStatic(res, STATIC_FILES[url.pathname]);
  }

  const result = await api({
    method: req.method,
    pathname: url.pathname,
    query: Object.fromEntries(url.searchParams),
    form: req.method === "POST" ? await readBody(req) : {},
    rawCookies: req.headers.cookie,
  });

  res.writeHead(result.status, result.headers);
  res.end(result.body);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Leitor Dinâmico Imersivo: http://0.0.0.0:${port}`);
});
