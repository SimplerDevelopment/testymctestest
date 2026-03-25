import Link from 'next/link';
import { getPosts } from '@/lib/cms';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Latest articles and updates',
};

export default async function BlogIndex() {
  const { data: posts } = await getPosts({ postType: 'blog' });

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
      <p className="mt-2 text-gray-600">Latest articles and updates</p>

      {posts.length === 0 ? (
        <p className="mt-12 text-gray-500">No posts yet. Check back soon.</p>
      ) : (
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block rounded-lg border border-gray-200 p-6 transition hover:border-gray-400 hover:shadow-sm"
            >
              {post.coverImage && (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="mb-4 aspect-video w-full rounded-md object-cover"
                />
              )}
              <h2 className="text-xl font-semibold group-hover:underline">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                  {post.excerpt}
                </p>
              )}
              {post.publishedAt && (
                <time className="mt-3 block text-xs text-gray-400">
                  {new Date(post.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
