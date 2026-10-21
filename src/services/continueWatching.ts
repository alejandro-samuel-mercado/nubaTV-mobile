import * as SecureStore from '../utils/storage';

const KEY = 'nexo_continue_watching';
const MAX_ITEMS = 20;

export interface ContinueItem {
  slug: string;
  title: string;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  type?: string;
  episodeId?: string;
  positionMs: number;
  durationMs: number;
  updatedAt: number;
}

export async function getContinueWatching(): Promise<ContinueItem[]> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    const list: ContinueItem[] = raw ? JSON.parse(raw) : [];
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

async function write(list: ContinueItem[]) {
  await SecureStore.setItemAsync(KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
}

/** Guarda el progreso. Si ya se vio >95% (o falta muy poco) se elimina de la lista. */
export async function saveProgress(
  item: Omit<ContinueItem, 'updatedAt'>
): Promise<void> {
  const list = await getContinueWatching();
  const rest = list.filter(i => i.slug !== item.slug);
  const finished =
    item.durationMs > 0 && item.positionMs / item.durationMs > 0.95;
  // Ignorar si recién empezó (<15s) para no llenar la lista de falsos inicios
  if (finished) {
    await write(rest);
    return;
  }
  if (item.positionMs < 15000) return;
  await write([{ ...item, updatedAt: Date.now() }, ...rest]);
}

export async function removeContinue(slug: string): Promise<void> {
  const list = await getContinueWatching();
  await write(list.filter(i => i.slug !== slug));
}
