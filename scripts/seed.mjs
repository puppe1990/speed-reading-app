import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { openDb } from "../src/db.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const seed = JSON.parse(
  readFileSync(resolve(here, "../src/data/texts.json"), "utf8"),
);

const db = await openDb({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

await db.seed(seed.texts ?? []);
db.close();

console.log(`Seed concluído: ${(seed.texts ?? []).length} textos.`);
