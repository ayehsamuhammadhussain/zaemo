// Builds www/ from the live site (zaemo.vercel.app) so the APK always matches the web app,
// bundles the two CDN libraries locally and rewrites the imports.
import { build } from "esbuild";
import fs from "node:fs";
const SITE = "https://zaemo.vercel.app/";
const out = "www";
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const files = ["index.html","manifest.webmanifest","icon.svg","main.js","crypto.js","calls.js","data.js",
  "core.js","core_1.js","core_2.js",
  "ui_chat.js","ui_chat_1.js","ui_chat_2.js","ui_chat_3.js","ui_chat_4.js",
  "ui_main.js","ui_main_1.js","ui_main_2.js","ui_main_3.js","ui_main_4.js","ui_main_5.js","ui_main_6.js",
  "style.css","st1.css","st2.css","st3.css"];
for (const f of files) {
  const r = await fetch(SITE + f + "?b=" + Date.now());
  if (!r.ok) throw new Error(f + ": HTTP " + r.status);
  fs.writeFileSync(`${out}/${f}`, Buffer.from(await r.arrayBuffer()));
}
fs.mkdirSync(`${out}/vendor`, { recursive: true });
await build({ stdin: { contents: 'export * from "@supabase/supabase-js";', resolveDir: ".", loader: "js" }, bundle: true, format: "esm", platform: "browser", outfile: `${out}/vendor/supabase.js`, minify: true });
await build({ stdin: { contents: 'import q from "qrcode-generator"; export default q;', resolveDir: ".", loader: "js" }, bundle: true, format: "esm", platform: "browser", outfile: `${out}/vendor/qrcode.js`, minify: true });
const rw = (f, a, b) => { const p = `${out}/${f}`; const s = fs.readFileSync(p, "utf8"); if (!s.includes(a)) throw new Error(`${f}: ${a} not found`); fs.writeFileSync(p, s.split(a).join(b)); };
rw("core_1.js", "https://esm.sh/@supabase/supabase-js@2.45.4", "./vendor/supabase.js");
rw("ui_main_4.js", "https://esm.sh/qrcode-generator@1.4.4", "./vendor/qrcode.js");
// no service worker inside the app: files are already bundled in the APK
rw("main.js", 'navigator.serviceWorker.register("sw.js")', 'Promise.reject()');
for (const f of fs.readdirSync(out)) if (f.endsWith(".js") && fs.readFileSync(`${out}/${f}`, "utf8").includes("esm.sh")) throw new Error(f + " still uses esm.sh");
console.log("www ready:", fs.readdirSync(out).join(", "));
