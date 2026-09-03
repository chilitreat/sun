import {} from 'hono'
import type { Meta } from './types'

type Head = {
  title?: string
  hasScript?: boolean
}

declare module 'hono' {
  interface ContextRenderer {
    (
      content: string | Promise<string>,
      meta?: Meta & { frontmatter: Meta },
      head?: Head
    ): Response | Promise<Response>
  }
}
