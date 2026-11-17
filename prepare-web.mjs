// Builds www/ from src/web: bundles the two CDN libraries locally so the app
// does not depend on esm.sh at startup, then rewrites the imports.
import { build } from "esbuild";
import fs from "node:fs";
const out = "www";
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const f of ["index.html","manifest.webmanifest","main.js","crypto.js","core.js","calls.js","data.js","ui_chat.js","ui_main.js","style.css","icon.svg"]) fs.copyFileSync(f, `${out}/${f}`);
fs.mkdirSync(`${out}/vendor`, { recursive: true });
await build({ stdin: { contents: 'export * from "@supabase/supabase-js";', resolveDir: ".", loader: "js" }, bundle: true, format: "esm", platform: "browser", outfile: `${out}/vendor/supabase.js`, minify: true });
await build({ stdin: { contents: 'import q from "qrcode-generator"; export default q;', resolveDir: ".", loader: "js" }, bundle: true, format: "esm", platform: "browser", outfile: `${out}/vendor/qrcode.js`, minify: true });
const rw = (f, a, b) => { const p = `${out}/${f}`; const s = fs.readFileSync(p, "utf8"); if (!s.includes(a)) throw new Error(`${f}: ${a} not found`); fs.writeFileSync(p, s.split(a).join(b)); };
rw("core.js", "https://esm.sh/@supabase/supabase-js@2.45.4", "./vendor/supabase.js");
rw("ui_main.js", "https://esm.sh/qrcode-generator@1.4.4", "./vendor/qrcode.js");
// no service worker inside the app: files are already bundled in the APK
rw("main.js", 'navigator.serviceWorker.register("sw.js")', 'Promise.reject()');

for (const f of fs.readdirSync(out)) if (f.endsWith(".js") && fs.readFileSync(`${out}/${f}`, "utf8").includes("esm.sh")) throw new Error(f + " still uses esm.sh");
console.log("www ready:", fs.readdirSync(out).join(", "));
