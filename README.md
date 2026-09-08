<div align="center">

# 🎓 高校课程资源导航 / Astro Course Hub

> 一款现代化、开箱即用的高校课程资源导航与大纲阅读站模板  
> 专为各高校、学院及学生开源社区打造，让课程经验、复习资料与知识传承生生不息 ✨

![Node.js >= 22](https://img.shields.io/badge/node.js-%3E%3D22-brightgreen)
![pnpm >= 11](https://img.shields.io/badge/pnpm-%3E%3D11-blue)
![Astro](https://img.shields.io/badge/Astro-7.2.10-orange)
![Svelte](https://img.shields.io/badge/Svelte-5.57.0-red)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0.3-blue)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

📖 README：
**[简体中文](README.md)** | **[English](README.en.md)**

🚀 快速链接：
[**🖥️ 在线预览**](https://courses.example.edu.cn) /
[**📝 贡献指南**](CONTRIBUTING.md) /
[**💡 课程大纲示例**](src/content/courses/cs101-c-programming.md) /
[**⚙️ 配置文档**](src/config/README.md)

⚡ **极速静态站点**：基于 Astro 7 静态站点生成，超快首屏加载与开箱即用的 SEO 优化  
🍱 **Bento 仪表盘**：现代卡片网格，支持按学期（大一至大四/通选）、学科方向多维实时过滤与模糊搜索  
📖 **优雅大纲阅读**：内置 KaTeX 数学公式、Mermaid 图表、语法高亮代码块与 Admonitions 提醒框  
🔍 **离线全文检索**：集成 Pagefind 客户端毫秒级全文索引，零服务端依赖，支持中文拼音与关键词匹配  
🔧 **完全解耦与通用**：无任何特定高校硬编码，培养方案与学期体系完全配置驱动，任何高校均可一键 Fork  
📱 **全端响应式设计**：完美适配桌面端、平板与手机，针对移动端交互深度优化

---

>[!TIP]
>
>**Astro Course Hub** 是一款专为高校、学院以及大学生开源技术社区量身打造的**通用课程资源导航与知识阅读站母版**。
>
>本项目基于优雅的 Astro 博客主题 [Firefly（流萤）](https://github.com/CuteLeaf/Firefly) 与 [fuwari](https://github.com/saicaca/fuwari) 深度二次重构开发。我们将原有的个人博客博文体系全面重塑为**结构化课程模型（Course Schema）**，在保留原主题卓越的美学设计、流动动效与富文本排版能力的同时，赋予了其面向大学各学期培养计划的专业化检索、筛选与资料导航能力。
>
>你可以直接 **Fork 本仓库**，根据自己学校/学院的实际教学计划修改配置与录入课程，轻松为自己的母校搭建专属的课程攻略站！

---

## ✨ 核心特性

### 📚 课程体系与资源导航
- [x] **Bento Grid 课程仪表盘** - 现代化便当盒卡片布局，信息层级分明，视觉通透
- [x] **多维即时筛选** - 支持按开课学期（大一上/下、大二上/下、大三、大四、通识选修）与学科类别单选/联动过滤
- [x] **即时模糊搜索** - 支持对课程名称、英文缩写、课程代码（如 CS101）、授课教师、课程描述及标签进行客户端极速过滤
- [x] **快捷标签推荐** - 置顶展示“必修”、“专业核心”、“含实验”、“历年试卷”等高频关注标签
- [x] **外链与仓库直达** - 每门课程支持独立绑定对应的 GitHub 资料仓库、中国大学 MOOC、在线评测系统 (OJ) 等链接

### 📝 沉浸式课程内容阅读
- [x] **全功能 Markdown / MDX 渲染** - 原生支持 GFM 规范，课程 README.md 优雅呈现
- [x] **KaTeX 数学公式支持** - 行内公式 `$E=mc^2$` 与独立块级公式 `$$\sum_{i=1}^n x_i$$` 极速渲染
- [x] **Mermaid 图表引擎** - 在课程大纲中直接编写流程图、状态机、时序图与架构拓扑
- [x] **增强代码块体验** - 基于 Expressive Code，支持代码行高亮、语言徽标、折叠区域与一键复制
- [x] **Admonitions 提示块** - 支持 GitHub、Obsidian 风格的 `NOTE` / `TIP` / `WARNING` / `CAUTION` 提示容器
- [x] **Pagefind 离线检索** - 自动在构建期为全站课程标题、元数据及大纲正文生成索引

### 🎨 高度通用与可定制
- [x] **配置驱动 (Config-Driven)** - 学期配置、方向分类、网站标识完全收敛在 `src/config/`，零侵入源码
- [x] **360° 主题色调节** - 支持全色相无级调节，轻松适配不同高校的标准校徽主题色（如清华紫、北大红、河大蓝等）
- [x] **亮暗色模式** - 完美支持浅色模式、深色模式与跟随系统自动切换
- [x] **CLI 脚手架工具** - 提供 `pnpm new-course` 命令，几秒内快速生成带标准 Frontmatter 的课程 Markdown

---

## 🚀 快速开始（Fork 复用指南）

为你的大学搭建课程资源站仅需以下几个步骤：

### 1. 环境准备
- **Node.js** ≥ 22.23.0
- **pnpm** ≥ 11.0.0（本项目通过 `only-allow pnpm` 强制规范包管理器）

### 2. Fork 与克隆
1. 点击 GitHub 页面右上角的 **[Fork]** 按钮，将本仓库 Fork 到你个人的账户或学生团队 Organization。
2. 克隆你的专属仓库到本地：
   ```bash
   git clone https://github.com/<your-username>/<your-repo-name>.git
   cd <your-repo-name>
   ```

### 3. 安装依赖
```bash
pnpm install
```

### 4. 个性化站点与课程体系配置
修改以下两个核心配置文件（均有详尽中文注释）：

- **`src/config/siteConfig.ts`**：
  修改站点标题 `title`（如 `XX大学计算机课程资源导航`）、副标题 `subtitle`、网站描述以及主题色相 `themeColor.hue`。
- **`src/config/courseConfig.ts`**：
  根据本校专业培养方案，自定义开课学期列表 `semesters`（如大一至大四各学期）、专业方向分类 `categories` 以及资料总仓库链接 `repository`。

### 5. 本地开发与预览
```bash
pnpm dev
```
打开浏览器访问 `http://localhost:4321` 即可体验实时热更新开发。

### 6. 添加一门新课程
使用内置的 CLI 脚手架命令快速生成规范的课程 Markdown：
```bash
pnpm new-course "数据结构与算法" "大二上" "专业核心课"
```
文件将自动创建在 `src/content/courses/` 下，完善其中的教学大纲、实验攻略和复习要点即可。

---

## ☁️ 平台托管与持续部署

本项目为纯静态站点输出（输出至 `./dist/`），支持免费一键部署至各类主流静态托管平台：

| 平台 | 构建命令 (Build Command) | 输出目录 (Output Directory) | 安装命令 (Install Command) |
| :--- | :--- | :--- | :--- |
| **Vercel** | `pnpm build` | `dist` | `pnpm install` |
| **Cloudflare Pages** | `pnpm build` | `dist` | `pnpm install` |
| **Netlify** | `pnpm build` | `dist` | `pnpm install` |
| **GitHub Pages** | 使用 GitHub Actions 构建输出至 `gh-pages` 分支 | `dist` | `pnpm install` |

> [!NOTE]
> 项目构建脚本 `pnpm build` 会全自动完成：GitHub 卡片数据生成 → LQIP 低清缩略图生成 → Astro 静态编译 → 静态字体子集化优化 → Pagefind 全文检索索引建立。

---

## ⚙️ 课程 Frontmatter 规范 (Course Schema)

每门课程以独立的 Markdown 文件存放于 `src/content/courses/` 目录。头部 Frontmatter 严格受 `src/content.config.ts` 中的 Zod Schema 校验：

```yaml
---
title: "程序设计基础 (C/C++)"         # 必填：课程标准中文名称
titleEn: "Fundamentals of Programming" # 可选：课程英文名称或简称
code: "CS101"                          # 可选：课程代码 / 选课代码
semester: "大一上"                     # 必填：开课学期（需对应 courseConfig.ts 中的 semesters）
category: "学科基础课"                 # 必填：学科方向大类（需对应 courseConfig.ts 中的 categories）
tags: ["必修", "含实验", "历年试卷"]   # 选填：标签列表，用于卡片高亮与标签过滤
description: "计算机核心启蒙课..."      # 选填：课程一句话速览/选课建议
credits: 4.0                           # 选填：课程学分
hours: 64                              # 选填：总学时
instructors: ["计算机系教学团队"]       # 选填：主讲教师团队
prerequisites: ["无先修要求"]          # 选填：先修课程建议
difficulty: 3.5                        # 选填：课程综合难度星级（1.0 ~ 5.0）
repoUrl: "https://github.com/..."      # 选填：该课程对应的具体资料仓库路径
externalLinks:                         # 选填：外部关联资源（MOOC/评测系统/网盘）
  - name: "中国大学MOOC配套"
    url: "https://www.icourse163.org/..."
    icon: "material-symbols:smart-display-outline"
icon: "material-symbols:code-blocks"   # 选填：课程专属图标（来自 Iconify）
order: 10                              # 选填：排序权重（数值越小排序越靠前）
draft: false                           # 选填：是否草稿（草稿在生产构建时会被忽略）
---
```

正文部分直接书写课程大纲、授课教师风格总结、平时实验踩坑指南、期末复习题型与教材推荐。

---

## 📁 配置文件结构

```
src/config/
├── index.ts                  # 配置统一导出出口
├── siteConfig.ts             # 站点基础配置（名称、描述、主题色、页面开关）
├── courseConfig.ts           # 🌟 核心：学期划分、方向分类、推荐标签、总仓设置
├── navBarConfig.ts           # 顶部导航栏布局及路由链接预设
├── footerConfig.ts           # 页脚信息与版权定制
├── expressiveCodeConfig.ts   # 代码块语法高亮与折叠配置
├── fontConfig.ts             # 字体库与预加载设置
├── commentConfig.ts          # 评论系统（Twikoo/Waline/Giscus等）集成
└── README.md                 # 配置文件详细说明文档
```

---

## 🧞 常用命令

下列命令均在项目根目录下执行：

| 命令 | 说明 |
| :--- | :--- |
| `pnpm dev` | 启动本地开发热重载服务器（默认 `http://localhost:4321`） |
| `pnpm new-course <课程名> [学期] [类别]` | 快速生成新的课程 Markdown 模板文件 |
| `pnpm build` | 全量打包生产环境站点至 `./dist/`（包含 Pagefind 索引） |
| `pnpm preview` | 在本地预览已打包的生产站点 |
| `pnpm check` | 执行 Astro 模板诊断与语法校验 |
| `pnpm type-check` | 执行 TypeScript 严格类型检查 (`tsc --noEmit`) |
| `pnpm format` | 使用 Biome 格式化项目全部代码 |
| `pnpm lint` | 使用 Biome 进行静态代码检查与自动修复 |

---

## ⚖️ 学术诚信与合规免责声明

为保障开源项目的健康与长远运作，请各高校 Fork 建设者与贡献者务必知悉：

1. **交流互助目的**：本站收录的所有课程攻略、复习题解、实验指引均为开源学习与学术交流用途。
2. **严守学术道德底线**：严禁利用本平台进行任何形式的考试作弊、有偿代写或抄袭他人作业。
3. **禁止涉密与非公开材料**：严禁上传带有国家秘密、涉及保密科研课题或高校明令禁止流出的绝密期末试卷原卷。
4. **版权保护意识**：上传学习笔记请坚持原创，引用第三方教材、课件或论文时请规范注明出处。如涉及版权争议，请在第一时间提交 Issue 申请下架。

---

## 🙏 致谢与开源溯源

本项目在构建过程中深度吸收了以下开源项目的优秀设计与实现，特此致谢：

- **[Firefly](https://github.com/CuteLeaf/Firefly)** by [CuteLeaf](https://github.com/CuteLeaf) - 本项目直接衍生的优秀 Astro 博客模板，奠定了卓越的视觉表现与组件系统。
- **[fuwari](https://github.com/saicaca/fuwari)** by [saicaca](https://github.com/saicaca) - Firefly 的基础原型与灵感来源。
- **[Astro](https://astro.build/)** - “群岛架构”赋能的超快内容驱动 Web 框架。
- **[Svelte 5](https://svelte.dev/)** - 优雅高效的响应式 UI 状态驱动层。
- **[Tailwind CSS v4](https://tailwindcss.com/)** - 现代原子化 CSS 设计体系。
- **[Pagefind](https://pagefind.app/)** - 专为静态站点打造的卓越离线搜索引擎。

原主题包含的部分美术视觉切片版权归游戏《崩坏：星穹铁道》开发商米哈游所有。

---

## 📝 许可协议

本项目遵循 [MIT 许可证](LICENSE) 开源。

你可以自由地 Fork、修改、分发并在你的大学中部署本模板，但请保留相关开源版权声明与致谢链接。
