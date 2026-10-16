/**
 * ChronoShot - MockPixiRenderer
 *
 * Lightweight, pure-TypeScript headless mocks for Pixi display objects
 * (MockContainer, MockGraphics, MockApplication) allowing scene graph unit
 * tests to execute deterministically in Vitest's pure Node environment.
 */

export class MockGraphics {
  public x = 0;
  public y = 0;
  public rotation = 0;
  public alpha = 1;
  public visible = true;
  public parent: MockContainer | null = null;

  public commands: Array<{ type: string; args: unknown[] }> = [];

  public clear(): this {
    this.commands = [];
    return this;
  }

  public beginPath(): this {
    this.commands.push({ type: "beginPath", args: [] });
    return this;
  }

  public closePath(): this {
    this.commands.push({ type: "closePath", args: [] });
    return this;
  }

  public moveTo(x: number, y: number): this {
    this.commands.push({ type: "moveTo", args: [x, y] });
    return this;
  }

  public lineTo(x: number, y: number): this {
    this.commands.push({ type: "lineTo", args: [x, y] });
    return this;
  }

  public rect(x: number, y: number, w: number, h: number): this {
    this.commands.push({ type: "rect", args: [x, y, w, h] });
    return this;
  }

  public arc(
    x: number,
    y: number,
    r: number,
    startAngle: number,
    endAngle: number,
    anticlockwise = false
  ): this {
    this.commands.push({ type: "arc", args: [x, y, r, startAngle, endAngle, anticlockwise] });
    return this;
  }

  public poly(points: number[] | Array<{ x: number; y: number }>): this {
    this.commands.push({ type: "poly", args: [points] });
    return this;
  }

  public fill(style?: unknown): this {
    this.commands.push({ type: "fill", args: [style] });
    return this;
  }

  public stroke(style?: unknown): this {
    this.commands.push({ type: "stroke", args: [style] });
    return this;
  }

  public cut(): this {
    this.commands.push({ type: "cut", args: [] });
    return this;
  }

  public destroy(): void {
    this.commands = [];
    if (this.parent) {
      this.parent.removeChild(this);
    }
  }
}

export class MockContainer {
  public x = 0;
  public y = 0;
  public rotation = 0;
  public alpha = 1;
  public visible = true;
  public parent: MockContainer | null = null;
  public children: Array<MockContainer | MockGraphics> = [];
  public filters: unknown[] = [];

  public addChild<T extends MockContainer | MockGraphics>(child: T): T {
    child.parent = this;
    this.children.push(child);
    return child;
  }

  public removeChild<T extends MockContainer | MockGraphics>(child: T): T | null {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parent = null;
      return child;
    }
    return null;
  }

  public removeChildren(): void {
    for (const c of this.children) {
      c.parent = null;
    }
    this.children = [];
  }

  public destroy(): void {
    this.removeChildren();
    if (this.parent) {
      this.parent.removeChild(this);
    }
  }
}

export class MockApplication {
  public stage: MockContainer = new MockContainer();
  public renderer = {
    resolution: 1,
    width: 960,
    height: 640,
    render: () => {},
  };

  public async init(options?: {
    width?: number;
    height?: number;
    resolution?: number;
    autoDensity?: boolean;
    preserveDrawingBuffer?: boolean;
  }): Promise<void> {
    if (options?.width) this.renderer.width = options.width;
    if (options?.height) this.renderer.height = options.height;
    if (options?.resolution) this.renderer.resolution = options.resolution;
  }

  public destroy(): void {
    this.stage.destroy();
  }
}
