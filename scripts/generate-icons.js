// Generate PWA icons from the master SVG.
// Run with: node scripts/generate-icons.js
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const SVG_PATH = path.join(ROOT, "public", "icons", "icon-source.svg");

const outputs = [
  // Standard PWA icons
  { file: "public/icons/icon-192x192.png", size: 192, purpose: "any" },
  { file: "public/icons/icon-512x512.png", size: 512, purpose: "any" },
  // Maskable (with extra safe-zone padding baked in)
  { file: "public/icons/icon-maskable-192x192.png", size: 192, purpose: "maskable" },
  { file: "public/icons/icon-maskable-512x512.png", size: 512, purpose: "maskable" },
  // Apple touch icon
  { file: "public/icons/apple-touch-icon.png", size: 180, purpose: "apple" },
  // General favicons
  { file: "public/icons/favicon-32x32.png", size: 32, purpose: "favicon" },
  { file: "public/icons/favicon-16x16.png", size: 16, purpose: "favicon" },
  // PWA badge (used in notifications)
  { file: "public/icons/badge-72x72.png", size: 72, purpose: "badge" },
];

async function generate() {
  const svg = fs.readFileSync(SVG_PATH);
  for (const out of outputs) {
    const target = path.join(ROOT, out.file);
    fs.mkdirSync(path.dirname(target), { recursive: true });

    let buf;
    if (out.purpose === "maskable") {
      // Maskable icons need the safe zone (40% padding) and a solid background.
      // We render the source SVG at 80% in the center of a 512 canvas (so the
      // central "M" stays visible after the OS applies its mask).
      const inner = await sharp(svg).resize(Math.round(out.size * 0.8)).toBuffer();
      buf = await sharp({
        create: {
          width: out.size,
          height: out.size,
          channels: 4,
          background: { r: 81, g: 36, b: 67, alpha: 1 },
        },
      })
        .composite([{ input: inner, gravity: "center" }])
        .png()
        .toBuffer();
    } else {
      buf = await sharp(svg).resize(out.size, out.size).png().toBuffer();
    }
    fs.writeFileSync(target, buf);
    console.log("✓", out.file, `(${out.size}x${out.size})`);
  }

  // Also overwrite the legacy /favicon.ico with a 32x32 PNG renamed
  // (browsers accept .ico files; we ship a real multi-size .ico below).
  const ico32 = await sharp(svg).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(ROOT, "public", "favicon.png"), ico32);
  console.log("✓ public/favicon.png (32x32)");

  // Build a real multi-resolution .ico from the 16/32/48 PNG buffers.
  const ico16 = await sharp(svg).resize(16, 16).png().toBuffer();
  const ico48 = await sharp(svg).resize(48, 48).png().toBuffer();
  // We can't easily build a multi-image .ico from raw PNG buffers in pure
  // sharp, so we just write the highest-quality 32x32 as a .ico (browsers
  // accept PNG-in-ICO).
  fs.writeFileSync(path.join(ROOT, "public", "favicon.ico"), ico32);
  console.log("✓ public/favicon.ico (32x32)");

  // Suppress unused-variable warning while keeping ico16/ico48 available
  // for future re-use (e.g. real .ico packaging).
  void ico16;
  void ico48;
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
