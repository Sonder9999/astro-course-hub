# 📦 Components 组件目录

高校课程资源导航站模板中所有可复用与页面专用组件的集中管理目录。组件按照功能领域进行模块化拆分，提供清晰的架构和易维护的代码组织。

---

## 📁 目录结构

### 📚 course/ - 课程与仪表盘核心组件
负责课程大纲、Bento Grid 仪表盘、多维检索与卡片展示的核心业务组件。

- `CourseDashboard.svelte` - 🌟 **课程控制台与检索仪表盘组件**：
  - 基于 **Svelte 5 Runes** (`$state`, `$derived`, `$effect`) 开发的高性能客户端控制台。
  - **即时模糊搜索**：对课程名、英文名、课程代码、主讲教师、简介及标签实现极速匹配。
  - **学期与分类联动**：支持开课学期（大一至大四各学期/通识）与学科大类单选与复合过滤。
  - **双视图切换**：无缝切换 **Bento Grid（便当盒卡片网格）** 与 **紧凑列表（Compact List）** 视图。
  - **排序策略**：支持推荐权重排序与首字母 A-Z 字典序排序。
  - **外链与仓库直通**：直接在卡片上悬浮呼出 GitHub 课程仓库、MOOC 及在线评测链接。

### 🏗️ layout/ - 页面框架与布局组件
负责整体页面框架、通用网格和外层结构的组件。

- `Navbar.astro` - 顶部导航栏（支持响应式折叠菜单与多级下拉）
- `NavMenuPanel.astro` - 移动端导航抽屉菜单面板
- `Footer.astro` - 站点页脚组件（版权、备案与建站信息）
- `SideBar.astro` - 侧边栏容器（响应式展示各类信息小部件）
- `PostCard.astro` - 通用文章/公告卡片组件
- `PostMeta.astro` - 文章/公告元数据栏
- `CategoryBar.astro` - 顶部横向分类快捷导航条
- `DropdownMenu.astro` - 现代化下拉悬浮菜单组件

### 🎮 controls/ - 交互与导航控件
页面导航控制、全局设置与检索控件。

- `Search.svelte` - 基于 Pagefind 的全文离线检索弹窗
- `LightDarkSwitch.svelte` - 亮色/暗色/跟随系统模式切换按钮
- `DisplaySettings.svelte` / `DisplaySettingsIntegrated.svelte` - 全局外观与布局设置面板
- `FloatingControls.astro` - 页面右下角悬浮控制按钮组（包含返回顶部、主题切换等）
- `FloatingTOC.astro` - 移动端或窄屏浮动目录
- `BackToTop.astro` - 平滑返回顶部按钮
- `ArchivePanel.astro` - 课程与文章归档面板

### 🔧 common/ - 公共通用 UI 组件
跨页面高频复用的基础 UI 单元。

- `Icon.svelte` - 跨平台矢量图标组件（集成 Iconify，支持动态按需渲染与 Fallback）
- `Markdown.astro` - Markdown/MDX 富文本正文排版包装器
- `CoverImage.astro` - 封面图与 LQIP 渐进式加载组件
- `ImageWrapper.astro` - 图片外层自适应包裹容器
- `ButtonLink.astro` - 统一风格的操作按钮与链接
- `ButtonTag.astro` - 标签徽章按钮（支持主题色与悬浮态）
- `Pagination.astro` - 服务端静态路由分页条
- `WidgetLayout.astro` - 小部件外层统一卡片容器

### 🧩 widget/ - 侧边栏小部件
挂载在侧边栏的独立信息微件。

- `Profile.astro` - 站点组织/运维团队信息微件
- `Announcement.astro` - 站内公告与重要教务提醒微件
- `SidebarTOC.astro` - 课程大纲长文目录导航（自动高亮当前阅读位置）
- `Categories.astro` - 学科分类统计微件
- `Tags.astro` - 热门标签标签云微件
- `SiteInfo.astro` - 站点建站时间、运行状态与收录统计

### ✨ features/ - 全局功能与渲染管理
全局初始化的功能增强与静态插件支持。

- `KatexManager.astro` - KaTeX 数学公式渲染引擎与样式注入
- `FancyboxManager.astro` - 课程大纲中图片点击大图预览与灯箱查看器
- `FontSetup.astro` - 静态字体优化与预加载加载器

---

## 🗂️ 组件分类与职责原则

| 目录 | 职责范畴 | 技术选型 | 说明 |
| :--- | :--- | :--- | :--- |
| **`course/`** | 课程核心业务与卡片交互 | Svelte 5 / Astro | 课程站独有，包含仪表盘与卡片网格 |
| **`layout/`** | 全局框架骨架 | Astro | 服务端渲染，决定页面网格栅格 |
| **`controls/`** | 全局交互与功能控件 | Svelte 5 / Astro | 包含搜索、主题切换与设置面板 |
| **`common/`** | 通用无状态 UI 原件 | Astro / Svelte | 高内聚、低耦合，跨页面任意调用 |
| **`widget/`** | 侧边栏插槽微件 | Astro | 挂载于 `SideBar.astro`，受 `sidebarConfig.ts` 调度 |
| **`features/`** | 样式与脚本特性管理器 | Astro | 负责公式、图片查看器、字体的注入 |
