import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * On-demand ISR revalidation endpoint.
 * Called by the CMS platform after content is saved.
 *
 * POST /api/revalidate
 * Body: { secret: string, path?: string, paths?: string[] }
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { secret, path, paths } = body;

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ success: false, message: 'Invalid secret' }, { status: 401 });
  }

  const toRevalidate: string[] = [];

  if (path) toRevalidate.push(path);
  if (Array.isArray(paths)) toRevalidate.push(...paths);

  // Always revalidate the blog index and home page too
  toRevalidate.push('/blog', '/');

  const revalidated: string[] = [];
  for (const p of [...new Set(toRevalidate)]) {
    try {
      revalidatePath(p);
      revalidated.push(p);
    } catch {
      // Path may not exist — skip
    }
  }

  return NextResponse.json({ success: true, revalidated });
}
