import { createServer } from "vite";
import puppeteer from "puppeteer-core";
import fs from "fs";
import path from "path";

async function main() {
  console.log("==> Starting Vite development server on port 5174...");
  const server = await createServer({
    server: { port: 5174 },
  });
  await server.listen();

  console.log("==> Launching Headless Google Chrome...");
  const browser = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--autoplay-policy=no-user-gesture-required",
      "--mute-audio",
      "--window-size=1200,800",
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800, devicePixelRatio: 1 });

  console.log("==> Navigating to ChronoShot Room 04...");
  await page.goto("http://localhost:5174/?room=4", { waitUntil: "networkidle0" });

  console.log("==> Injecting gifenc bundle...");
  await page.evaluate(() => {
    window.exports = {};
  });
  const gifencPath = path.resolve("node_modules/gifenc/dist/gifenc.js");
  await page.addScriptTag({ path: gifencPath });

  console.log("==> Starting deterministic tactical choreography & recording...");
  const gifBase64 = await page.evaluate(async () => {
    const arena = window.__arena;
    if (!arena) throw new Error("Arena not found on window");

    const canvas = document.getElementById("game-canvas");
    const ctx = canvas.getContext("2d");

    const { GIFEncoder, quantize, applyPalette } = window.exports;
    const gif = GIFEncoder();

    const targetWidth = 800;
    const targetHeight = 533;
    const offCanvas = document.createElement("canvas");
    offCanvas.width = targetWidth;
    offCanvas.height = targetHeight;
    const offCtx = offCanvas.getContext("2d");

    // Prime sniper laser cooldown so charging begins immediately in slow-mo
    const sniper = arena.enemies.find((e) => e.type === "marksman");
    if (sniper && sniper.attack) {
      sniper.attack.fireCooldownTicks = 30; // Enters laser charge immediately
    }

    // Capture loop: 90 frames @ 20 fps = 4.5s
    const totalFrames = 90;
    const fps = 20;
    const frameDelayMs = 1000 / fps; // 50ms

    // Choreography phases:
    // Frame 0-18: Stationary (5% micro-creep). Sniper laser charges slowly.
    // Frame 19-38: Sprint down (KeyS + KeyD) behind bunker-bottom.
    // Frame 39: Stop behind cover. Sniper beam discharges harmlessly into bunker.
    // Frame 40-46: Peek up (KeyW) to clear sightline, aiming reticle at sniper.
    // Frame 47: Shoot revolver!
    // Frame 48-70: Duck back down (KeyS). Movement keeps time scale at 1.00x so bullet streaks across arena!
    // Frame 71: Player bullet strikes sniper, shattering it into glowing particles.
    // Frame 72: Stop moving (release KeyS).
    // Frame 73-89: Slow-motion returns as shatter particles dissipate and exit portal unlocks.

    function setKeyDown(code) {
      window.dispatchEvent(new KeyboardEvent("keydown", { code, bubbles: true }));
    }
    function setKeyUp(code) {
      window.dispatchEvent(new KeyboardEvent("keyup", { code, bubbles: true }));
    }
    function setMouseMove(canvasX, canvasY) {
      const rect = canvas.getBoundingClientRect();
      const clientX = rect.left + (canvasX * rect.width) / 960;
      const clientY = rect.top + (canvasY * rect.height) / 640;
      window.dispatchEvent(
        new MouseEvent("mousemove", { clientX, clientY, bubbles: true })
      );
    }
    function fireClick(canvasX, canvasY) {
      const rect = canvas.getBoundingClientRect();
      const clientX = rect.left + (canvasX * rect.width) / 960;
      const clientY = rect.top + (canvasY * rect.height) / 640;
      canvas.dispatchEvent(
        new MouseEvent("mousedown", { clientX, clientY, button: 0, bubbles: true })
      );
    }

    // Initial reticle position
    setMouseMove(780, 320);

    const logs = [];
    for (let f = 0; f < totalFrames; f++) {
      if (f === 19) {
        setKeyDown("KeyS");
        setKeyDown("KeyD");
      } else if (f === 38) {
        setKeyUp("KeyS");
        setKeyUp("KeyD");
      } else if (f === 40) {
        setKeyDown("KeyW");
        setMouseMove(780, 320);
      } else if (f === 46) {
        setKeyUp("KeyW");
        setMouseMove(780, 320);
      } else if (f === 47) {
        fireClick(780, 320);
      } else if (f === 48) {
        // Duck back down behind bunker
        setKeyDown("KeyS");
        setMouseMove(780, 320);
      } else if (f === 72) {
        setKeyUp("KeyS");
      }

      // Wait for next RAF frame
      await new Promise((resolve) => requestAnimationFrame(resolve));

      if (f % 5 === 0 || f === 47 || f === 70 || f === 75 || f === 85) {
        const sniperUnit = arena.enemies.find((e) => e.type === "marksman");
        logs.push({
          frame: f,
          status: arena.status,
          playerPos: { x: Math.round(arena.player.position.x), y: Math.round(arena.player.position.y) },
          sniperPos: sniperUnit ? { x: Math.round(sniperUnit.position.x), y: Math.round(sniperUnit.position.y) } : null,
          timeScale: arena.timeGovernor.getTimeScale().toFixed(2),
          projectiles: arena.projectiles.map((p) => ({
            owner: p.owner,
            x: Math.round(p.position.x),
            y: Math.round(p.position.y),
          })),
          sniperAlive: sniperUnit?.isAlive,
        });
      }

      // Capture frame
      offCtx.clearRect(0, 0, targetWidth, targetHeight);
      offCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
      const { data } = offCtx.getImageData(0, 0, targetWidth, targetHeight);

      // Quantize and write GIF frame
      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);
      gif.writeFrame(index, targetWidth, targetHeight, {
        palette,
        delay: frameDelayMs,
      });
    }

    gif.finish();
    const bytes = gif.bytes();
    let binary = "";
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return { gifBase64: btoa(binary), logs };
  });

  console.log("==> Choreography logs:", JSON.stringify(gifBase64.logs, null, 2));

  const outputDir = path.resolve("docs/assets");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "gameplay-preview.gif");
  const buffer = Buffer.from(gifBase64.gifBase64, "base64");
  fs.writeFileSync(outputPath, buffer);

  const stats = fs.statSync(outputPath);
  console.log(`==> Successfully created ${outputPath}`);
  console.log(`==> GIF size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);

  await browser.close();
  await server.close();
}

main().catch((err) => {
  console.error("Capture error:", err);
  process.exit(1);
});
