import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPost, getPosts } from '@/lib/cms';
import { BlockRenderer } from '@/components/blocks/render/BlockRenderer';
import type { Metadata } from 'next';

export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Not Found' };
  return {
    title: post.title,
    description: post.excerpt || undefined,
  };
}

export async function generateStaticParams() {
  const { data: posts } = await getPosts({ postType: 'blog', limit: 100 });
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPost({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const isEditMode = sp._edit === 'true';

  const post = await getPost(slug);

  if (!isEditMode && !post) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/blog"
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to Blog
      </Link>

      <article className="mt-8">
        {post?.coverImage && (
          <img
            src={post.coverImage}
            alt={post.title}
            className="mb-8 aspect-video w-full rounded-lg object-cover"
          />
        )}

        <h1 className="text-4xl font-bold tracking-tight">{post?.title || 'Untitled'}</h1>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-gray-500">
          {post?.publishedAt && (
            <time>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          )}
          {post?.categories.map((cat) => (
            <span
              key={cat.id}
              className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium"
              style={cat.color ? { backgroundColor: cat.color + '20', color: cat.color } : undefined}
            >
              {cat.name}
            </span>
          ))}
        </div>

        {(post?.tags.length ?? 0) > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post?.tags.map((tag) => (
              <span
                key={tag.id}
                className="text-xs text-gray-400"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        <div className="prose prose-gray mt-8 max-w-none">
          <BlockRenderer content={post?.content || '{"blocks":[],"version":"1.0"}'} />
        </div>
      </article>
    </main>
  );
}
