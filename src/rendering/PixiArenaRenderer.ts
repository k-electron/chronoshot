/**
 * ChronoShot - PixiArenaRenderer
 *
 * Coordinates the Pixi.js v8 Application, StageCoordinator, and rendering of an Arena instance.
 * Decouples 60 Hz physics from high-refresh visual presentation via sub-tick interpolation.
 */

import { Application, Container, Sprite, Texture } from "pixi.js";
import { Arena } from "../entities/Arena";
import { StageCoordinator } from "./StageCoordinator";

export interface PixiArenaRendererOptions {
  width?: number;
  height?: number;
  preserveDrawingBuffer?: boolean;
}

export class PixiArenaRenderer {
  public app: Application;
  public stageCoordinator: StageCoordinator;

  // Offscreen transition bridge for incremental component migration
  private bridgeCanvas: HTMLCanvasElement | null = null;
  private bridgeCtx: CanvasRenderingContext2D | null = null;
  private bridgeSprite: Sprite | null = null;
  private bridgeTexture: Texture | null = null;

  public isInitialized = false;

  constructor(app?: Application) {
    this.app = app || new Application();
    this.stageCoordinator = new StageCoordinator(this.app.stage as Container);
  }

  /**
   * Asynchronously initializes the Pixi.js v8 Application with high-DPI retina scaling
   * and frame buffer preservation for automated gameplay preview capture.
   */
  public async init(
    canvas: HTMLCanvasElement,
    options: PixiArenaRendererOptions = {}
  ): Promise<void> {
    const width = options.width ?? 960;
    const height = options.height ?? 640;
    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 3) : 1;

    await this.app.init({
      canvas,
      width,
      height,
      resolution: dpr,
      autoDensity: true,
      antialias: true,
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? true,
      preference: "webgl",
    });

    // Setup offscreen canvas texture bridge for seamless zero-downtime component migration
    if (typeof document !== "undefined") {
      this.bridgeCanvas = document.createElement("canvas");
      this.bridgeCanvas.width = Math.round(width * dpr);
      this.bridgeCanvas.height = Math.round(height * dpr);
      this.bridgeCtx = this.bridgeCanvas.getContext("2d");
      if (this.bridgeCtx) {
        this.bridgeCtx.scale(dpr, dpr);
        this.bridgeTexture = Texture.from(this.bridgeCanvas);
        this.bridgeSprite = new Sprite(this.bridgeTexture);
        this.bridgeSprite.width = width;
        this.bridgeSprite.height = height;
        // Attach bridge sprite to root stage as fallback render surface
        this.stageCoordinator.hudContainer.addChild(this.bridgeSprite);
      }
    }

    this.isInitialized = true;
  }

  /**
   * Renders the current state of an Arena with sub-tick interpolation.
   */
  public render(arena: Arena, wallDeltaTime = 0.016): void {
    if (!this.isInitialized) {
      return;
    }

    // 1. Render arena state via bridge context
    if (this.bridgeCtx && this.bridgeTexture) {
      this.bridgeCtx.clearRect(0, 0, 960, 640);
      arena.render(this.bridgeCtx, wallDeltaTime);
      this.bridgeTexture.source.update();
    }

    // 2. Render Pixi Application stage
    this.app.renderer.render(this.app.stage);
  }

  public destroy(): void {
    if (this.bridgeSprite) {
      this.bridgeSprite.destroy();
    }
    if (this.bridgeTexture) {
      this.bridgeTexture.destroy();
    }
    this.stageCoordinator.destroy();
    this.app.destroy(true, { children: true });
    this.isInitialized = false;
  }
}
