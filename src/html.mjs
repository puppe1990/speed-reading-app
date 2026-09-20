export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Inline SVG favicon (data URI) so the app has no extra file to serve and no
// /favicon.ico 404 in dev.
export const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230b0d10'/%3E%3Cpath d='M10 8h8a5 5 0 0 1 5 5v11H15a5 5 0 0 0-5 5' fill='none' stroke='%2322d3ee' stroke-width='2' stroke-linecap='round'/%3E%3Ccircle cx='19' cy='14' r='2.4' fill='%2322d3ee'/%3E%3C/svg%3E";

// Safe to drop inside a <script type="application/json"> island: only "<"
// can terminate the tag early, so escaping it is enough.
export function jsonIsland(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
