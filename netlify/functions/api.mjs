import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createApi } from "../../src/api.mjs";
import { openDb } from "../../src/db.mjs";

const here = dirname(fileURLToPath(import.meta.url));
let cachedApi;

async function getApi() {
  if (cachedApi) return cachedApi;
  const db = await openDb({});
  const seed = JSON.parse(
    readFileSync(join(here, "../../src/data/texts.json"), "utf8"),
  );
  await db.seed(seed.texts ?? []);
  cachedApi = createApi({
    db,
    secret: process.env.SESSION_SECRET,
    secureCookie: true,
  });
  return cachedApi;
}

export default async function handler(request) {
  const api = await getApi();
  const url = new URL(request.url);
  let form = {};

  if (request.method === "POST") {
    const type = String(request.headers.get("content-type") ?? "");
    if (type.includes("application/json")) {
      form = await request.json().catch(() => ({}));
    } else {
      form = Object.fromEntries((await request.formData()).entries());
    }
  }

  const result = await api({
    method: request.method,
    pathname: url.pathname,
    query: Object.fromEntries(url.searchParams),
    form,
    rawCookies: request.headers.get("cookie"),
  });

  return new Response(result.body === "" ? null : result.body, {
    status: result.status,
    headers: result.headers,
  });
}

export const config = {
  path: ["/", "/signin", "/signup", "/logout", "/api/*"],
};
