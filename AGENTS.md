# Repository Guidelines

## Project Structure & Module Organization

Astro Course Hub is an Astro 7 site with Svelte 5 islands and TypeScript configuration, refactored from Firefly into a universal university course resource hub template.

Main source code lives in `src/`:
- Routes in `src/pages` (e.g. `src/pages/courses/index.astro`, `src/pages/courses/[...slug].astro`)
- Layouts in `src/layouts` (`MainGridLayout.astro`, `Layout.astro`)
- Reusable UI in `src/components` (with `src/components/course/` for Bento Grid and course dashboards)
- Styles in `src/styles` (Tailwind CSS v4)
- Structured content in `src/content`: courses in `src/content/courses/` (`CourseData` schema), special pages in `src/content/spec/`
- Helper utilities in `src/utils` (`course-utils.ts`, `content-utils.ts`, `url-utils.ts`)
- Markdown/HTML plugins in `src/plugins` (KaTeX, Mermaid, Expressive Code, Admonitions)
- Site & course configuration in `src/config` (prefer imports from `@/config`) with type definitions in `src/types` (`course.ts`, `config.ts`)
- Static files served directly belong in `public`, source-managed images in `src/assets`, automation in `scripts`.

## Build, Test, and Development Commands

Use `pnpm`; the `preinstall` script enforces it.

- `pnpm dev` or `pnpm start`: run the local Astro dev server at `http://localhost:4321`.
- `pnpm check`: run Astro diagnostics.
- `pnpm type-check`: run TypeScript with `--noEmit --isolatedDeclarations`.
- `pnpm format`: format code with Biome.
- `pnpm lint`: run Biome checks and safe fixes.
- `pnpm build`: generate LQIPs, run Astro build, subset fonts, and generate Pagefind search index in `dist`.
- `pnpm preview`: preview the production build locally.
- `pnpm new-course <Title> [semester] [category]`: scaffold a new course Markdown file with standard frontmatter in `src/content/courses/`.
- `pnpm new-post <filename>`: scaffold a general post or announcement.

## Coding Style & Naming Conventions

Biome is the formatter and linter. It uses tabs for indentation and double quotes for JavaScript/TypeScript strings. Keep Astro and Svelte components in `PascalCase` (`CourseDashboard.svelte`, `Navbar.astro`), config modules in `camelCase` ending with `Config.ts` (`courseConfig.ts`, `siteConfig.ts`), and utilities in descriptive kebab case such as `course-utils.ts`. Keep `src/types` aligned with `src/config`. Avoid unrelated formatting churn.

## Testing Guidelines

There is no dedicated unit-test framework configured. Before submitting changes, run `pnpm check`, `pnpm type-check`, and `pnpm build` for rendering, content, or generated asset work. For visual or interactive changes, verify with `pnpm dev` or `pnpm preview` and include screenshots in the PR.

## Commit & Pull Request Guidelines

Use Conventional Commits, matching the history: `feat: ...`, `fix: ...`, `docs: ...`, and `chore: ...`. Keep commits and PRs focused on one concern. PRs should include a concise summary, validation commands run, and screenshots for UI changes.

## Security & Configuration Tips

Do not commit secrets, tokens, or service keys in config files. Ensure academic integrity and compliance: do not commit confidential, copyrighted, or exam-leak materials in `src/content/courses/`.
