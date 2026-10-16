/**
 * ChronoShot - DisplayObjectPool
 *
 * Object pool for high-churn visual elements (projectiles, particle shards)
 * recycling PIXI.Graphics instances to eliminate GC pauses and memory leakage.
 */

import { Container, Graphics } from "pixi.js";

export class DisplayObjectPool {
  private parentContainer: Container;
  private pool: Graphics[] = [];
  private active: Graphics[] = [];

  constructor(parentContainer: Container, initialSize = 32) {
    this.parentContainer = parentContainer;
    for (let i = 0; i < initialSize; i++) {
      const g = new Graphics();
      g.visible = false;
      this.parentContainer.addChild(g);
      this.pool.push(g);
    }
  }

  /**
   * Acquires a recycled or newly instantiated Graphics object.
   */
  public acquire(): Graphics {
    let g: Graphics;
    if (this.pool.length > 0) {
      g = this.pool.pop()!;
    } else {
      g = new Graphics();
      this.parentContainer.addChild(g);
    }
    g.visible = true;
    this.active.push(g);
    return g;
  }

  /**
   * Releases an active Graphics object back into the pool.
   */
  public release(g: Graphics): void {
    const idx = this.active.indexOf(g);
    if (idx !== -1) {
      this.active.splice(idx, 1);
    }
    g.clear();
    g.visible = false;
    this.pool.push(g);
  }

  /**
   * Cleans and returns all active objects back to the pool.
   */
  public releaseAll(): void {
    for (const g of this.active) {
      g.clear();
      g.visible = false;
      this.pool.push(g);
    }
    this.active = [];
  }

  public getActiveCount(): number {
    return this.active.length;
  }

  public getPoolSize(): number {
    return this.pool.length + this.active.length;
  }

  public destroy(): void {
    for (const g of this.active) {
      g.destroy();
    }
    for (const g of this.pool) {
      g.destroy();
    }
    this.active = [];
    this.pool = [];
  }
}
