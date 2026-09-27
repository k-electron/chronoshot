/**
 * PortalTransition module for ChronoShot.
 *
 * Coordinates the two-phase cyberpunk iris aperture transition across room progression:
 * - "ingress": Contracts a high-contrast geometric octagonal iris aperture to the exit portal
 *   while magnetically drawing the operative's chassis into the portal center.
 * - At midpoint: Invokes atomic room progression and loads the subsequent tactical layout.
 * - "egress": Expands the octagonal iris aperture outward from the player's new spawn coordinates,
 *   revealing the tactical environment and restoring full player locomotion upon completion.
 */

import { Vector2D } from "../math/vector";

export type PortalTransitionPhase = "none" | "ingress" | "egress";

export interface PortalTransitionConfig {
  ingressDuration?: number;
  egressDuration?: number;
  maxIrisRadius?: number;
}

export class PortalTransitionController {
  private phase: PortalTransitionPhase = "none";
  private elapsed: number = 0;
  private ingressDuration: number;
  private egressDuration: number;
  private maxIrisRadius: number;

  private portalCenter: Vector2D = { x: 0, y: 0 };
  private egressCenter: Vector2D = { x: 0, y: 0 };
  private startPlayerPos: Vector2D | null = null;

  constructor(config?: PortalTransitionConfig) {
    this.ingressDuration = config?.ingressDuration ?? 0.14;
    this.egressDuration = config?.egressDuration ?? 0.14;
    this.maxIrisRadius = config?.maxIrisRadius ?? 750;
  }

  /**
   * Initiates the inward ingress contraction sequence centered on the exit portal.
   */
  public startIngress(portalCenter: Vector2D): void {
    this.phase = "ingress";
    this.elapsed = 0;
    this.portalCenter = { x: portalCenter.x, y: portalCenter.y };
    this.egressCenter = { x: portalCenter.x, y: portalCenter.y };
    this.startPlayerPos = null;
  }

  /**
   * Advances the transition clock and smoothly pulls the player toward the portal center.
   * Invokes onMidpoint when ingress completes, transitioning to egress, and onComplete
   * when egress completes.
   */
  public update(
    wallDeltaTime: number,
    playerPos: Vector2D,
    onMidpoint: () => Vector2D | void,
    onComplete?: () => void
  ): void {
    if (this.phase === "none") {
      return;
    }

    if (this.phase === "ingress") {
      if (!this.startPlayerPos) {
        this.startPlayerPos = { x: playerPos.x, y: playerPos.y };
      }

      this.elapsed += wallDeltaTime;
      const progress = Math.min(1, Math.max(0, this.elapsed / this.ingressDuration));

      // Smooth cubic ease-in-out magnetic pull
      const easeT = progress * progress * (3 - 2 * progress);
      playerPos.x =
        this.startPlayerPos.x + (this.portalCenter.x - this.startPlayerPos.x) * easeT;
      playerPos.y =
        this.startPlayerPos.y + (this.portalCenter.y - this.startPlayerPos.y) * easeT;

      if (this.elapsed >= this.ingressDuration) {
        playerPos.x = this.portalCenter.x;
        playerPos.y = this.portalCenter.y;
        this.phase = "egress";
        this.elapsed = 0;
        this.startPlayerPos = null;

        const newSpawn = onMidpoint();
        if (newSpawn) {
          this.egressCenter = { x: newSpawn.x, y: newSpawn.y };
        } else {
          this.egressCenter = { x: playerPos.x, y: playerPos.y };
        }
      }
      return;
    }

    if (this.phase === "egress") {
      this.elapsed += wallDeltaTime;

      if (this.elapsed >= this.egressDuration) {
        this.phase = "none";
        this.elapsed = 0;
        this.startPlayerPos = null;
        if (onComplete) {
          onComplete();
        }
      }
      return;
    }
  }

  /**
   * Renders the geometric cyberpunk iris aperture.
   * - A dark shroud (rgba(11, 13, 17, 0.95)) covering (0, 0, width, height) with an octagonal aperture cutout using evenodd winding rule.
   * - An octagonal rim stroked with radiant cyan #00f0ff (lineWidth = 2.5).
   * - 8 hairline aperture blade accents (rgba(0, 240, 255, 0.6), lineWidth = 1) radiating outward from the 8 octagonal vertices.
   */
  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    if (this.phase === "none") {
      return;
    }

    const center = this.phase === "ingress" ? this.portalCenter : this.egressCenter;
    const radius = this.getRadius();

    ctx.save();

    // Dark shroud with octagonal cutout using evenodd
    ctx.beginPath();
    ctx.rect(0, 0, width, height);

    if (radius > 0.5) {
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const x = center.x + radius * Math.cos(angle);
        const y = center.y + radius * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
    }

    ctx.fillStyle = "rgba(11, 13, 17, 0.95)";
    ctx.fill("evenodd");

    if (radius > 1) {
      // Octagonal rim stroked with radiant cyan
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const x = center.x + radius * Math.cos(angle);
        const y = center.y + radius * Math.sin(angle);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = "#00f0ff";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // 8 hairline aperture blade accents radiating outward from the 8 octagonal vertices
      ctx.beginPath();
      const bladeLength = Math.min(40, radius * 0.4 + 15);
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const vx = center.x + radius * Math.cos(angle);
        const vy = center.y + radius * Math.sin(angle);
        ctx.moveTo(vx, vy);
        ctx.lineTo(
          vx + bladeLength * Math.cos(angle),
          vy + bladeLength * Math.sin(angle)
        );
      }
      ctx.strokeStyle = "rgba(0, 240, 255, 0.6)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Returns the current lifecycle phase ("none" | "ingress" | "egress").
   */
  public getPhase(): PortalTransitionPhase {
    return this.phase;
  }

  /**
   * Returns whether a portal transition sequence is currently active.
   */
  public isActive(): boolean {
    return this.phase !== "none";
  }

  /**
   * Returns current aperture radius.
   * Contracts from maxIrisRadius down to 0 during ingress.
   * Expands from 0 up to maxIrisRadius during egress.
   */
  public getRadius(): number {
    if (this.phase === "none") {
      return this.maxIrisRadius;
    }
    if (this.phase === "ingress") {
      const progress = Math.min(1, Math.max(0, this.elapsed / this.ingressDuration));
      return Math.max(0, (1 - progress) * this.maxIrisRadius);
    }
    if (this.phase === "egress") {
      const progress = Math.min(1, Math.max(0, this.elapsed / this.egressDuration));
      return Math.min(this.maxIrisRadius, progress * this.maxIrisRadius);
    }
    return this.maxIrisRadius;
  }

  /**
   * Returns normalized [0, 1] progression of the active phase.
   */
  public getProgress(): number {
    if (this.phase === "ingress") {
      return Math.min(1, Math.max(0, this.elapsed / this.ingressDuration));
    }
    if (this.phase === "egress") {
      return Math.min(1, Math.max(0, this.elapsed / this.egressDuration));
    }
    return 0;
  }

  /**
   * Resets transition state back to idle.
   */
  public reset(): void {
    this.phase = "none";
    this.elapsed = 0;
    this.startPlayerPos = null;
  }
}
