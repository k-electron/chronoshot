/**
 * RoomManager module for ChronoShot.
 *
 * Coordinates puzzle room lifecycle, exit portal locking/unlocking,
 * room transitions, boss encounter detection, and overall mission victory state:
 * - Locks exit portal until all active enemies in the current room are eliminated
 * - Detects player entrance into the exit portal to trigger room progression
 * - Manages sequential transition across 20 rooms spanning Sector 1, Zone 2, Sector 3, and Sector 4
 * - Identifies milestone boss rooms (Room 5: Goliath-01, Room 10: Chrono-Weaver, Room 15: Vektor-Prime, Room 20: Chrono-Zenith)
 * - Suppresses floor portals in boss rooms and Endless Survival Mode in favor of direct combat transitions
 * - Displays the modular Mission Accomplished victory screen upon Room 20 final boss destruction
 * - Renders dynamic portal animations (locked hazard ring vs. radiant cyan vortex) in standard tactical rooms
 */

import { vecDistance, Vector2D } from "../math/vector";
import { truncateText } from "../ui/textUtils";
import { createStandardRoomSequence, RoomConfig } from "./Room";
import { EndlessDirector } from "./EndlessDirector";
import { ApexColosseumTemplate } from "./templates/ApexColosseumTemplate";
import { computeRollbackTarget, RollbackTarget } from "./RollbackCalculator";
import { VictoryHUD } from "../ui/VictoryHUD";

/**
 * Creates the dynamic Apex Colosseum room for Endless Survival Mode.
 */
export function createEndlessSurvivalRoom(width = 960, height = 640): RoomConfig {
  return {
    id: "endless-colosseum",
    roomNumber: 21,
    title: "APEX COLOSSEUM // ENDLESS PROTOCOL",
    subtitle: "Continuous Threat Escalation Matrix",
    tacticalTip:
      "Survive against continuously climbing hostile squads. Reinforcements materialize distant from your position with 30-tick warning rings.",
    playerSpawn: ApexColosseumTemplate.playerSpawn,
    obstacles: ApexColosseumTemplate.buildObstacles(width, height),
    enemies: [],
    exitPortal: ApexColosseumTemplate.exitPortal,
  };
}

export class RoomManager {
  public endlessDirector?: EndlessDirector;
  private rooms: RoomConfig[];
  private currentRoomIndex: number = 0;
  private exitUnlocked: boolean = false;
  private gameCompleted: boolean = false;
  private portalAnimationTimer: number = 0;

  constructor(rooms?: RoomConfig[]) {
    if (Array.isArray(rooms) && rooms.length > 0) {
      this.rooms = rooms;
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
    return this.endlessDirector !== undefined;
  }

  /**
   * Returns whether the current room has unlocked a golden portal.
   * @deprecated Floor portals are suppressed in Room 20 and boss rooms.
   */
  public isGoldenPortal(): boolean {
    return false;
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
   * In endless mode (with EndlessDirector), always returns true.
   */
  public hasNextRoom(): boolean {
    if (this.endlessDirector) {
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
   * If called on the final campaign room, sets gameCompleted to true.
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
   * Seamlessly transitions the campaign into Endless Survival Mode in Apex Colosseum.
   */
  public startEndlessMode(endlessDirector?: EndlessDirector): RoomConfig {
    this.endlessDirector = endlessDirector ?? new EndlessDirector();
    this.endlessDirector.reset();
    const endlessRoom = createEndlessSurvivalRoom();
    this.rooms.push(endlessRoom);
    this.currentRoomIndex = this.rooms.length - 1;
    this.exitUnlocked = false;
    this.gameCompleted = false;
    return endlessRoom;
  }

  /**
   * Restarts the current room back to its initial locked state.
   */
  public restartCurrentRoom(): void {
    this.exitUnlocked = false;
  }

  /**
   * Computes the rollback target for the currently active room.
   */
  public getRollbackTarget(): RollbackTarget {
    const isEndless = this.endlessDirector !== undefined;
    const currentRoom = this.getCurrentRoom();
    return computeRollbackTarget(currentRoom.roomNumber, isEndless);
  }

  /**
   * Rolls back the mission progression to the computed boss checkpoint.
   */
  public rollbackToCheckpoint(): RollbackTarget {
    const target = this.getRollbackTarget();

    if (this.endlessDirector) {
      this.endlessDirector = undefined;
      if (this.rooms.length > 20) {
        this.rooms = this.rooms.slice(0, 20);
      }
    }

    this.currentRoomIndex = target.roomIndex;
    this.exitUnlocked = false;
    this.gameCompleted = false;
    return target;
  }

  /**
   * Restarts the entire mission back to Room 1.
   */
  public restartGame(): void {
    if (this.endlessDirector) {
      this.endlessDirector = undefined;
      if (this.rooms.length > 20) {
        this.rooms = this.rooms.slice(0, 20);
      }
    }
    this.currentRoomIndex = 0;
    this.exitUnlocked = false;
    this.gameCompleted = false;
  }

  /**
   * Directly sets the manager state to completed campaign victory at Room 20 (for playtest bypass).
   */
  public bypassToCampaignVictory(): void {
    if (this.endlessDirector) {
      this.endlessDirector = undefined;
      if (this.rooms.length > 20) {
        this.rooms = this.rooms.slice(0, 20);
      }
    }
    this.currentRoomIndex = Math.min(19, this.rooms.length - 1);
    this.exitUnlocked = false;
    this.gameCompleted = true;
  }

  /**
   * Renders the Exit Portal on the canvas with animated state feedback.
   * Suppressed in boss rooms and Endless Survival Mode.
   */
  public renderPortal(
    ctx: CanvasRenderingContext2D,
    wallDeltaTime: number = 0.016
  ): void {
    if (this.isBossRoom() || this.endlessDirector !== undefined) {
      return;
    }

    this.portalAnimationTimer += wallDeltaTime;
    const portal = this.getCurrentRoom().exitPortal;

    ctx.save();
    ctx.translate(portal.x, portal.y);

    if (this.exitUnlocked) {
      // Unlocked: Radiant pulsing cyan energy vortex
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
  public renderRoomHeader(
    ctx: CanvasRenderingContext2D,
    _width: number,
    isBossActive: boolean = false
  ): void {
    const room = this.getCurrentRoom();
    ctx.save();
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    const x = 24;
    const y = 20;
    const maxTitleWidth = isBossActive ? 230 : (this.endlessDirector ? 255 : 720);
    const maxTipWidth = isBossActive || this.endlessDirector ? 220 : 720;

    if (this.endlessDirector) {
      ctx.font = "bold 11px monospace";
      ctx.fillStyle = "#00f0ff";
      ctx.fillText(truncateText(ctx, room.title.toUpperCase(), maxTitleWidth), x, y);

      ctx.font = "10px monospace";
      ctx.fillStyle = "#64748b";
      const subtitle = room.subtitle ? room.subtitle.toUpperCase() : "SURVIVAL THREAT MATRIX";
      ctx.fillText(truncateText(ctx, subtitle, maxTipWidth), x, y + 18);
      ctx.restore();
      return;
    }

    // Room title badge
    ctx.font = "bold 11px monospace";
    ctx.fillStyle = "#00f0ff";
    const titleText = `${room.title.toUpperCase()}  [${room.roomNumber}/${this.rooms.length}]`;
    ctx.fillText(truncateText(ctx, titleText, maxTitleWidth), x, y);

    // Subtitle & tactical guidance
    ctx.font = "10px monospace";
    ctx.fillStyle = "#64748b";
    ctx.fillText(truncateText(ctx, room.tacticalTip, maxTipWidth), x, y + 18);

    ctx.restore();
  }

  /**
   * Renders the triumphant Mission Accomplished victory screen.
   */
  public renderGameVictory(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    hoveredCardIndex: number | null = null
  ): void {
    VictoryHUD.render(ctx, width, height, hoveredCardIndex);
  }
}
