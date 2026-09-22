/**
 * ChronoShot - Tactical Time-Dilation Top-Down Combat Engine.
 * Main entry point wiring Canvas 2D, RoomManager, AudioSynthesizer,
 * player input handlers, and decoupled 60 Hz simulation loop.
 */

import { SoundSynthesizer } from "./audio/SoundSynthesizer";
import { Arena, ArenaInput } from "./entities/Arena";
import { RoomManager } from "./levels/RoomManager";
import { vec2 } from "./math/vector";

window.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("game-canvas") as HTMLCanvasElement | null;
  if (!canvas) {
    console.error("Game canvas element not found");
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("Failed to acquire 2D canvas context");
    return;
  }

  const roomManager = new RoomManager();
  const soundSynth = new SoundSynthesizer();
  const arena = new Arena(canvas.width, canvas.height, roomManager, soundSynth);

  // Resume Web Audio on first user interaction to comply with browser autoplay policies
  const resumeAudio = () => {
    soundSynth.resume();
  };
  window.addEventListener("mousedown", resumeAudio, { once: true });
  window.addEventListener("keydown", resumeAudio, { once: true });

  // Input state
  const keysDown = new Set<string>();
  let mousePos = vec2(canvas.width / 2, canvas.height / 2);
  let shootRequested = false;
  let reloadRequested = false;
  let restartRequested = false;
  let pauseRequested = false;
  let isMuted = false;

  // Window coordinate mapping for canvas scaling
  function getCanvasCoords(event: MouseEvent): { x: number; y: number } {
    const rect = canvas!.getBoundingClientRect();
    const scaleX = canvas!.width / rect.width;
    const scaleY = canvas!.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  // Keyboard Event Handlers
  window.addEventListener("keydown", (e: KeyboardEvent) => {
    keysDown.add(e.code);

    if (e.code === "Escape" || e.code === "KeyP") {
      e.preventDefault();
      pauseRequested = true;
    }

    if (e.code === "KeyR") {
      if (arena.status === "defeat" || arena.status === "victory") {
        restartRequested = true;
      } else if (e.shiftKey) {
        // Shift+R quick restart of current room
        restartRequested = true;
      } else {
        reloadRequested = true;
      }
    }

    if (e.code === "KeyM") {
      isMuted = !isMuted;
      soundSynth.setMuted(isMuted);
    }
  });

  window.addEventListener("keyup", (e: KeyboardEvent) => {
    keysDown.delete(e.code);
  });

  // Mouse Event Handlers
  window.addEventListener("mousemove", (e: MouseEvent) => {
    const coords = getCanvasCoords(e);
    mousePos = vec2(coords.x, coords.y);
  });

  canvas.addEventListener("mousedown", (e: MouseEvent) => {
    if (e.button === 0) {
      if (arena.status === "defeat" || arena.status === "victory") {
        restartRequested = true;
      } else if (arena.isPaused) {
        pauseRequested = true;
      } else {
        shootRequested = true;
      }
    }
  });

  // Prevent default context menu on canvas
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  // Simulation & Render Loop
  let lastTimestamp = performance.now();

  function loop(now: number): void {
    const wallDeltaTime = Math.min(0.1, (now - lastTimestamp) / 1000);
    lastTimestamp = now;

    // Construct input direction vector from WASD / Arrows
    let moveX = 0;
    let moveY = 0;
    if (keysDown.has("KeyW") || keysDown.has("ArrowUp")) moveY -= 1;
    if (keysDown.has("KeyS") || keysDown.has("ArrowDown")) moveY += 1;
    if (keysDown.has("KeyA") || keysDown.has("ArrowLeft")) moveX -= 1;
    if (keysDown.has("KeyD") || keysDown.has("ArrowRight")) moveX += 1;

    const input: ArenaInput = {
      moveDir: vec2(moveX, moveY),
      mousePos,
      shoot: shootRequested,
      reload: reloadRequested,
      restart: restartRequested,
      togglePause: pauseRequested,
    };

    // Reset single-frame triggers
    shootRequested = false;
    reloadRequested = false;
    restartRequested = false;
    pauseRequested = false;

    // Step physics & fixed simulation
    arena.step(wallDeltaTime, input);

    // Render frame
    arena.render(ctx!, wallDeltaTime);

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
});
