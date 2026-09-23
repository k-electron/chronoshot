/**
 * RoomManager module for ChronoShot.
 *
 * Coordinates puzzle room lifecycle, exit portal locking/unlocking,
 * room transitions, boss encounter detection, and overall mission victory state:
 * - Locks exit portal until all active enemies in the current room are eliminated
 * - Detects player entrance into the exit portal to trigger room progression
 * - Manages sequential transition across 14 rooms spanning Sector 1, Zone 2, and Sector 3
 * - Identifies milestone boss rooms (Room 5: Goliath-01, Room 10: Chrono-Weaver)
 * - Displays the final Mission Accomplished victory screen upon room 14 completion
 * - Renders dynamic portal animations (locked hazard ring vs. radiant cyan vortex)
 */

import { vecDistance, Vector2D } from "../math/vector";
import { getUIFont, UITheme } from "../ui/theme";
import { createStandardRoomSequence, RoomConfig } from "./Room";
import { LevelDirector } from "./LevelDirector";

export class RoomManager {
  public readonly levelDirector?: LevelDirector;
  private rooms: RoomConfig[];
  private currentRoomIndex: number = 0;
  private exitUnlocked: boolean = false;
  private gameCompleted: boolean = false;
  private portalAnimationTimer: number = 0;

  constructor(roomsOrDirector?: RoomConfig[] | LevelDirector) {
    if (roomsOrDirector instanceof LevelDirector) {
      this.levelDirector = roomsOrDirector;
      this.rooms = [this.levelDirector.generateRoom(1)];
    } else if (Array.isArray(roomsOrDirector) && roomsOrDirector.length > 0) {
      this.rooms = roomsOrDirector;
    } else {
      this.rooms = createStandardRoomSequence();
    }
    this.currentRoomIndex = 0;
    this.exitUnlocked = false;
    this.gameCompleted = false;
  }

  /**
   * Returns whether the manager is running in dynamic endless mode.
   */
  public isEndlessMode(): boolean {
    return this.levelDirector !== undefined;
  }

  /**
   * Returns total count of rooms currently loaded in the sequence.
   */
  public getRoomCount(): number {
    return this.rooms.length;
  }

  /**
   * Returns whether the active room is a boss encounter.
   */
  public isBossRoom(): boolean {
    const currentRoom = this.getCurrentRoom();
    return (
      (currentRoom.roomNumber > 0 && currentRoom.roomNumber % 5 === 0) ||
      currentRoom.enemies.some((e) => (e.type as string) === "boss")
    );
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
   * In endless mode (with LevelDirector), always returns true.
   */
  public hasNextRoom(): boolean {
    if (this.levelDirector) {
      return true;
    }
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
   * In endless mode, synthesizes the subsequent room dynamically.
   * If called on the final campaign room, sets gameCompleted to true.
   *
   * @returns true if progressed to next room; false if final room completed.
   */
  public advanceRoom(): boolean {
    if (this.levelDirector) {
      this.currentRoomIndex++;
      this.exitUnlocked = false;
      if (this.currentRoomIndex >= this.rooms.length) {
        this.rooms.push(this.levelDirector.generateRoom(this.currentRoomIndex + 1));
      }
      return true;
    }

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
    if (this.levelDirector) {
      this.rooms = [this.levelDirector.generateRoom(1)];
    }
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
   * Renders the Room Title, Subtitle, and Tactical Tip anchored cleanly in the top-left corner.
   */
  public renderRoomHeader(ctx: CanvasRenderingContext2D, _width: number): void {
    const room = this.getCurrentRoom();
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const x = 24;
    const y = 20;

    // Room title badge
    ctx.font = "bold 11px monospace";
    ctx.fillStyle = "#00f0ff";
    ctx.fillText(
      `${room.title.toUpperCase()}  [${room.roomNumber}/${this.rooms.length}]`,
      x,
      y
    );

    // Subtitle & tactical guidance
    ctx.font = "10px monospace";
    ctx.fillStyle = "#64748b";
    ctx.fillText(room.tacticalTip, x, y + 18);

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
    ctx.fillStyle = "rgba(7, 10, 15, 0.92)";
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Minimalist hairline frame
    ctx.strokeStyle = UITheme.colors.panelBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(60, 60, width - 120, height - 120);

    // Accent corner tabs
    const cornerSize = 14;
    ctx.strokeStyle = UITheme.colors.cyan;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Top-left
    ctx.moveTo(60, 60 + cornerSize);
    ctx.lineTo(60, 60);
    ctx.lineTo(60 + cornerSize, 60);
    // Top-right
    ctx.moveTo(width - 60 - cornerSize, 60);
    ctx.lineTo(width - 60, 60);
    ctx.lineTo(width - 60, 60 + cornerSize);
    // Bottom-left
    ctx.moveTo(60, height - 60 - cornerSize);
    ctx.lineTo(60, height - 60);
    ctx.lineTo(60 + cornerSize, height - 60);
    // Bottom-right
    ctx.moveTo(width - 60 - cornerSize, height - 60);
    ctx.lineTo(width - 60, height - 60);
    ctx.lineTo(width - 60, height - 60 - cornerSize);
    ctx.stroke();

    // Title
    ctx.font = getUIFont(34, "800");
    ctx.fillStyle = UITheme.colors.cyan;
    ctx.fillText("MISSION ACCOMPLISHED", width / 2, height / 2 - 75);

    // Subtitle
    ctx.font = getUIFont(13, "600");
    ctx.fillStyle = UITheme.colors.textPrimary;
    ctx.fillText("ALL 14 TACTICAL PROTOCOLS CONQUERED", width / 2, height / 2 - 20);

    // Protocol checkmarks
    ctx.font = getUIFont(11, "600");
    ctx.fillStyle = UITheme.colors.green;
    ctx.fillText(
      "✓ Goliath-01 Defeated  |  ✓ Chrono-Weaver Neutralized  |  ✓ Sector 3 Conquered",
      width / 2,
      height / 2 + 30
    );

    // Reset prompt
    ctx.font = getUIFont(12, "bold");
    ctx.fillStyle = UITheme.colors.textPrimary;
    ctx.fillText("PRESS [R] TO PLAY AGAIN", width / 2, height / 2 + 90);

    ctx.restore();
  }
}
