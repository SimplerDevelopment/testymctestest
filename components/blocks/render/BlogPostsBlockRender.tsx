'use client';

import { BlogPostsBlock } from '@/types/blocks';

interface BlogPostsBlockRenderProps {
  block: BlogPostsBlock;
}

/**
 * Placeholder for blog-posts blocks on client websites.
 * Blog data is fetched from the CMS API at the page level, so this
 * embedded block type is not supported in the starter and renders nothing.
 */
export function BlogPostsBlockRender({ block }: BlogPostsBlockRenderProps) {
  return null;
}
