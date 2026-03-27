import { notFound } from 'next/navigation';
import { getPost, getPosts } from '@/lib/cms';
import { BlockRenderer } from '@/components/blocks/render/BlockRenderer';
import type { Metadata } from 'next';

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

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
  const { data: pages } = await getPosts({ postType: 'page', limit: 100 });
  return pages.map((page) => ({ slug: page.slug }));
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post || post.postType !== 'page') notFound();

  return (
    <BlockRenderer content={post.content} />
  );
}
