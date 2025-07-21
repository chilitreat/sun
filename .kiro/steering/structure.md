# Project Structure

## Root Directory
- `package.json` - Project dependencies and scripts
- `tsconfig.json` - TypeScript configuration with strict mode
- `vite.config.ts` - Vite build configuration with dual-mode setup
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `blog.sql` - Database schema and seed data

## Application Structure (`/app`)

### Core Files
- `server.ts` - Main server entry point using HonoX
- `client.ts` - Client-side hydration setup
- `style.css` - Global CSS styles (processed by Tailwind)
- `types.ts` - Shared TypeScript type definitions
- `db.ts` - Database operations and queries
- `utils.ts` - Utility functions
- `global.d.ts` - Global type declarations

### Components (`/app/components`)
Static React components that don't require client-side interactivity:
- Use `hono/css` for styling
- Export as default or named exports
- Follow functional component patterns

### Islands (`/app/islands`)
Interactive components that run on the client:
- Use React hooks (useState, useEffect, etc.)
- Handle user interactions and dynamic behavior
- Automatically hydrated on the client

### Routes (`/app/routes`)
File-based routing following HonoX conventions:
- Each file represents a route
- Support for nested routing
- Can include MDX files for content pages

## Naming Conventions
- **Files**: camelCase for TypeScript/JSX files
- **Components**: PascalCase for component names
- **CSS Classes**: Use Tailwind utilities or `hono/css` classes
- **Database**: snake_case for table and column names
- **Types**: PascalCase for type definitions

## Architecture Patterns
- **Islands Architecture**: Static components + selective hydration
- **File-based Routing**: Routes defined by file structure
- **CSS-in-JS**: Component-scoped styles with `hono/css`
- **Type Safety**: Strict TypeScript throughout
- **Edge-First**: Optimized for Cloudflare Workers/Pages