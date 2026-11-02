import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    getContinueWatching,
    removeContinue,
    saveProgress,
} from "./continueWatching";

const fakeStore: Record<string, string> = {};

vi.mock("../utils/storage", () => ({
  __esModule: true,
  getItemAsync: vi.fn(async (key: string) => fakeStore[key] ?? null),
  setItemAsync: vi.fn(async (key: string, value: string) => {
    fakeStore[key] = value;
  }),
  deleteItemAsync: vi.fn(async (key: string) => {
    delete fakeStore[key];
  }),
}));

describe("continueWatching", () => {
  beforeEach(() => {
    for (const key of Object.keys(fakeStore)) {
      delete fakeStore[key];
    }
  });

  it("guarda progreso de un contenido y lo devuelve ordenado por fecha", async () => {
    await saveProgress({
      slug: "episode-1",
      title: "Episodio 1",
      posterUrl: "https://example.com/poster.jpg",
      durationMs: 120000,
      positionMs: 30000,
    });

    const list = await getContinueWatching();

    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      slug: "episode-1",
      title: "Episodio 1",
      positionMs: 30000,
      durationMs: 120000,
    });
    expect(list[0].updatedAt).toBeTypeOf("number");
  });

  it("ignora progreso muy corto para no guardar falsos inicios", async () => {
    await saveProgress({
      slug: "short-start",
      title: "Short Start",
      posterUrl: null,
      durationMs: 120000,
      positionMs: 5000,
    });

    expect(await getContinueWatching()).toEqual([]);
  });

  it("elimina un item cuando ya está visto casi al 100%", async () => {
    await saveProgress({
      slug: "finished-show",
      title: "Finished Show",
      posterUrl: null,
      durationMs: 100000,
      positionMs: 98000,
    });

    expect(await getContinueWatching()).toEqual([]);
  });

  it("borra un contenido de la lista cuando se llama a removeContinue", async () => {
    await saveProgress({
      slug: "remove-me",
      title: "Remove Me",
      posterUrl: null,
      durationMs: 100000,
      positionMs: 50000,
    });

    await removeContinue("remove-me");
    expect(await getContinueWatching()).toEqual([]);
  });
});
