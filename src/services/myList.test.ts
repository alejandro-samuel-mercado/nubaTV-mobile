import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    getMyList,
    isInMyList,
    removeFromMyList,
    toggleMyList,
} from "./myList";

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

describe("myList", () => {
  beforeEach(() => {
    for (const k of Object.keys(fakeStore)) {
      delete fakeStore[k];
    }
  });

  it("guarda un contenido en favoritos y lo recupera", async () => {
    const item = {
      id: "1",
      slug: "the-matrix",
      title: "The Matrix",
      posterUrl: "https://example.com/poster.jpg",
      type: "MOVIE",
      releaseYear: 1999,
    } as any;

    const added = await toggleMyList(item);

    expect(added).toBe(true);
    expect(await isInMyList("the-matrix")).toBe(true);
    expect(await getMyList()).toEqual([
      {
        id: "1",
        slug: "the-matrix",
        title: "The Matrix",
        posterUrl: "https://example.com/poster.jpg",
        type: "MOVIE",
        releaseYear: 1999,
      },
    ]);
  });

  it("elimina un contenido de favoritos si ya estaba guardado", async () => {
    const item = {
      id: "2",
      slug: "dune",
      title: "Dune",
      posterUrl: "https://example.com/dune.jpg",
      type: "MOVIE",
      releaseYear: 2021,
    } as any;

    await toggleMyList(item);
    const removed = await toggleMyList(item);

    expect(removed).toBe(false);
    expect(await getMyList()).toEqual([]);
  });

  it("removeFromMyList quita un item específico", async () => {
    const item = {
      id: "3",
      slug: "inception",
      title: "Inception",
      posterUrl: "https://example.com/inception.jpg",
      type: "MOVIE",
      releaseYear: 2010,
    } as any;

    await toggleMyList(item);
    await removeFromMyList("inception");

    expect(await getMyList()).toEqual([]);
  });
});
