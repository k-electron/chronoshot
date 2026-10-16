import { describe, expect, it } from "vitest";
import { MockApplication, MockContainer, MockGraphics } from "./MockPixiRenderer";
import { PixiContext2DAdapter } from "./PixiContext2DAdapter";
import { measureTextWidth, truncateText, wrapTextLines } from "../../ui/textUtils";

describe("headless rendering harness", () => {
  describe("PixiContext2DAdapter", () => {
    it("records transform hierarchy and restores properly", () => {
      const adapter = new PixiContext2DAdapter();
      adapter.save();
      adapter.translate(100, 200);
      adapter.rotate(Math.PI / 4);
      adapter.scale(2, 2);
      adapter.restore();

      expect(adapter.drawCalls).toEqual([
        { type: "save", args: [] },
        { type: "translate", args: [100, 200] },
        { type: "rotate", args: [Math.PI / 4] },
        { type: "scale", args: [2, 2] },
        { type: "restore", args: [] },
      ]);
    });

    it("records path operations and drawing strokes/fills", () => {
      const adapter = new PixiContext2DAdapter();
      adapter.beginPath();
      adapter.moveTo(10, 20);
      adapter.lineTo(30, 40);
      adapter.arc(50, 50, 15, 0, Math.PI * 2);
      adapter.closePath();
      adapter.fill();
      adapter.stroke();

      expect(adapter.pathCommands).toHaveLength(4);
      expect(adapter.drawCalls.some((c) => c.type === "fill")).toBe(true);
      expect(adapter.drawCalls.some((c) => c.type === "stroke")).toBe(true);
    });

    it("satisfies textUtils word-wrapping and truncation parity", () => {
      const adapter = new PixiContext2DAdapter();
      const text = "RESTORES SECTOR 1 ENTRY LOADOUT (0 AUGMENTATIONS)";

      // measureTextWidth uses measureText with 7px per char
      const width = measureTextWidth(adapter as unknown as CanvasRenderingContext2D, text);
      expect(width).toBe(text.length * 7);

      const truncated = truncateText(
        adapter as unknown as CanvasRenderingContext2D,
        text,
        140
      );
      expect(truncated.endsWith("…")).toBe(true);

      const wrapped = wrapTextLines(
        adapter as unknown as CanvasRenderingContext2D,
        text,
        150,
        2
      );
      expect(wrapped.length).toBeLessThanOrEqual(2);
    });

    it("supports setLineDash and gradient stubs", () => {
      const adapter = new PixiContext2DAdapter();
      adapter.setLineDash([4, 4]);
      expect(adapter.getLineDash()).toEqual([4, 4]);

      const grad = adapter.createRadialGradient();
      expect(typeof grad.addColorStop).toBe("function");
    });
  });

  describe("MockPixiRenderer", () => {
    it("asynchronously initializes MockApplication with options", async () => {
      const app = new MockApplication();
      await app.init({
        width: 960,
        height: 640,
        resolution: 2,
        preserveDrawingBuffer: true,
      });

      expect(app.renderer.width).toBe(960);
      expect(app.renderer.height).toBe(640);
      expect(app.renderer.resolution).toBe(2);
    });

    it("manages MockContainer parent-child hierarchy and clean destruction", () => {
      const root = new MockContainer();
      const childContainer = new MockContainer();
      const graphics = new MockGraphics();

      root.addChild(childContainer);
      childContainer.addChild(graphics);

      expect(root.children).toContain(childContainer);
      expect(childContainer.children).toContain(graphics);
      expect(graphics.parent).toBe(childContainer);

      graphics.rect(0, 0, 100, 100);
      graphics.fill(0xff0000);
      expect(graphics.commands).toHaveLength(2);

      root.destroy();
      expect(root.children).toHaveLength(0);
      expect(childContainer.parent).toBeNull();
    });
  });
});
