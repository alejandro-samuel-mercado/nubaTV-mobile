import * as SecureStore from '../utils/storage';
import { NexoContentItem } from './nexoplay';

const KEY = 'nexo_my_list';

export type MyListItem = Pick<NexoContentItem, 'id' | 'slug' | 'title' | 'posterUrl' | 'type' | 'releaseYear'>;

export async function getMyList(): Promise<MyListItem[]> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function save(list: MyListItem[]) {
  await SecureStore.setItemAsync(KEY, JSON.stringify(list));
}

export async function isInMyList(slug: string): Promise<boolean> {
  return (await getMyList()).some(i => i.slug === slug);
}

/** Toggles an item; returns true if it is now in the list. */
export async function toggleMyList(item: NexoContentItem): Promise<boolean> {
  const list = await getMyList();
  const exists = list.some(i => i.slug === item.slug);
  if (exists) {
    await save(list.filter(i => i.slug !== item.slug));
    return false;
  }
  const slim: MyListItem = {
    id: item.id, slug: item.slug, title: item.title,
    posterUrl: item.posterUrl ?? null, type: item.type, releaseYear: item.releaseYear,
  };
  await save([slim, ...list]);
  return true;
}

export async function removeFromMyList(slug: string) {
  await save((await getMyList()).filter(i => i.slug !== slug));
}
