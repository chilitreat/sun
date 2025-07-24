export type Meta = {
  emoji: string
  title: string
  author: string
  created_at: string
  hashtags?: string[] | string
}

export type PostWithNavigation = {
  id: string
  frontmatter: Meta
  previousPost?: { id: string; title: string }
  nextPost?: { id: string; title: string }
}