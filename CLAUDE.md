# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Astro Course Hub** is a modern, universal university course resource navigation and syllabus reading station template built on **Astro 7** with **Svelte 5** (Runes) and **Tailwind CSS v4**. It was refactored from [Firefly](https://github.com/CuteLeaf/Firefly) (which itself forked [Fuwari](https://github.com/saicaca/fuwari)). Primary language is Chinese (Simplified) with i18n support.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev server at `localhost:4321` |
| `pnpm new-course <Title> [semester] [category]` | Scaffold a new course Markdown file in `src/content/courses/` |
| `pnpm build` | Production build (GitHub cards → LQIPs → Astro build → asset pruning → font subsetting → Pagefind indexing) |
| `pnpm preview` | Preview production build |
| `pnpm check` | `astro check` for type/error checking |
| `pnpm type-check` | `tsc --noEmit --isolatedDeclarations` (covers `src/` and `scripts/`) |
| `pnpm lint` | Biome lint + auto-fix |
| `pnpm format` | Biome format |
| `pnpm new-post <filename>` | Scaffold a general post or announcement |
| `pnpm lqips` | Regenerate LQIP data into `src/constants/lqips.json` |

Package manager is **pnpm** (enforced by `preinstall`). Node.js >= 22 required.

## Architecture

### Astro + Svelte 5 Hybrid

- `.astro` components for static layout, pages, and Markdown/MDX content rendering
- `.svelte` components (using Svelte 5 runes `$state`, `$derived`, `$effect`) for reactive client UI (e.g. `src/components/course/CourseDashboard.svelte`, `Search.svelte`)
- Swup.js handles SPA-like page transitions with multiple container targets

### Configuration-Driven

All features and university curriculum settings are configured via TypeScript files in `src/config/`, exported through `src/config/index.ts`. Key configs:

- `courseConfig.ts` — **Core**: semesters list (`id`, `name`, `color`), disciplines/categories, featured tags, repository links, default sort
- `siteConfig.ts` — core site identity (title, subtitle, description, themeColor hue 0-360, page toggles)
- `navBarConfig.ts` — navbar links, dropdowns, and search settings
- `sidebarConfig.ts` — sidebar layout and widget configuration

### Content Collections

Defined in `src/content.config.ts`:
- **`courses`** — course markdown files (`.md`/`.mdx`) located in `src/content/courses/`:
  - Frontmatter fields: `title`, `titleEn`, `code`, `semester`, `category`, `tags`, `description`, `credits`, `hours`, `instructors`, `prerequisites`, `difficulty`, `repoUrl`, `externalLinks`, `icon`, `order`, `draft`, `published`, `updated`, `comment`
  - Validated via Zod schema and loaded via glob loader
- `posts` — general articles/announcements
- `spec` — special pages (`about`, `guestbook`)
- `dynamic` — short updates/microblog entries

### Key Directories

- `src/components/course/` — `CourseDashboard.svelte` (Bento Grid, instant fuzzy search, semester/category filtering tabs, list/grid view switcher)
- `src/components/` — `layout/`, `controls/`, `common/`, `widget/`, `features/`
- `src/pages/courses/` — `index.astro` (dashboard page) and `[...slug].astro` (course syllabus and README reader with KaTeX, Mermaid, Expressive Code, Pagefind index attributes)
- `src/utils/course-utils.ts` — helper functions for course sorting, semester/category aggregation, related courses lookup
- `src/plugins/` — remark/rehype plugins for KaTeX, Mermaid, PlantUML, Admonitions, Expressive Code
- `scripts/new-course.js` — interactive/CLI course scaffolding utility with pinyin slug generation

## Code Style

- **Biome** enforces: tab indentation, double quotes, recommended lint rules
- Run `pnpm format` and `pnpm lint` on `./src` and `./scripts`
- Commit convention: **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`, etc.)
- Use forward slash for path imports and prefer `@/config`, `@components/*`, `@utils/*` aliases

## Deployment

- Vercel, Cloudflare Pages, Netlify, or GitHub Pages
- Output directory: `dist/`
