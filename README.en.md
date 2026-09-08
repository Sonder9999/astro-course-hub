<div align="center">

# 🎓 Astro Course Hub / 高校课程资源导航

> A modern, out-of-the-box university course resource navigation and syllabus reading station template.  
> Designed for colleges, academic departments, and student developer communities to preserve and pass on knowledge, study guides, and past exams ✨

![Node.js >= 22](https://img.shields.io/badge/node.js-%3E%3D22-brightgreen)
![pnpm >= 11](https://img.shields.io/badge/pnpm-%3E%3D11-blue)
![Astro](https://img.shields.io/badge/Astro-7.2.10-orange)
![Svelte](https://img.shields.io/badge/Svelte-5.57.0-red)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-blue)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

📖 README:
**[简体中文](README.md)** | **[English](README.en.md)**

🚀 Quick Links:
[**🖥️ Live Demo**](https://courses.example.edu.cn) /
[**📝 Contribution Guide**](CONTRIBUTING.md) /
[**💡 Course Markdown Example**](src/content/courses/cs101-c-programming.md) /
[**⚙️ Configuration Docs**](src/config/README.md)

⚡ **Ultra-Fast Static Site**: Powered by Astro 7 SSG, delivering blazing-fast page loads and native SEO optimization.  
🍱 **Bento Grid Dashboard**: Modern card grid supporting multi-dimensional real-time filtering by semester (Freshman through Senior / General Electives) and discipline category, alongside instant fuzzy search.  
📖 **Elegant Syllabus Reading**: Built-in rendering for KaTeX math formulas, Mermaid diagrams, syntax-highlighted code blocks, and Admonition callouts.  
🔍 **Offline Full-Text Search**: Client-side millisecond search powered by Pagefind with zero server runtime overhead.  
🔧 **Decoupled & Universal**: Completely free of hardcoded university specifics. Curriculums, semesters, and categories are 100% configuration-driven.  
📱 **Fully Responsive**: Flawlessly optimized across desktop, tablet, and mobile screens.

---

>[!TIP]
>
>**Astro Course Hub** is an open-source universal mother template for colleges, faculties, and student tech communities.
>
>Heavily refactored from the aesthetic Astro blog theme [Firefly](https://github.com/CuteLeaf/Firefly) and [fuwari](https://github.com/saicaca/fuwari), this project transforms the traditional personal blog post architecture into a **structured Course Collection Schema**. While preserving the smooth page transitions, beautiful visual layouts, and rich typography, it provides dedicated academic navigation, search, and syllabus browsing tools.
>
>Simply **Fork this repository**, configure your own university's semesters and academic programs, and deploy a branded course hub for your school in minutes!

---

## ✨ Features

### 📚 Curriculum System & Resource Hub
- [x] **Bento Grid Dashboard** - Clean, card-based interface with clear hierarchy and visual clarity.
- [x] **Multi-Dimensional Instant Filtering** - Filter seamlessly by semester (Year 1 to 4, Fall/Spring, General Electives) and subject categories.
- [x] **Client-Side Instant Fuzzy Search** - Real-time filtering across course titles, English names, course codes (e.g. `CS101`), instructors, descriptions, and tags.
- [x] **Featured Tags** - Pin popular tags like `Required`, `Core`, `Lab Included`, `Past Exams` for quick access.
- [x] **Direct Resource Links** - Each course card features one-click buttons to GitHub courseware repos, MOOCs, and Online Judges.

### 📝 Immersive Syllabus Reading
- [x] **Full Markdown & MDX Support** - Standard GFM compliance to beautifully render each course's `README.md`.
- [x] **KaTeX Math Formula Engine** - High-speed rendering for inline math `$E=mc^2$` and display equations `$$\sum_{i=1}^n x_i$$`.
- [x] **Mermaid Diagram Support** - Render flowcharts, state machines, and sequence diagrams directly in course descriptions.
- [x] **Enhanced Code Blocks** - Expressive Code integration with line highlighting, language badges, collapsible code, and copy-to-clipboard.
- [x] **Admonition Callouts** - Clean GitHub and Obsidian style `NOTE`, `TIP`, `WARNING`, and `CAUTION` blocks.
- [x] **Pagefind Offline Indexing** - Build-time indexing of all courses, metadata, and body content for millisecond search.

### 🎨 Highly Configurable & Universal
- [x] **Config-Driven Architecture** - Customize semesters, categories, and site branding in `src/config/` without modifying component source code.
- [x] **360° Theme Color Customization** - Stepless hue adjustment to match any university's official color palette.
- [x] **Light & Dark Modes** - Full support for light, dark, and system-adaptive themes.
- [x] **CLI Scaffolding** - Run `pnpm new-course` to generate standardized course Markdown files in seconds.

---

## 🚀 Quick Start (Fork & Deploy Guide)

### 1. Prerequisites
- **Node.js** ≥ 22.23.0
- **pnpm** ≥ 11.0.0 (`preinstall` enforces pnpm)

### 2. Fork and Clone
1. Click the **[Fork]** button on the GitHub repository page to copy this repository into your account or organization.
2. Clone your forked repository:
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Customize Configuration
Open and edit the two core configuration files (well-commented):

- **`src/config/siteConfig.ts`**:
  Update `title` (e.g., `Awesome University Course Hub`), `subtitle`, site description, and `themeColor.hue`.
- **`src/config/courseConfig.ts`**:
  Customize your school's semester structure in `semesters`, academic disciplines in `categories`, and default repository links in `repository`.

### 5. Local Development
```bash
pnpm dev
```
Open `http://localhost:4321` in your browser for hot-reloading development.

### 6. Add a Course
Use the built-in CLI command to scaffold a new course Markdown file:
```bash
pnpm new-course "Data Structures and Algorithms" "大二上" "专业核心课"
```
The file will be created in `src/content/courses/`. Fill in the course outline, review guides, and recommended resources.

---

## ☁️ Deployment

The project builds to a fully static site in `./dist/` and can be deployed for free on popular static hosting platforms:

| Platform | Build Command | Output Directory | Install Command |
| :--- | :--- | :--- | :--- |
| **Vercel** | `pnpm build` | `dist` | `pnpm install` |
| **Cloudflare Pages** | `pnpm build` | `dist` | `pnpm install` |
| **Netlify** | `pnpm build` | `dist` | `pnpm install` |
| **GitHub Pages** | GitHub Actions deploying to `gh-pages` | `dist` | `pnpm install` |

> [!NOTE]
> The `pnpm build` script automatically runs LQIP generation, Astro static compilation, font subsetting, and Pagefind search indexing.

---

## ⚙️ Course Frontmatter Specification (Schema)

Every course Markdown file under `src/content/courses/` adheres to the Zod Schema defined in `src/content.config.ts`:

```yaml
---
title: "Fundamentals of Programming (C/C++)" # Required: Chinese or display course name
titleEn: "Fundamentals of Programming"       # Optional: English name or abbreviation
code: "CS101"                                # Optional: Course code
semester: "大一上"                           # Required: Semester name matching courseConfig.ts
category: "学科基础课"                       # Required: Discipline category matching courseConfig.ts
tags: ["必修", "含实验", "历年试卷"]         # Optional: Tags for badges and filtering
description: "Introductory CS course..."     # Optional: 1-2 sentence overview
credits: 4.0                                 # Optional: Course credits
hours: 64                                    # Optional: Total hours
instructors: ["Teaching Team"]               # Optional: List of instructors
prerequisites: ["None"]                      # Optional: Prerequisites
difficulty: 3.5                              # Optional: Difficulty rating (1.0 - 5.0)
repoUrl: "https://github.com/..."            # Optional: Link to GitHub course materials
externalLinks:                               # Optional: External links (MOOC, OJ, Cloud Drive)
  - name: "MOOC Course"
    url: "https://www.icourse163.org/..."
    icon: "material-symbols:smart-display-outline"
icon: "material-symbols:code-blocks"         # Optional: Iconify icon name
order: 10                                    # Optional: Sorting priority (lower = earlier)
draft: false                                 # Optional: Draft flag (omitted in production)
---
```

Write course syllabus, lecture notes, lab guides, and review tips in the Markdown body.

---

## 📁 Configuration Structure

```
src/config/
├── index.ts                  # Central configuration export barrel
├── courseConfig.ts           # 🌟 Core: Semesters, categories, tags, and repo settings
├── siteConfig.ts             # 🌟 Core: Site title, subtitle, theme color, page toggles
├── navBarConfig.ts           # Navbar links, dropdowns, and search config
├── footerConfig.ts           # Footer text and custom HTML injection
├── expressiveCodeConfig.ts   # Code block syntax theme and folding
├── fontConfig.ts             # Font families and preloading
├── commentConfig.ts          # Comment systems (Twikoo, Waline, Giscus, etc.)
└── README.md                 # Detailed config documentation
```

---

## 🧞 Available Commands

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Start local dev server at `http://localhost:4321` |
| `pnpm new-course <Title> [semester] [category]` | Scaffold a new course Markdown file |
| `pnpm build` | Full production build into `./dist/` (including Pagefind index) |
| `pnpm preview` | Locally preview the built production site |
| `pnpm check` | Run Astro syntax diagnostics |
| `pnpm type-check` | Run TypeScript strict type verification (`tsc --noEmit`) |
| `pnpm format` | Format codebase using Biome |
| `pnpm lint` | Lint codebase with auto-fix using Biome |

---

## ⚖️ Academic Integrity & Disclaimer

To ensure healthy and compliant open-source collaboration:

1. **Educational & Sharing Purpose**: All materials, notes, and past exam reviews are strictly intended for open-source study and academic reference.
2. **Academic Integrity**: Using this platform for exam cheating, ghostwriting, or homework plagiarism is strictly prohibited.
3. **No Confidential Materials**: Never upload confidential university documents, classified research materials, or non-public exam papers.
4. **Copyright Compliance**: Notes and writeups should be original. Credit original professors and textbooks when quoting slides or diagrams.

---

## 🙏 Acknowledgments

This project is built upon the exceptional work of open-source projects:

- **[Firefly](https://github.com/CuteLeaf/Firefly)** by [CuteLeaf](https://github.com/CuteLeaf) - The upstream theme that provided the foundational design system and component architecture.
- **[fuwari](https://github.com/saicaca/fuwari)** by [saicaca](https://github.com/saicaca) - The original prototype and inspiration for Firefly.
- **[Astro](https://astro.build/)**, **[Svelte 5](https://svelte.dev/)**, and **[Tailwind CSS v4](https://tailwindcss.com/)**.
- **[Pagefind](https://pagefind.app/)** - High-speed offline static search.

---

## 📝 License

This project is open-sourced under the [MIT License](LICENSE). Feel free to fork, adapt, and deploy it for your school!
