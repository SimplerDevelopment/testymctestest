const CMS_API_URL = process.env.CMS_API_URL || 'https://simplerdevelopment.com';
const SITE_ID = process.env.SITE_ID || '';

function apiUrl(path: string) {
  return `${CMS_API_URL}/api/public/websites/${SITE_ID}${path}`;
}

export type Post = {
  id: number;
  title: string;
  slug: string;
  postType: string;
  excerpt: string | null;
  coverImage: string | null;
  publishedAt: string | null;
};

export type PostDetail = Post & {
  content: string;
  categories: { id: number; name: string; slug: string; color: string | null }[];
  tags: { id: number; name: string; slug: string }[];
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
};

export type Tag = {
  id: number;
  name: string;
  slug: string;
};

export type MediaItem = {
  id: number;
  filename: string;
  mimeType: string;
  url: string;
  thumbnailUrl: string | null;
  alt: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
};

type ApiResponse<T> = { success: true; data: T } | { success: false; message: string };

type PaginatedResponse<T> = {
  success: true;
  data: T[];
  pagination: { limit: number; offset: number; total: number };
};

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!SITE_ID) return null;
  const res = await fetch(apiUrl(path), {
    next: { revalidate: 60 },
    ...init,
  });
  if (!res.ok) return null;
  const json = await res.json() as ApiResponse<T>;
  return json.success ? json.data : null;
}

async function fetchPaginated<T>(path: string): Promise<{ data: T[]; total: number }> {
  if (!SITE_ID) return { data: [], total: 0 };
  const res = await fetch(apiUrl(path), { next: { revalidate: 60 } });
  if (!res.ok) return { data: [], total: 0 };
  const json = await res.json() as PaginatedResponse<T>;
  return json.success ? { data: json.data, total: json.pagination.total } : { data: [], total: 0 };
}

export async function getPosts(opts?: {
  postType?: string;
  category?: string;
  tag?: string;
  limit?: number;
  offset?: number;
}) {
  const params = new URLSearchParams();
  if (opts?.postType) params.set('postType', opts.postType);
  if (opts?.category) params.set('category', opts.category);
  if (opts?.tag) params.set('tag', opts.tag);
  if (opts?.limit) params.set('limit', String(opts.limit));
  if (opts?.offset) params.set('offset', String(opts.offset));
  const qs = params.toString();
  return fetchPaginated<Post>(`/posts${qs ? `?${qs}` : ''}`);
}

export async function getPost(slug: string) {
  return fetchApi<PostDetail>(`/posts/${slug}`);
}

export async function getCategories() {
  return fetchApi<Category[]>('/categories') ?? [];
}

export async function getTags() {
  return fetchApi<Tag[]>('/tags') ?? [];
}

export async function getMedia(opts?: { limit?: number; offset?: number; mimeType?: string }) {
  const params = new URLSearchParams();
  if (opts?.limit) params.set('limit', String(opts.limit));
  if (opts?.offset) params.set('offset', String(opts.offset));
  if (opts?.mimeType) params.set('mimeType', opts.mimeType);
  const qs = params.toString();
  return fetchPaginated<MediaItem>(`/media${qs ? `?${qs}` : ''}`);
}
