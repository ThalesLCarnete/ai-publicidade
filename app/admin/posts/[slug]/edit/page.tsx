import { notFound } from 'next/navigation'
import { PostForm } from '@/app/admin/PostForm'
import { getPostBySlug, getPostContent } from '@/lib/posts'

export default async function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post) notFound()

  const content = await getPostContent(slug)

  return <PostForm mode="edit" initial={{ ...post, content }} />
}
