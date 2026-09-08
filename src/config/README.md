# ⚙️ 配置文件说明

本目录包含高校课程资源导航站模板的所有配置文件。系统采用模块化设计，每个文件负责特定的功能模块，并通过 `src/config/index.ts` 进行统一导出。

---

## 📁 配置文件结构

```
src/config/
├── index.ts                  # 配置索引文件 - 统一导出
├── courseConfig.ts           # 🌟 核心：课程与学期配置（学期列表、学科大类、总仓链接）
├── siteConfig.ts             # 🌟 核心：站点基础配置（学校/站点名、描述、主题色、页面开关）
├── navBarConfig.ts           # 导航栏配置（含 LinkPresets 链接预设与菜单层级）
├── footerConfig.ts           # 页脚配置（版权声明、备案号、自定义 HTML 注入）
├── expressiveCodeConfig.ts   # 代码高亮配置（亮暗色主题、语言徽标、折叠代码块）
├── fontConfig.ts             # 字体配置（内置字体、自定义字体、预加载）
├── commentConfig.ts          # 评论系统配置（Twikoo、Waline、Artalk、Giscus 等）
├── backgroundWallpaper.ts    # 背景与横幅配置
├── announcementConfig.ts     # 顶部通知与公告配置
├── displaySettingsConfig.ts  # 视图设置面板开关配置
├── dynamicConfig.ts          # 动态速记配置
├── friendsConfig.ts          # 兄弟院校 / 友情链接配置
├── licenseConfig.ts          # 开源许可证配置
├── mermaidConfig.ts          # Mermaid 图表配置
├── plantumlConfig.ts         # PlantUML 图表配置
├── profileConfig.ts          # 站点维护团队资料配置
├── sidebarConfig.ts          # 侧边栏布局配置
└── README.md                 # 本说明文件
```

---

## 🚀 使用方式

### 推荐：使用统一导出
```typescript
import { courseConfig, siteConfig } from "@/config";
```

### 直接导入单个配置
```typescript
import { courseConfig } from "@/config/courseConfig";
import { siteConfig } from "@/config/siteConfig";
```

---

## 🌟 核心配置文件详解

### 1. `courseConfig.ts`（高校学期与课程分类配置）

此文件是高校模板最为核心的配置。当其他高校或院系 Fork 本仓库后，无需改动任何代码，仅需修改此配置文件即可完成全站培养方案的定制：

| 属性 | 类型 | 说明 |
| :--- | :--- | :--- |
| `semesters` | `CourseSemesterConfig[]` | 学期选项列表。包含 `id`、学期名称 `name`（如“大一上”、“大二下”、“通识选修”）及专属 Badge 颜色 Tailwind 类名。用于首页多维 Tab 过滤与卡片标识。 |
| `categories` | `CourseCategoryConfig[]` | 学科/专业方向分类列表。如“全部方向”、“学科基础课”、“专业核心课”、“专业选修课”、“实践与实验”等。用于方向过滤面板。 |
| `featuredTags` | `string[]` | 快捷推荐标签池。如 `["必修", "专业核心", "含实验", "历年试卷"]`，呈现在检索台顶部供快速点击过滤。 |
| `defaultSort` | `"semester" \| "code" \| "title" \| "credits"` | 默认课程排序维度。 |
| `showDifficulty` | `boolean` | 是否在卡片和大纲页展示课程综合难度星级（1-5 星）。 |
| `showQuickLinks` | `boolean` | 是否在课程卡片底部快捷展示关联仓库及外链图标。 |
| `repository` | `object` | 包含默认公共资料总仓库 `defaultRepoUrl` 和贡献指引路由 `contributionUrl`。 |

**配置范例：**
```typescript
export const courseConfig: CourseSiteConfig = {
  semesters: [
    { id: "all", name: "全部学期", color: "..." },
    { id: "y1s1", name: "大一上", color: "bg-emerald-500/15 text-emerald-700 ..." },
    { id: "y1s2", name: "大一下", color: "bg-teal-500/15 text-teal-700 ..." },
    // 灵活增减本校学期体系...
  ],
  categories: [
    { name: "全部方向" },
    { name: "学科基础课", description: "数学、物理与跨专业大类基础" },
    { name: "专业核心课", description: "本专业骨干必修主干课程" },
    { name: "专业选修课", description: "细分领域进阶选修方向" },
    // 自定义学院分类...
  ],
  featuredTags: ["必修", "专业核心", "含实验", "历年试卷"],
  defaultSort: "semester",
  showDifficulty: true,
  showQuickLinks: true,
  repository: {
    defaultRepoUrl: "https://github.com/example-univ/course-resources",
    contributionUrl: "/about/",
  },
};
```

---

### 2. `siteConfig.ts`（站点全局信息配置）

负责全站的元信息和布局开关：

- `title`: 站点主标题（如 `XX大学计算机课程资源导航`）
- `subtitle`: 站点副标题（如 `开源课程资料、学习指南与试卷复习导航站`）
- `site_url`: 部署域名，用于自动生成规范的 OpenGraph 与 Canonical 链接
- `description`: 站点一句话描述，利于 SEO 抓取
- `themeColor.hue`: 主题色相（0 ~ 360 整数无级调节，如 `165` 青绿，`250` 湖蓝，轻松契合校徽主题色）
- `pages`: 控制特定子页面的访问权限与导航菜单可见性：
  - `booknav`: 资源与书签导航（推荐开启）
  - `friends`: 兄弟高校/友链（推荐开启）
  - `guestbook`: 答疑与留言板（推荐开启）
  - `dynamic` / `gallery`: 个人动态与相册（作为高校站时通常建议设为 `false`）

---

### 3. `navBarConfig.ts`（顶部导航栏配置）

定义顶部导航栏显示的菜单项及子菜单。利用 `LinkPresets` 可以灵活组合和自定义：
- 首页入口（指向 `/`）
- 课程大纲中心（指向 `/courses/`）
- 社交与互动（友链、留言板）
- 资源导航（指向 `/booknav/`）
- 关于与贡献（关于本站、GitHub 仓库外链）

---

## 📋 完整配置文件一览表

| 配置文件 | 说明 |
| :--- | :--- |
| `courseConfig.ts` | **课程与学期配置**（学期、分类、标签池、资料总仓库） |
| `siteConfig.ts` | **站点基础配置**（标题、副标题、主题色相、页面开关、页面宽度） |
| `navBarConfig.ts` | **导航栏配置**（导航菜单项、下拉菜单、搜索策略） |
| `footerConfig.ts` | **页脚配置**（版权文字、备案信息、自定义 HTML 注入） |
| `expressiveCodeConfig.ts` | **代码高亮配置**（亮色/暗色主题、语言徽标、折叠区域） |
| `fontConfig.ts` | **字体配置**（字体家族、回退方案、自动预加载） |
| `commentConfig.ts` | **评论系统配置**（Twikoo、Waline、Artalk、Giscus 等第三方评论集成） |
| `backgroundWallpaper.ts` | **背景壁纸配置**（横幅、纯色、全屏壁纸及遮罩模式） |
| `announcementConfig.ts` | **公告栏配置**（置顶通知、类型徽章、跳转链接） |
| `displaySettingsConfig.ts` | **设置面板配置**（前台主题与视图切换面板总开关） |
| `friendsConfig.ts` | **友链配置**（兄弟院校项目合作与交流链接） |
| `licenseConfig.ts` | **许可证配置**（CC 知识共享协议等） |
| `mermaidConfig.ts` | **Mermaid 图表渲染配置** |
| `plantumlConfig.ts` | **PlantUML 图表渲染配置** |
| `profileConfig.ts` | **管理团队资料配置**（团队头像、称呼、组织社交主页） |
| `sidebarConfig.ts` | **侧边栏布局配置**（左右侧边栏组件挂载与排序） |

---

## 📝 开发与修改提示

1. **类型安全**：每个配置文件在 `src/types/` 下均有对应且严谨的 TypeScript 类型定义，修改属性若有误，执行 `pnpm check` 即可立即发现。
2. **统一导出**：业务页面与组件中，建议统一通过 `@/config` 进行解构导入，避免深层相对路径。
3. **零侵入升级**：升级上游模板代码时，仅需保留自己的 `src/config/` 和 `src/content/courses/`，即可平滑同步后续模板功能升级。
