import axios from 'axios';
import * as SecureStore from '../utils/storage';

export const NEXOPLAY_API_BASE = 'https://nexoplay-api.unixxtech.online';

export interface NexoContentItem {
  id: string;
  slug: string;
  title: string;
  originalTitle?: string;
  description?: string;
  tagline?: string | null;
  type: 'MOVIE' | 'SERIES' | 'DOCUMENTARY' | 'ANIME' | string;
  releaseYear?: number;
  duration?: number;
  rating?: number;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  genres?: { id: string; name: string; slug: string }[];
  seasons?: any[];
  videoFiles?: any[];
  thumbnails?: { id: string; type: string; url: string }[];
}

export interface NexoHomepageData {
  heroItems: NexoContentItem[];
  heroMode?: string;
  featured: NexoContentItem[];
  trending: NexoContentItem[];
  recent: NexoContentItem[];
}

export interface NexoGenre {
  id: string;
  slug: string;
  name: string;
}

export interface NexoTypeCount {
  type: string;
  count: number;
}

export interface NexoSiteConfig {
  site_name?: string;
  site_tagline?: string;
  [key: string]: any;
}

let cachedToken: string | null = null;

export async function getNexoToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  try {
    const saved = await SecureStore.getItemAsync('nexo_token');
    if (saved) {
      cachedToken = saved;
      return saved;
    }
  } catch (e) {}

  // Auto register guest user
  try {
    const username = `guest_${Date.now()}`;
    const res = await axios.post(`${NEXOPLAY_API_BASE}/api/auth/register`, {
      username,
      password: 'NexoGuest2026!',
      asGuest: true,
    });
    const token = res.data?.data?.accessToken;
    if (token) {
      cachedToken = token;
      await SecureStore.setItemAsync('nexo_token', token);
      return token;
    }
  } catch (e) {
    console.warn('Error obtaining Nexo token:', e);
  }
  return '';
}

export async function getConfig(): Promise<NexoSiteConfig> {
  try {
    const res = await axios.get(`${NEXOPLAY_API_BASE}/api/content/config`, { timeout: 8000 });
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
  } catch (e) {
    console.warn('Error fetching config:', e);
  }
  return {};
}

export async function getTypes(): Promise<NexoTypeCount[]> {
  try {
    const res = await axios.get(`${NEXOPLAY_API_BASE}/api/content/types`, { timeout: 8000 });
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data;
    }
  } catch (e) {
    console.warn('Error fetching types:', e);
  }
  return [];
}

export async function getGenres(): Promise<NexoGenre[]> {
  try {
    const res = await axios.get(`${NEXOPLAY_API_BASE}/api/content/genres`, { timeout: 8000 });
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data;
    }
  } catch (e) {
    console.warn('Error fetching genres:', e);
  }
  return [];
}

export async function getHomepage(): Promise<NexoHomepageData> {
  try {
    const res = await axios.get(`${NEXOPLAY_API_BASE}/api/content/homepage?lang=es`, { timeout: 8000 });
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
  } catch (e) {
    console.warn('Error fetching Nexo homepage:', e);
  }
  return { heroItems: [], featured: [], trending: [], recent: [] };
}

export async function getContentDetail(slug: string): Promise<NexoContentItem | null> {
  try {
    const res = await axios.get(`${NEXOPLAY_API_BASE}/api/content/${slug}`, { timeout: 8000 });
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
  } catch (e) {
    console.warn('Error fetching content detail:', e);
  }
  return null;
}

export async function getWatchStream(slug: string, episodeId?: string): Promise<{ masterPlaylist: string; [key: string]: any } | null> {
  try {
    const token = await getNexoToken();
    const url = `${NEXOPLAY_API_BASE}/api/content/${slug}/watch${episodeId ? `?episodeId=${episodeId}` : ''}`;
    const res = await axios.get(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 10000,
    });
    if (res.data?.success && res.data?.data) {
      return res.data.data;
    }
  } catch (e) {
    console.warn('Error fetching watch stream:', e);
  }
  return null;
}

export async function getContentList(params: {
  type?: string;
  genreId?: string;
  search?: string;
  sort?: string;
  limit?: number;
  page?: number;
}): Promise<NexoContentItem[]> {
  try {
    const query = new URLSearchParams();
    if (params.type) query.append('type', params.type);
    if (params.genreId) query.append('genreId', params.genreId);
    if (params.search) query.append('search', params.search);
    if (params.sort) query.append('sort', params.sort);
    if (params.limit) query.append('limit', String(params.limit));
    if (params.page) query.append('page', String(params.page));

    const res = await axios.get(`${NEXOPLAY_API_BASE}/api/content?${query.toString()}`, { timeout: 8000 });
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data;
    }
  } catch (e) {
    console.warn('Error fetching content list:', e);
  }
  return [];
}

export async function searchContent(query: string): Promise<NexoContentItem[]> {
  try {
    const res = await axios.get(`${NEXOPLAY_API_BASE}/api/content?search=${encodeURIComponent(query)}&limit=25`, { timeout: 8000 });
    if (res.data?.success && Array.isArray(res.data?.data)) {
      return res.data.data;
    }
  } catch (e) {
    console.warn('Error searching Nexo content:', e);
  }
  return [];
}

/**
 * Generic authenticated fetch used by the VOD player (/watch).
 * Mirrors NexoPlay-mobile's `apiFetch`: always resolves to `{ success, data, error }`.
 */
export async function nexoFetch(url: string, init: RequestInit = {}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const token = await getNexoToken();
    const res = await fetch(url.startsWith('http') ? url : `${NEXOPLAY_API_BASE}${url}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers as any),
      },
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: json?.error || `HTTP ${res.status}` };
    return json?.success !== undefined ? json : { success: true, data: json };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Network error' };
  }
}
