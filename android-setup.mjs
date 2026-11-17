// Run after `npx cap add android`: permissions, portrait, theme colours, icons, splash.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
const A = "android/app/src/main";
// manifest
let m = fs.readFileSync(`${A}/AndroidManifest.xml`, "utf8");
const perms = ["android.permission.CAMERA", "android.permission.RECORD_AUDIO", "android.permission.MODIFY_AUDIO_SETTINGS", "android.permission.POST_NOTIFICATIONS"];
for (const p of perms) if (!m.includes(p)) m = m.replace("</manifest>", `    <uses-permission android:name="${p}" />\n</manifest>`);
if (!m.includes("android.hardware.camera")) m = m.replace("</manifest>", `    <uses-feature android:name="android.hardware.camera" android:required="false" />\n    <uses-feature android:name="android.hardware.microphone" android:required="false" />\n</manifest>`);
m = m.replace(/<activity\b/, '<activity android:screenOrientation="portrait"').replace(/android:windowSoftInputMode="[^"]*"/, "").replace(/<activity\b/, '<activity android:windowSoftInputMode="adjustResize"');
fs.writeFileSync(`${A}/AndroidManifest.xml`, m);
// version
const g = "android/app/build.gradle";
let b = fs.readFileSync(g, "utf8").replace(/versionCode \d+/, "versionCode 1").replace(/versionName "[^"]*"/, 'versionName "1.0.0"');
fs.writeFileSync(g, b);
// bar colours
const sp = `${A}/res/values/styles.xml`;
let s = fs.readFileSync(sp, "utf8");
s = s.replace(/(<style name="AppTheme.NoActionBar"[^>]*>)/, `$1\n        <item name="android:statusBarColor">#050d0c</item>\n        <item name="android:navigationBarColor">#050d0c</item>\n        <item name="android:windowBackground">#050d0c</item>`);
fs.writeFileSync(sp, s);
// icons
const svg = fs.readFileSync("icon.svg");
fs.rmSync(`${A}/res/mipmap-anydpi-v26`, { recursive: true, force: true });
const dens = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
for (const [d, px] of Object.entries(dens)) {
  const dir = `${A}/res/mipmap-${d}`; fs.mkdirSync(dir, { recursive: true });
  const png = await sharp(svg, { density: 300 }).resize(px, px).png().toBuffer();
  for (const n of ["ic_launcher", "ic_launcher_round", "ic_launcher_foreground"]) fs.writeFileSync(`${dir}/${n}.png`, png);
}
// splash
const splash = await sharp({ create: { width: 1080, height: 1920, channels: 4, background: "#050d0c" } })
  .composite([{ input: await sharp(svg, { density: 300 }).resize(360, 360).png().toBuffer(), gravity: "center" }]).png().toBuffer();
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (f === "splash.png") fs.writeFileSync(p, splash); } })(`${A}/res`);
console.log("android configured");
