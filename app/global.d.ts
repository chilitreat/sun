import {} from 'hono'

type Head = {
  title?: string
  hasScript?: boolean
}

declare module 'hono' {
  interface Env {
    Bindings: {
      DATABASE: D1Database
    }
  }
  interface ContextRenderer {
    (content: string | Promise<string>, head?: Head): Response | Promise<Response>
  }
}