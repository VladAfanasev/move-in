# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Development
- `bun dev` - Start development server with Turbopack at http://localhost:3000
- `bun run build` - Build the production application with Turbopack
- `bun run start` - Start production server

### Code Quality
- `bun run lint` - Run Biome linter to check for issues
- `bun run lint:fix` - Auto-fix linting issues
- `bun run format` - Format code with Biome
- `bun run check` - Run both linter and formatter with auto-fix
- `bunx tsc --noEmit` - Run TypeScript type checking

### Database Management (Drizzle)
- `bun run db:generate` - Generate migration files from schema changes
- `bun run db:migrate` - Apply migrations to the database
- `bun run db:push` - Push schema changes directly to database (dev only)
- `bun run db:studio` - Open Drizzle Studio for database exploration

### Docker Deployment
- `docker compose up -d` - Run the application via Docker Compose
- `docker compose logs -f` - View container logs
- Image is published to `ghcr.io/vladafanasev/move-in:main` on push to main branch

## Architecture Overview

This is a Next.js 15 application using:
- **App Router** with file-based routing in `app/(routes)/`
- **Biome** for linting and formatting (configured in `biome.json`)
- **TypeScript** with strict mode enabled
- **Turbopack** for fast development builds
- **Standalone output** for optimized Docker deployments
- **Supabase** for authentication and real-time database
- **Drizzle ORM** for type-safe database schema and migrations

### Project Structure
- `app/(routes)/` - Next.js App Router pages and layouts
- `app/assets/styles/` - Global CSS styles
- `components/` - Reusable React components
- `lib/supabase/` - Supabase client configurations (browser, server, middleware)
- `db/` - Database schema and migrations (Drizzle ORM)
  - `db/schema/` - Table definitions (auth, properties, groups)
  - `db/migrations/` - Generated migration files
- `public/` - Static assets served directly
- Path alias `@/*` maps to project root

### Database Schema
- **profiles** - User profiles extending Supabase auth
- **properties** - Real estate listings
- **buying_groups** - Groups for shared property purchases
- **group_members** - Membership and ownership details
- **group_properties** - Properties saved by groups

### Deployment
The application is containerized and optimized for ARM64 (Raspberry Pi 5):
- GitHub Actions automatically builds and publishes Docker images to GitHub Container Registry
- Multi-stage Docker build produces minimal production image
- Standalone Next.js output reduces runtime dependencies

## Code Standards

### Biome Configuration
- Indentation: 2 spaces
- Line width: 100 characters
- Quotes: Double quotes for strings
- Trailing commas: Always
- Semicolons: As needed
- JSX quotes: Double quotes
- Sorted Tailwind classes for className attributes

### TypeScript
- Strict mode enabled
- Target ES2017
- Module resolution: bundler
- No unused imports or variables (enforced by linter)