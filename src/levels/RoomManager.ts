/**
 * RoomManager module for ChronoShot.
 *
 * Coordinates puzzle room lifecycle, exit portal locking/unlocking,
 * room transitions, and overall mission victory state:
 * - Locks exit portal until all active enemies in the current room are eliminated
 * - Detects player entrance into the exit portal to trigger room progression
 * - Manages sequential transition across Room 1 -> Room 2 -> Room 3
 * - Displays the final Mission Accomplished victory screen upon room 3 completion
 * - Renders dynamic portal animations (locked hazard ring vs. radiant cyan vortex)
 */

import { vecDistance, Vector2D } from "../math/vector";
import { createStandardRoomSequence, RoomConfig } from "./Room";

export class RoomManager {
  private rooms: RoomConfig[];
  private currentRoomIndex: number = 0;
  private exitUnlocked: boolean = false;
  private gameCompleted: boolean = false;
  private portalAnimationTimer: number = 0;

  constructor(rooms?: RoomConfig[]) {
    this.rooms = rooms && rooms.length > 0 ? rooms : createStandardRoomSequence();
    this.currentRoomIndex = 0;
    this.exitUnlocked = false;
    this.gameCompleted = false;
  }

  /**
   * Returns total count of rooms in the sequence.
   */
  public getRoomCount(): number {
    return this.rooms.length;
  }

  /**
   * Returns the 0-based index of the currently active room.
   */
  public getCurrentRoomIndex(): number {
    return this.currentRoomIndex;
  }

  /**
   * Returns the configuration of the currently active room.
   */
  public getCurrentRoom(): RoomConfig {
    return this.rooms[this.currentRoomIndex];
  }

  /**
   * Returns whether the exit portal is currently unlocked.
   */
  public isExitUnlocked(): boolean {
    return this.exitUnlocked;
  }

  /**
   * Returns whether all rooms have been cleared and the game is finished.
   */
  public isGameCompleted(): boolean {
    return this.gameCompleted;
  }

  /**
   * Returns whether there is a subsequent room after the current one.
   */
  public hasNextRoom(): boolean {
    return this.currentRoomIndex < this.rooms.length - 1;
  }

  /**
   * Inspects enemy forces in the current room. Unlocks the exit portal once
   * all enemies have been eliminated.
   *
   * @returns true if the portal transitioned from locked to unlocked on this call.
   */
  public updateEnemyState(enemies: readonly { isAlive: boolean }[]): boolean {
    const aliveCount = enemies.filter((e) => e.isAlive).length;
    const shouldUnlock = aliveCount === 0 && enemies.length > 0;

    if (shouldUnlock && !this.exitUnlocked) {
      this.exitUnlocked = true;
      return true;
    }
    return false;
  }

  /**
   * Directly sets the exit portal lock state (e.g. for testing).
   */
  public setExitUnlocked(unlocked: boolean): void {
    this.exitUnlocked = unlocked;
  }

  /**
   * Checks if the player's bounding circle has entered the exit portal.
   */
  public isPlayerInExitPortal(
    playerPos: Vector2D,
    playerRadius: number = 14
  ): boolean {
    if (!this.exitUnlocked) {
      return false;
    }
    const portal = this.getCurrentRoom().exitPortal;
    const distance = vecDistance(playerPos, { x: portal.x, y: portal.y });
    return distance <= portal.radius + playerRadius;
  }

  /**
   * Advances the sequence to the next room.
   * If called on the final room, sets gameCompleted to true.
   *
   * @returns true if progressed to next room; false if final room completed.
   */
  public advanceRoom(): boolean {
    if (this.hasNextRoom()) {
      this.currentRoomIndex++;
      this.exitUnlocked = false;
      return true;
    } else {
      this.gameCompleted = true;
      return false;
    }
  }

  /**
   * Restarts the current room back to its initial locked state.
   */
  public restartCurrentRoom(): void {
    this.exitUnlocked = false;
  }

  /**
   * Restarts the entire mission back to Room 1.
   */
  public restartGame(): void {
    this.currentRoomIndex = 0;
    this.exitUnlocked = false;
    this.gameCompleted = false;
  }

  /**
   * Renders the Exit Portal on the canvas with animated state feedback.
   */
  public renderPortal(
    ctx: CanvasRenderingContext2D,
    wallDeltaTime: number = 0.016
  ): void {
    this.portalAnimationTimer += wallDeltaTime;
    const portal = this.getCurrentRoom().exitPortal;

    ctx.save();
    ctx.translate(portal.x, portal.y);

    if (this.exitUnlocked) {
      // Unlocked: Radiant pulsing cyan/emerald energy vortex
      const pulse = Math.sin(this.portalAnimationTimer * 4) * 3;
      const r = Math.max(1, portal.radius + pulse);

      // Outer radial glow
      const grad = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.5);
      grad.addColorStop(0, "rgba(0, 240, 255, 0.45)");
      grad.addColorStop(0.5, "rgba(0, 255, 170, 0.25)");
      grad.addColorStop(1, "rgba(0, 240, 255, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Spinning vortex ring
      ctx.rotate(this.portalAnimationTimer * 2.5);
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#00f0ff";
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      // Radiant white core
      ctx.setLineDash([]);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(0, 0, portal.radius * 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.rotate(-this.portalAnimationTimer * 2.5);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "900 11px monospace";
      ctx.fillStyle = "#00f0ff";
      ctx.fillText("EXIT GATE", 0, portal.radius + 18);
    } else {
      // Locked: Dim crimson barrier with lock indicator
      const pulse = Math.sin(this.portalAnimationTimer * 2) * 0.15;
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(255, 60, 60, ${0.45 + pulse})`;
      ctx.fillStyle = "rgba(40, 10, 10, 0.35)";
      ctx.beginPath();
      ctx.arc(0, 0, portal.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Crossed lock symbol
      ctx.strokeStyle = "#ff4455";
      ctx.lineWidth = 2;
      const crossSize = 7;
      ctx.beginPath();
      ctx.moveTo(-crossSize, -crossSize);
      ctx.lineTo(crossSize, crossSize);
      ctx.moveTo(crossSize, -crossSize);
      ctx.lineTo(-crossSize, crossSize);
      ctx.stroke();

      // Status text
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 10px monospace";
      ctx.fillStyle = "rgba(255, 100, 100, 0.75)";
      ctx.fillText("LOCKED", 0, portal.radius + 16);
    }

    ctx.restore();
  }

  /**
   * Renders the Room Title, Subtitle, and Tactical Tip at the top of the arena.
   */
  public renderRoomHeader(ctx: CanvasRenderingContext2D, width: number): void {
    const room = this.getCurrentRoom();
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    // Room title badge
    ctx.font = "900 14px monospace";
    ctx.fillStyle = "#00f0ff";
    ctx.fillText(
      `${room.title}  [${room.roomNumber}/${this.rooms.length}]`,
      width / 2,
      12
    );

    // Subtitle & tactical guidance
    ctx.font = "bold 11px monospace";
    ctx.fillStyle = "#8b949e";
    ctx.fillText(room.tacticalTip, width / 2, 30);

    ctx.restore();
  }

  /**
   * Renders the triumphant Mission Accomplished victory screen.
   */
  public renderGameVictory(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void {
    ctx.save();
    ctx.fillStyle = "rgba(6, 14, 22, 0.9)";
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Cyberpunk geometric border
    ctx.strokeStyle = "#00f0ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    // Accent corner tabs
    const cornerSize = 16;
    ctx.fillStyle = "#00f0ff";
    ctx.fillRect(40, 40, cornerSize, 4);
    ctx.fillRect(40, 40, 4, cornerSize);
    ctx.fillRect(width - 40 - cornerSize, 40, cornerSize, 4);
    ctx.fillRect(width - 44, 40, 4, cornerSize);
    ctx.fillRect(40, height - 44, cornerSize, 4);
    ctx.fillRect(40, height - 40 - cornerSize, 4, cornerSize);
    ctx.fillRect(width - 40 - cornerSize, height - 44, cornerSize, 4);
    ctx.fillRect(width - 44, height - 40 - cornerSize, 4, cornerSize);

    // Title
    ctx.font = "900 42px monospace";
    ctx.fillStyle = "#00f0ff";
    ctx.fillText("MISSION ACCOMPLISHED", width / 2, height / 2 - 75);

    // Subtitle
    ctx.font = "bold 18px monospace";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("ALL 3 PUZZLE PROTOCOLS CONQUERED", width / 2, height / 2 - 20);

    // Protocol checkmarks
    ctx.font = "13px monospace";
    ctx.fillStyle = "#7ee787";
    ctx.fillText(
      "✓ 1v1 Cover Mastery  |  ✓ 2v1 Flank Defense  |  ✓ Buckshot Neutralized",
      width / 2,
      height / 2 + 30
    );

    // Reset prompt
    ctx.font = "bold 16px monospace";
    ctx.fillStyle = "#e0e6ed";
    ctx.fillText("PRESS [R] TO PLAY AGAIN", width / 2, height / 2 + 90);

    ctx.restore();
  }
}
