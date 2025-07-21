# Technology Stack

## Core Framework
- **HonoX**: Full-stack React framework built on Hono
- **Hono**: Fast web framework for edge computing
- **TypeScript**: Strict typing enabled throughout the project
- **Vite**: Build tool and development server

## Frontend Technologies
- **JSX**: Using Hono's JSX implementation (`jsxImportSource: "hono/jsx"`)
- **Islands Architecture**: Interactive components in `/app/islands/`
- **CSS-in-JS**: Using `hono/css` for component styling
- **Tailwind CSS**: Utility-first CSS framework with typography plugin

## Backend & Database
- **Cloudflare D1**: SQLite-compatible database
- **Zod**: Schema validation with `@hono/zod-validator`
- **Better SQLite3**: Development database (local)

## Content & Markdown
- **MDX**: Markdown with JSX support
- **Markdoc**: Additional markdown processing
- **Rehype Pretty Code**: Syntax highlighting
- **Remark**: Markdown processing plugins

## Package Management
- **Yarn 4.0.2**: Package manager (specified in packageManager field)

## Common Commands

### Development
```bash
yarn dev          # Start development server
```

### Building
```bash
yarn build        # Build for production (client + server + CSS)
```

### Deployment
```bash
yarn preview      # Preview built site locally with Wrangler
yarn deploy       # Build and deploy to Cloudflare Pages
```

## Build Process
The build process is multi-step:
1. Client build (`vite build --mode client`)
2. Server build (`vite build`)
3. Tailwind CSS compilation to `/dist/static/assets/style.css`