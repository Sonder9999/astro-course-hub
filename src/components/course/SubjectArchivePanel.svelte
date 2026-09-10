<script lang="ts">
import {
	archiveDisplayConfig,
	archiveFileTypeConfig,
	courseArchiveConfig,
} from "@/config/archiveConfig";
import { getSubjectMeta } from "@/config/subjectConfig";
import type { TreeNode } from "@/types/course";
import { url } from "@/utils/url-utils";

interface Props {
	subject: TreeNode;
	onBack: () => void;
	onSelectFile?: (file: FlatFileItem) => void;
}

let { subject, onBack, onSelectFile }: Props = $props();

export interface FlatFileItem {
	id: string;
	name: string;
	title: string;
	path: string;
	ext: string;
	size?: number;
	formattedSize: string;
	mtime?: string;
	formattedDate: string;
	subPath: string; // 相对顶层模块的子路径，如 "lab01"
	folderGroup: string; // 顶层目录名，如 "labs", "exercises", "root"
	tags: string[];
	isMarkdown: boolean;
}

export interface SubGroup {
	name: string;
	fullPath: string;
	count: number;
	files: FlatFileItem[];
}

export interface MainGroup {
	key: string;
	name: string;
	count: number;
	directFiles: FlatFileItem[];
	subGroups: SubGroup[];
}

// 格式化文件大小
function formatBytes(bytes?: number): string {
	if (!bytes || bytes === 0) return "";
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// 格式化简要日期（MM-DD）
function formatDate(isoString?: string): string {
	if (!isoString) return "";
	try {
		const d = new Date(isoString);
		const m = (d.getMonth() + 1).toString().padStart(2, "0");
		const day = d.getDate().toString().padStart(2, "0");
		return `${m}-${day}`;
	} catch {
		return "";
	}
}

// 递归收集原始扁平文件
function collectFiles(
	node: TreeNode,
	topFolder = "root",
	subFolder = "",
	list: FlatFileItem[] = [],
): FlatFileItem[] {
	if (!node.children) return list;

	for (const child of node.children) {
		if (child.isDirectory) {
			const nextTopFolder = topFolder === "root" ? child.name : topFolder;
			const nextSubFolder =
				topFolder === "root"
					? ""
					: subFolder
						? `${subFolder}/${child.name}`
						: child.name;
			collectFiles(child, nextTopFolder, nextSubFolder, list);
		} else {
			const ext =
				child.ext ||
				(child.name.includes(".") ? `.${child.name.split(".").pop()}` : "");
			const isMd =
				ext.toLowerCase() === ".md" || ext.toLowerCase() === ".markdown";
			const cleanName = child.name.replace(/\.[^/.]+$/, "");

			const tags: string[] = [];
			if (isMd) tags.push("#MD");
			else if (ext) tags.push(`#${ext.replace(".", "").toUpperCase()}`);
			if (child.size) tags.push(`#${formatBytes(child.size)}`);

			list.push({
				id: child.path,
				name: child.name,
				title: cleanName,
				path: child.path,
				ext,
				size: child.size,
				formattedSize: formatBytes(child.size),
				mtime: child.mtime,
				formattedDate: formatDate(child.mtime),
				subPath: subFolder,
				folderGroup: topFolder,
				tags,
				isMarkdown: isMd,
			});
		}
	}

	return list;
}

// ================= 状态管理 =================
let searchQuery = $state("");
let selectedCategory = $state<string>("__all__");
let collapsedGroups = $state<Record<string, boolean>>({});
let selectedFileToast = $state<string | null>(null);
let toastTimer: number | undefined;

// 文件类型多选状态：根据本地配置文件中的 defaultChecked 初始化
let activeFilterTypes = $state<Record<string, boolean>>(
	Object.fromEntries(
		archiveFileTypeConfig.map((item) => [item.id, !!item.defaultChecked]),
	),
);

function toggleFilterType(id: string) {
	activeFilterTypes[id] = !activeFilterTypes[id];
}

const meta = $derived(getSubjectMeta(subject.name));

function normalizeExt(ext: string): string {
	return ext.replace(/^\./, "").trim().toLowerCase();
}

// 判定文件是否符合当前勾选的文件类型规则
function matchesFilterType(ext: string): boolean {
	const cleanExt = normalizeExt(ext);

	for (const category of archiveFileTypeConfig) {
		if (category.isOther) continue;
		if (!category.exts) continue;
		const exts = Array.isArray(category.exts) ? category.exts : [category.exts];
		const normalizedList = exts.map(normalizeExt);
		if (normalizedList.includes(cleanExt)) {
			return !!activeFilterTypes[category.id];
		}
	}

	// 未匹配任何上述具体类型，归入 isOther 兜底分类
	const otherCat = archiveFileTypeConfig.find((c) => c.isOther);
	if (otherCat) {
		return !!activeFilterTypes[otherCat.id];
	}
	return false;
}

// 全部原始文件
const allRawFiles = $derived(collectFiles(subject));

// 经过类型过滤后的文件池
const typeFilteredFiles = $derived(
	allRawFiles.filter((f) => matchesFilterType(f.ext)),
);

// 顶层分类胶囊栏（准确采用原文件夹名，无任何硬编码转换和 emoji）
const categoryPills = $derived.by(() => {
	const counts = new Map<string, number>();
	for (const f of typeFilteredFiles) {
		counts.set(f.folderGroup, (counts.get(f.folderGroup) || 0) + 1);
	}

	const pills: Array<{ key: string; name: string; count: number }> = [
		{ key: "__all__", name: "全部资料", count: typeFilteredFiles.length },
	];

	for (const [key, count] of counts.entries()) {
		pills.push({
			key,
			name: key,
			count,
		});
	}

	return pills;
});

// 构造主目录组与智能复合子目录结构
const directoryGroups = $derived.by(() => {
	const query = searchQuery.trim().toLowerCase();

	// 1. 过滤当前分类胶囊与搜索词
	const filtered = typeFilteredFiles.filter((file) => {
		if (
			selectedCategory !== "__all__" &&
			file.folderGroup !== selectedCategory
		) {
			return false;
		}
		if (query) {
			const matchName = file.name.toLowerCase().includes(query);
			const matchTitle = file.title.toLowerCase().includes(query);
			const matchSub = file.subPath.toLowerCase().includes(query);
			const matchTags = file.tags.some((t) => t.toLowerCase().includes(query));
			if (!matchName && !matchTitle && !matchSub && !matchTags) {
				return false;
			}
		}
		return true;
	});

	// 2. 按顶层文件夹组织文件映射
	const topFolderMap = new Map<string, FlatFileItem[]>();
	for (const f of filtered) {
		if (!topFolderMap.has(f.folderGroup)) topFolderMap.set(f.folderGroup, []);
		topFolderMap.get(f.folderGroup)?.push(f);
	}

	// 3. 对每个顶层模块，根据 subfolderThreshold 智能区分复合子目录折叠或平铺
	const result: MainGroup[] = [];
	const threshold = Math.max(1, archiveDisplayConfig.subfolderThreshold ?? 3);

	for (const [topKey, files] of topFolderMap.entries()) {
		// 检查子路径
		const subPathMap = new Map<string, FlatFileItem[]>();
		const directList: FlatFileItem[] = [];

		for (const f of files) {
			if (!f.subPath) {
				directList.push(f);
			} else {
				// 取第一级子目录名
				const primarySub = f.subPath.split("/")[0];
				if (!subPathMap.has(primarySub)) subPathMap.set(primarySub, []);
				subPathMap.get(primarySub)?.push(f);
			}
		}

		const subGroups: SubGroup[] = [];

		for (const [subKey, subFiles] of subPathMap.entries()) {
			if (subFiles.length > threshold) {
				// 文件量多：作为独立子目录折叠
				subGroups.push({
					name: subKey,
					fullPath: `${topKey}/${subKey}`,
					count: subFiles.length,
					files: subFiles,
				});
			} else {
				// 文件量少：直接平铺在当前主目录列表中显示
				directList.push(...subFiles);
			}
		}

		// 按文件名排序
		directList.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
		subGroups.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));

		result.push({
			key: topKey,
			name: topKey,
			count: files.length,
			directFiles: directList,
			subGroups,
		});
	}

	// 排序：root 优先，其余按原文件夹字母排序
	result.sort((a, b) => {
		if (a.key === "root") return -1;
		if (b.key === "root") return 1;
		return a.name.localeCompare(b.name, "zh-CN");
	});

	return result;
});

const totalVisibleCount = $derived(
	directoryGroups.reduce((acc, g) => acc + g.count, 0),
);

function toggleGroup(key: string) {
	collapsedGroups[key] = !collapsedGroups[key];
}

function expandAll() {
	collapsedGroups = {};
}

function collapseAll() {
	const next: Record<string, boolean> = {};
	for (const g of directoryGroups) {
		next[g.key] = true;
		for (const sg of g.subGroups) {
			next[sg.fullPath] = true;
		}
	}
	collapsedGroups = next;
}

function handleFileClick(file: FlatFileItem) {
	if (onSelectFile) {
		onSelectFile(file);
	}
	if (toastTimer) clearTimeout(toastTimer);
	selectedFileToast = `${file.name} (已定位)`;
	toastTimer = window.setTimeout(() => {
		selectedFileToast = null;
	}, 2800);
}
</script>

<div class="subject-archive-root flex flex-col gap-4">
  <!-- ================= 顶部导航与操作控制栏 ================= -->
  <div class="card-base p-3 sm:p-5 rounded-2xl flex flex-col gap-3 border border-black/5 dark:border-white/5 relative z-20">
    <!-- 第一行：返回、学科标题、学期徽章，右侧为全展开/折叠 -->
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-3 flex-wrap">
        <button
          onclick={onBack}
          class="px-3.5 py-1.5 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-(--primary) hover:text-white text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 group/btn"
          title="返回"
          aria-label="返回"
        >
          <svg class="w-4 h-4 transition-transform group-hover/btn:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>返回</span>
        </button>

        <div class="h-4 w-px bg-black/10 dark:bg-white/10 hidden sm:block"></div>

        <div class="flex items-baseline gap-2 flex-wrap">
          <h1 class="text-xl sm:text-2xl font-bold text-90 leading-tight">
            {meta.name || subject.name}
          </h1>
          {#if meta.semester}
            <span class="text-xs px-2 py-0.5 rounded-md bg-(--primary)/10 text-(--primary) font-semibold border border-(--primary)/20">
              {meta.semester}
            </span>
          {/if}
          <span class="text-xs text-50">
            {subject.name}
          </span>
        </div>
      </div>

      <!-- 全部展开 / 折叠操作 -->
      <div class="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/10">
        <button
          onclick={expandAll}
          class="px-2.5 py-1 rounded-lg text-xs font-medium text-60 hover:text-(--primary) transition-colors cursor-pointer"
          title="展开所有目录"
        >
          全部展开
        </button>
        <div class="w-px h-3 bg-black/10 dark:bg-white/10"></div>
        <button
          onclick={collapseAll}
          class="px-2.5 py-1 rounded-lg text-xs font-medium text-60 hover:text-(--primary) transition-colors cursor-pointer"
          title="折叠所有目录"
        >
          全部折叠
        </button>
      </div>
    </div>

    <!-- 第二行：类型筛选胶囊与搜索框 (充裕宽度，完整展示无挤压) -->
    <div class="flex items-center justify-between gap-3 flex-wrap pt-2.5 border-t border-black/5 dark:border-white/5">
      <!-- 文件类型胶囊组 (Firefly MD3 Filled Tonal Chip 主题风格) -->
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xs text-50 font-medium select-none mr-0.5">类型:</span>
        {#each archiveFileTypeConfig as item}
          {@const isActive = !!activeFilterTypes[item.id]}
          <button
            type="button"
            class="category-pill text-xs px-3 py-1 cursor-pointer transition-all duration-150 select-none flex items-center gap-1.5"
            data-active={isActive ? "" : undefined}
            onclick={() => toggleFilterType(item.id)}
            aria-pressed={isActive}
          >
            <span class="w-1.5 h-1.5 rounded-full transition-colors {isActive ? 'bg-white' : 'bg-black/25 dark:bg-white/30'}"></span>
            <span>{item.label}</span>
          </button>
        {/each}
      </div>

      <!-- 搜索框：充足宽度，完整显示占位符与检索词 -->
      <div class="relative flex items-center w-full sm:w-64 md:w-72">
        <svg class="w-3.5 h-3.5 absolute left-3 text-40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8" stroke-width="2"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65" stroke-width="2" stroke-linecap="round"></line>
        </svg>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="搜索文档、题目、标签..."
          class="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:border-(--primary) transition-all text-75 placeholder:text-40"
        />
        {#if searchQuery}
          <button
            onclick={() => (searchQuery = "")}
            class="absolute right-2 text-40 hover:text-75 text-xs cursor-pointer"
            aria-label="清空搜索"
          >
            ✕
          </button>
        {/if}
      </div>
    </div>
  </div>

  <!-- ================= 分类胶囊栏 (Firefly CategoryBar 样式，无 Emoji，采用原文件夹名) ================= -->
  {#if categoryPills.length > 1}
    <div class="card-base p-3 rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden">
      <div class="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5 px-1">
        {#each categoryPills as pill}
          {@const isActive = selectedCategory === pill.key}
          <button
            class="category-pill text-sm px-3.5 py-1.5 shrink-0 transition-all duration-150 ease-out flex items-center justify-center cursor-pointer select-none"
            data-active={isActive ? "" : undefined}
            onclick={() => (selectedCategory = pill.key)}
          >
            <span>{pill.name}</span>
            <span class="pill-count">{pill.count}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- ================= 归档时间轴目录树 (Firefly ArchivePanel 规范) ================= -->
  <div class="card-base px-3 sm:px-6 md:px-8 py-4 sm:py-6 rounded-2xl border border-black/5 dark:border-white/5 flex flex-col relative min-h-[400px]">
    <!-- 统计指示条（去除了多余的提示文案） -->
    <div class="mb-4 pb-3 border-b border-black/5 dark:border-white/5 flex items-center justify-between text-xs text-50 flex-wrap gap-2">
      <div class="flex items-center gap-2">
        <span>当前展示</span>
        <span class="font-bold text-(--primary)">{totalVisibleCount}</span>
        <span>篇文档</span>
        {#if searchQuery}
          <span class="text-30">·</span>
          <span>匹配: "{searchQuery}"</span>
        {/if}
      </div>
    </div>

    <!-- 分组列表 -->
    {#if directoryGroups.length === 0}
      <!-- 空状态 -->
      <div class="py-16 flex flex-col items-center justify-center text-center gap-2">
        <div class="text-sm font-semibold text-60">未找到匹配的文档资源</div>
        <div class="text-xs text-40">
          请尝试在上方切换文件类型筛选，或清除搜索关键词
        </div>
      </div>
    {:else}
      {#each directoryGroups as group}
        {@const isCollapsed = !!collapsedGroups[group.key]}

        <div class="archive-year-block mb-3" data-group={group.key}>
          <!-- 顶层目录分组表头 (流式左对齐自适应，彻底避免小屏截断，保持原文件夹名) -->
          <button
            class="archive-year-toggle flex flex-row w-full items-center h-12 sm:h-14 cursor-pointer rounded-xl hover:bg-(--btn-plain-bg-hover) transition-colors group/yr px-1 sm:px-2 select-none gap-2"
            onclick={() => toggleGroup(group.key)}
            aria-expanded={!isCollapsed}
          >
            <!-- 节点圆环 (固定宽度，与下方虚线精准居中对齐) -->
            <div class="w-7 sm:w-8 shrink-0 flex items-center justify-center">
              <div
                class="h-3.5 w-3.5 rounded-full outline-(--primary) mx-auto -outline-offset-2 z-20 outline-3 transition-transform group-hover/yr:scale-125"
                style="background: {isCollapsed ? 'var(--primary)' : 'transparent'};"
              ></div>
            </div>

            <!-- 文件夹全名 (自由伸展，绝不截断) -->
            <div class="text-base sm:text-lg font-bold text-75 group-hover/yr:text-(--primary) transition-colors shrink-0">
              {group.name}
            </div>

            <!-- 文件数量徽章 -->
            <span class="text-xs px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 font-medium text-50 shrink-0">
              {group.count} 篇文档
            </span>

            {#if group.subGroups.length > 0}
              <span class="text-[11px] text-40 hidden md:inline shrink-0">
                (含 {group.subGroups.length} 个复合子目录)
              </span>
            {/if}

            <!-- 折叠箭头 (右对齐) -->
            <span
              class="archive-arrow transition-transform duration-200 ml-auto mr-1 shrink-0"
              style="transform: rotate({isCollapsed ? '-90deg' : '0deg'});"
            >
              <svg class="w-4 h-4 text-40 group-hover/yr:text-(--primary)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </span>
          </button>

          <!-- 目录内容区域 -->
          {#if !isCollapsed}
            <div class="archive-year-content flex flex-col pt-1 pb-2">
              <!-- 1. 直接平铺展示的文件 (平级文件 + 文件量<=阈值的子目录文件) -->
              {#each group.directFiles as file, fIdx}
                {@const isMd = file.isMarkdown}
                {@const targetUrl = isMd ? url(`/courses/${file.path.replace(/\.(md|markdown)$/i, "")}/`) : url(`${courseArchiveConfig.assetsPrefix}/${file.path}`)}
                <a
                  href={targetUrl}
                  target={isMd ? undefined : "_blank"}
                  rel={isMd ? undefined : "noopener noreferrer"}
                  class="archive-post group btn-plain block! h-10 w-full rounded-xl hover:text-[initial] cursor-pointer transition-colors px-1 sm:px-2 no-underline"
                  onclick={(e) => {
                    if (onSelectFile) onSelectFile(file);
                  }}
                  aria-label={file.name}
                >
                  <div class="flex flex-row items-center h-full w-full gap-2">
                    <!-- 虚线轴与光标点 (固定宽度，与表头同轴) -->
                    <div class="w-7 sm:w-8 shrink-0 relative dash-line h-full flex items-center justify-center">
                      <div
                        class="transition-all mx-auto w-1.5 h-1.5 rounded-xs group-hover:h-5 bg-[oklch(0.5_0.05_var(--hue))] group-hover:bg-(--primary) outline-4 z-20 outline-(--card-bg) group-hover:outline-(--btn-plain-bg-hover)"
                      ></div>
                    </div>

                    <!-- 序号 (独立固定宽度，彻底避免小屏与日期折行) -->
                    {#if archiveDisplayConfig.showOrder}
                      <span class="text-xs text-40 font-mono shrink-0 w-5 text-right select-none">
                        {String(fIdx + 1).padStart(2, "0")}
                      </span>
                    {/if}

                    <!-- 路径标签 (如有) -->
                    {#if archiveDisplayConfig.showPathBadge && file.subPath}
                      <span class="shrink-0 inline-block text-[11px] font-medium px-1.5 py-0.5 rounded-sm bg-[oklch(0.95_0.025_var(--hue))] dark:bg-[oklch(0.25_0.025_var(--hue))] text-(--primary) group-hover:bg-(--primary) group-hover:text-white! transition-colors">
                        {file.subPath}
                      </span>
                    {/if}

                    <!-- 文件名 (占据剩余最大空间，优雅截断) -->
                    <span class="truncate text-xs sm:text-sm font-medium text-black/85 dark:text-white/85 group-hover:text-(--primary) flex-1 min-w-0 group-hover:translate-x-1 transition-transform">
                      {file.name}
                    </span>

                    <!-- 拓展名、大小与日期 (右侧紧凑对齐，小屏隐藏次要信息) -->
                    <div class="shrink-0 flex items-center justify-end gap-1.5 text-xs text-30 pr-1 select-none">
                      {#if archiveDisplayConfig.showDate && file.formattedDate}
                        <span class="text-[11px] opacity-60 hidden md:inline">({file.formattedDate})</span>
                      {/if}
                      {#if archiveDisplayConfig.showExt}
                        <span class="px-1.5 py-0.5 rounded bg-black/4 dark:bg-white/4 text-[10px] sm:text-[11px] text-black/45 dark:text-white/45 hidden sm:inline">
                          {file.isMarkdown ? '#MD' : file.ext.toUpperCase()}
                        </span>
                      {/if}
                      {#if archiveDisplayConfig.showSize && file.formattedSize}
                        <span class="px-1.5 py-0.5 rounded bg-black/4 dark:bg-white/4 text-[10px] sm:text-[11px] text-black/45 dark:text-white/45">
                          {file.formattedSize}
                        </span>
                      {/if}
                    </div>
                  </div>
                </a>
              {/each}

              <!-- 2. 复合子目录独立组 (文件量 > 阈值，默认 fold 折叠) -->
              {#each group.subGroups as sub}
                {@const isSubCollapsed = collapsedGroups[sub.fullPath] !== false}

                <div class="sub-group-block mt-2 mb-2 pl-2 sm:pl-4 border-l-2 border-black/5 dark:border-white/5">
                  <!-- 子目录表头 -->
                  <button
                    class="flex flex-row w-full items-center h-9 sm:h-10 cursor-pointer rounded-lg hover:bg-(--btn-plain-bg-hover) transition-colors px-1 sm:px-2 select-none group/sub gap-2"
                    onclick={() => {
                      collapsedGroups[sub.fullPath] = !isSubCollapsed;
                    }}
                    aria-expanded={!isSubCollapsed}
                  >
                    <!-- 子目录节点 -->
                    <div class="w-6 sm:w-7 shrink-0 flex items-center justify-center">
                      <div
                        class="h-2.5 w-2.5 rounded-full outline-(--primary) mx-auto -outline-offset-1 z-20 outline-2 transition-transform group-hover/sub:scale-125"
                        style="background: {isSubCollapsed ? 'var(--primary)' : 'transparent'};"
                      ></div>
                    </div>

                    <!-- 子目录名 -->
                    <div class="text-xs sm:text-sm font-semibold truncate text-75 group-hover/sub:text-(--primary) shrink-0">
                      {sub.name}
                    </div>

                    <!-- 子目录文档数与展开指示 -->
                    <span class="px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-[11px] font-medium text-50 shrink-0">
                      {sub.count} 篇文档
                    </span>
                    <span class="text-[11px] opacity-70 hidden sm:inline text-50 shrink-0">
                      {isSubCollapsed ? "(已折叠)" : "(已展开)"}
                    </span>

                    <span
                      class="archive-arrow transition-transform duration-200 ml-auto mr-1 shrink-0"
                      style="transform: rotate({isSubCollapsed ? '-90deg' : '0deg'});"
                    >
                      <svg class="w-3.5 h-3.5 text-40 group-hover/sub:text-(--primary)" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </span>
                  </button>

                  <!-- 子目录内部文件列表 -->
                  {#if !isSubCollapsed}
                    <div class="sub-group-content flex flex-col pt-1 pb-1">
                      {#each sub.files as subFile, sfIdx}
                        {@const isSubMd = subFile.isMarkdown}
                        {@const targetSubUrl = isSubMd ? url(`/courses/${subFile.path.replace(/\.(md|markdown)$/i, "")}/`) : url(`${courseArchiveConfig.assetsPrefix}/${subFile.path}`)}
                        <a
                          href={targetSubUrl}
                          target={isSubMd ? undefined : "_blank"}
                          rel={isSubMd ? undefined : "noopener noreferrer"}
                          class="archive-post group btn-plain block! h-10 w-full rounded-xl hover:text-[initial] cursor-pointer transition-colors px-1 sm:px-2 no-underline"
                          onclick={(e) => {
                            if (onSelectFile) onSelectFile(subFile);
                          }}
                          aria-label={subFile.name}
                        >
                          <div class="flex flex-row items-center h-full w-full gap-2">
                            <!-- 虚线轴与光标点 -->
                            <div class="w-6 sm:w-7 shrink-0 relative dash-line h-full flex items-center justify-center">
                              <div
                                class="transition-all mx-auto w-1.5 h-1.5 rounded-xs group-hover:h-4 bg-[oklch(0.5_0.05_var(--hue))] group-hover:bg-(--primary) outline-3 z-20 outline-(--card-bg) group-hover:outline-(--btn-plain-bg-hover)"
                              ></div>
                            </div>

                            <!-- 序号 -->
                            {#if archiveDisplayConfig.showOrder}
                              <span class="text-xs text-40 font-mono shrink-0 w-5 text-right select-none">
                                {String(sfIdx + 1).padStart(2, "0")}
                              </span>
                            {/if}

                            <!-- 文件名 -->
                            <span class="truncate text-xs sm:text-sm font-medium text-black/85 dark:text-white/85 group-hover:text-(--primary) flex-1 min-w-0 group-hover:translate-x-1 transition-transform">
                              {subFile.name}
                            </span>

                            <!-- 拓展名与大小标签 -->
                            <div class="shrink-0 flex items-center justify-end gap-1.5 text-xs text-30 pr-1 select-none">
                              {#if archiveDisplayConfig.showDate && subFile.formattedDate}
                                <span class="text-[11px] opacity-60 hidden md:inline">({subFile.formattedDate})</span>
                              {/if}
                              {#if archiveDisplayConfig.showExt}
                                <span class="px-1.5 py-0.5 rounded bg-black/4 dark:bg-white/4 text-[10px] sm:text-[11px] text-black/45 dark:text-white/45 hidden sm:inline">
                                  {subFile.isMarkdown ? '#MD' : subFile.ext.toUpperCase()}
                                </span>
                              {/if}
                              {#if archiveDisplayConfig.showSize && subFile.formattedSize}
                                <span class="px-1.5 py-0.5 rounded bg-black/4 dark:bg-white/4 text-[10px] sm:text-[11px] text-black/45 dark:text-white/45">
                                  {subFile.formattedSize}
                                </span>
                              {/if}
                            </div>
                          </div>
                        </a>
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>

  <!-- Toast 提示 -->
  {#if selectedFileToast}
    <div class="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-black/80 dark:bg-white/90 text-white dark:text-black text-xs font-semibold shadow-xl backdrop-blur-md flex items-center gap-2">
      <span>{selectedFileToast}</span>
    </div>
  {/if}
</div>

<style>
  .subject-archive-root {
    width: 100%;
    user-select: none;
  }

  .scrollbar-none {
    scrollbar-width: none;
  }
  .scrollbar-none::-webkit-scrollbar {
    display: none;
  }

  .archive-arrow {
    display: inline-flex;
  }
</style>
