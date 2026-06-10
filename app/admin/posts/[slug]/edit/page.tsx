import { notFound } from 'next/navigation'
import { PostForm } from '@/app/admin/PostForm'
import fs from 'fs'
import path from 'path'
import { getPostBySlug } from '@/lib/posts'

export default async function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const filePath = path.join(process.cwd(), 'content/posts', `${slug}.mdx`)
  const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : ''

  return <PostForm mode="edit" initial={{ ...post, content }} />
}
