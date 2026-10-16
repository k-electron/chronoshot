import { describe, expect, it } from "vitest";
import { PixiArenaRenderer } from "./PixiArenaRenderer";
import { Arena } from "../entities/Arena";

describe("PixiArenaRenderer", () => {
  it("initializes with StageCoordinator and handles render without throwing", () => {
    const renderer = new PixiArenaRenderer();
    expect(renderer.stageCoordinator).toBeDefined();
    expect(renderer.isInitialized).toBe(false);

    const arena = new Arena();
    // Prior to init, render returns gracefully
    expect(() => renderer.render(arena)).not.toThrow();
  });
});
