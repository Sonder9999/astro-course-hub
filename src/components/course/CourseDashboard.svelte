<script lang="ts">
import { onMount } from "svelte";
import Carousel3D from "@/components/Carousel3D.svelte";
import TreeNodeComponent from "@/components/TreeNode.svelte";
import { courseArchiveConfig } from "@/config/archiveConfig";
import { getSubjectMeta } from "@/config/subjectConfig";
import type {
	CourseCategoryConfig,
	CourseMajorConfig,
	CourseSemesterConfig,
	TreeNode,
} from "@/types/course";
import type { CourseListItem } from "@/utils/course-utils";
import SubjectArchivePanel from "./SubjectArchivePanel.svelte";

interface Diagnostics {
	totalFormulas: number;
	inlineMathCount: number;
	displayMathCount: number;
	hasErrors: boolean;
	errorCount: number;
	errors: Array<{ error: string; snippet: string }>;
}

interface Props {
	courses: CourseListItem[];
	semesters?: CourseSemesterConfig[];
	majors?: CourseMajorConfig[];
	categories?: CourseCategoryConfig[];
	featuredTags?: string[];
	initialTree?: TreeNode[];
}

let {
	courses = [],
	semesters = [],
	majors = [],
	categories = [],
	initialTree = [],
}: Props = $props();

// Svelte 5 响应式状态
let searchQuery = $state("");
let selectedMajor = $state("");
let includePublic = $state(true);
let sortBy = $state<"default" | "name">("default");
// 三种模式：'carousel' (3D 空间轮盘/手风琴) | 'bento' (平铺网格卡片) | 'list' (列表)
let viewMode = $state<"carousel" | "bento" | "list">("bento");
let accordionMode = $state<"continuous" | "independent">("continuous");
let sortDropdownOpen = $state(false);
let dropdownContainerRef: HTMLDivElement | null = $state(null);

// 课程知识库目录树与文档状态
let tree = $state<TreeNode[]>(initialTree);
let currentSubject = $state<TreeNode | null>(null);
let selectedPath = $state<string>("");
let rawContent = $state<string>("");
let renderedHtml = $state<string>("");
let diagnostics = $state<Diagnostics | null>(null);
let isLoadingContent = $state<boolean>(false);
let errorMessage = $state<string>("");
let activeTab = $state<"preview" | "diagnostics" | "raw">("preview");

const currentSubjectMeta = $derived(
	currentSubject ? getSubjectMeta(currentSubject.name) : null,
);

const sortOptions = [
	{ value: "default", label: "默认推荐排序" },
	{ value: "name", label: "按课程名称 A-Z" },
] as const;

// 监听全局点击关闭下拉菜单
$effect(() => {
	function handleClickOutside(event: MouseEvent) {
		if (
			sortDropdownOpen &&
			dropdownContainerRef &&
			!dropdownContainerRef.contains(event.target as Node)
		) {
			sortDropdownOpen = false;
		}
	}

	window.addEventListener("click", handleClickOutside);
	return () => {
		window.removeEventListener("click", handleClickOutside);
	};
});

// 从 URL 读取初始搜索关键字、专业筛选及学科
$effect(() => {
	if (typeof window !== "undefined") {
		const params = new URLSearchParams(window.location.search);
		const initialQuery = params.get("q") || params.get("tag");
		if (initialQuery && !searchQuery) {
			searchQuery = initialQuery;
		}
		const initialMajor = params.get("major");
		if (initialMajor && !selectedMajor) {
			selectedMajor = initialMajor;
		}
		const publicParam = params.get("public") ?? params.get("include_public");
		if (publicParam !== null) {
			includePublic = publicParam !== "0" && publicParam !== "false";
		}
		const viewParam = params.get("view");
		if (
			viewParam === "carousel" ||
			viewParam === "bento" ||
			viewParam === "list"
		) {
			viewMode = viewParam;
		}
		const subParam = params.get("subject");
		if (subParam && !currentSubject && tree.length > 0) {
			const found =
				tree.find((n) => n.name.toLowerCase() === subParam.toLowerCase()) ||
				tree.find((n) => n.path.toLowerCase().includes(subParam.toLowerCase()));
			if (found) {
				currentSubject = found;
			}
		}
	}
});

// 监听分类导航栏的专业变更自定义事件与 popstate 事件
$effect(() => {
	function handleMajorChange(e: Event) {
		const customEvent = e as CustomEvent<{ major: string }>;
		if (customEvent.detail && typeof customEvent.detail.major === "string") {
			selectedMajor = customEvent.detail.major;
		}
	}

	function handlePopState() {
		const params = new URLSearchParams(window.location.search);
		selectedMajor = params.get("major") || "";
		searchQuery = params.get("q") || params.get("tag") || "";
		const subParam = params.get("subject");
		if (subParam && tree.length > 0) {
			currentSubject =
				tree.find((n) => n.name.toLowerCase() === subParam.toLowerCase()) ||
				tree.find((n) =>
					n.path.toLowerCase().includes(subParam.toLowerCase()),
				) ||
				null;
		} else {
			currentSubject = null;
		}
	}

	window.addEventListener("course-major-change", handleMajorChange);
	window.addEventListener("popstate", handlePopState);
	return () => {
		window.removeEventListener("course-major-change", handleMajorChange);
		window.removeEventListener("popstate", handlePopState);
	};
});

// 选择/重置专业并同步 URL
function selectMajor(majorName: string) {
	selectedMajor = majorName;
	if (typeof window !== "undefined") {
		const url = new URL(window.location.href);
		if (majorName) {
			url.searchParams.set("major", majorName);
		} else {
			url.searchParams.delete("major");
		}
		window.history.pushState({}, "", url.href);
		window.dispatchEvent(
			new CustomEvent("course-major-change", {
				detail: { major: majorName },
			}),
		);
	}
}

// 获取全量目录树（如果尚未装载）
async function fetchTree() {
	if (tree && tree.length > 0) return;
	try {
		const res = await fetch(`${courseArchiveConfig.apiPrefix}/tree`);
		const data = await res.json();
		if (data.success && data.data) {
			tree = data.data;
		}
	} catch (err) {
		console.warn("加载课程目录树失败:", err);
	}
}

/**
 * 选中某个学科（从 3D 轮盘或 Bento/List 卡片点击）
 */
function handleSelectSubject(subject: TreeNode) {
	currentSubject = subject;
	if (typeof window !== "undefined") {
		const url = new URL(window.location.href);
		url.searchParams.set("subject", subject.name);
		window.history.pushState({}, "", url.href);
	}
}

function findFirstMd(node: TreeNode): TreeNode | null {
	if (!node.isDirectory && node.name.toLowerCase().endsWith(".md")) {
		return node;
	}
	if (node.children) {
		for (const child of node.children) {
			const found = findFirstMd(child);
			if (found) return found;
		}
	}
	return null;
}

/**
 * 点击具体文档并读取渲染
 */
async function handleSelectDoc(path: string) {
	selectedPath = path;
	isLoadingContent = true;
	errorMessage = "";
	rawContent = "";
	renderedHtml = "";
	diagnostics = null;

	try {
		const res = await fetch(
			`${courseArchiveConfig.apiPrefix}/content?path=${encodeURIComponent(path)}`,
		);
		const data = await res.json();
		if (data.success) {
			rawContent = data.rawContent;
			renderedHtml = data.renderedHtml;
			diagnostics = data.diagnostics;
		} else {
			errorMessage = data.error || "读取文件失败";
		}
	} catch (err: unknown) {
		errorMessage = `请求失败: ${(err as Error).message}`;
	} finally {
		isLoadingContent = false;
	}
}

/**
 * 点击 Bento / List 中的卡片时进入学科
 */
function handleCourseCardClick(course: CourseListItem) {
	const found =
		tree.find((n) => n.name === course.id) ||
		tree.find((n) => n.name.toLowerCase() === course.id.toLowerCase());
	if (found) {
		handleSelectSubject(found);
	} else {
		handleSelectSubject({
			name: course.id,
			path: course.id,
			isDirectory: true,
			children: [],
		});
	}
}

// 学期色标辅助函数
const getSemesterColor = (semName: string): string => {
	const found = semesters.find((s) => s.name === semName);
	return (
		found?.color ||
		"bg-neutral-500/10 text-neutral-600 dark:text-neutral-300 border-neutral-500/20"
	);
};

// 规范化专业列表
function normalizeMajors(major: string | string[] | undefined): string[] {
	if (Array.isArray(major)) return major;
	return major ? [major] : ["公共课"];
}

function isPublicCourse(c: CourseListItem): boolean {
	const cMajors = normalizeMajors(c.major);
	return (
		cMajors.includes("公共课") ||
		c.category === "学科基础课" ||
		c.category === "通识教育课"
	);
}

function isCrossPublicCourse(c: CourseListItem, activeMajor: string): boolean {
	if (!activeMajor || activeMajor === "公共课") return false;
	const cMajors = normalizeMajors(c.major);
	return !cMajors.includes(activeMajor) && isPublicCourse(c);
}

const DYNAMIC_PALETTE = [
	"bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30",
	"bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30",
	"bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30",
	"bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30",
	"bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30",
	"bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",
	"bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30",
	"bg-violet-500/15 text-violet-700 dark:text-violet-300 border border-violet-500/30",
];

function getMajorBadgeClass(majorName: string): string {
	const found = majors.find((m) => m.name === majorName);
	if (found?.color) return found.color;
	if (majorName === "公共课") {
		return "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30";
	}
	let hash = 0;
	for (let i = 0; i < majorName.length; i++) {
		hash = (hash << 5) - hash + majorName.charCodeAt(i);
		hash |= 0;
	}
	return DYNAMIC_PALETTE[Math.abs(hash) % DYNAMIC_PALETTE.length];
}

// 过滤与搜索派生状态
const filteredCourses = $derived.by(() => {
	const query = searchQuery.trim().toLowerCase();

	const list = courses.filter((c) => {
		const cMajors = normalizeMajors(c.major);

		if (selectedMajor) {
			if (selectedMajor === "公共课") {
				if (!isPublicCourse(c)) return false;
			} else {
				const directMatch = cMajors.includes(selectedMajor);
				if (!directMatch) {
					if (!includePublic || !isPublicCourse(c)) return false;
				}
			}
		}

		if (query) {
			const matchTitle = c.title.toLowerCase().includes(query);
			const matchTitleEn = c.titleEn.toLowerCase().includes(query);
			const matchCode = c.code.toLowerCase().includes(query);
			const matchDesc = c.description.toLowerCase().includes(query);
			const matchTags = c.tags.some((t) => t.toLowerCase().includes(query));
			const matchCategory = c.category.toLowerCase().includes(query);
			const matchSemester = c.semester.toLowerCase().includes(query);

			if (
				!matchTitle &&
				!matchTitleEn &&
				!matchCode &&
				!matchDesc &&
				!matchTags &&
				!matchCategory &&
				!matchSemester
			) {
				return false;
			}
		}

		return true;
	});

	return list.slice().sort((a, b) => {
		if (sortBy === "name") {
			return a.title.localeCompare(b.title, "zh-CN");
		}
		return a.order - b.order;
	});
});

function resetFilters() {
	searchQuery = "";
	sortBy = "default";
	selectMajor("");
}

onMount(() => {
	fetchTree();
});
</script>

<div class="course-dashboard w-full flex flex-col gap-6">
	{#if !currentSubject}
		<!-- 交互筛选与搜索主控板 (Filter Controls Card) -->
		<div class="card-base dashboard-filter-card overflow-visible! relative z-30 p-4 md:p-6 rounded-2xl flex flex-col gap-4 border border-black/5 dark:border-white/5">
		<!-- 搜索行与视图切换 -->
		<div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
			<!-- 即时搜索框 -->
			<div class="relative flex-1">
				<div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black/40 dark:text-white/40">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
					</svg>
				</div>
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="实时搜索课程名、英文名、标签..."
					class="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm bg-black/5 dark:bg-white/5 border border-transparent focus:border-(--primary) focus:bg-transparent outline-none transition-all text-black/90 dark:text-white/90 placeholder:text-black/40 dark:placeholder:text-white/40"
				/>
				{#if searchQuery}
					<button
						onclick={() => (searchQuery = "")}
						class="absolute inset-y-0 right-0 pr-3 flex items-center text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors cursor-pointer"
						aria-label="清空搜索"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				{/if}
			</div>

			<!-- 排序与布局按钮组 (3 模式切换) -->
			<div class="flex items-center gap-2 shrink-0 w-full sm:w-auto">
				<!-- 排序下拉菜单 -->
				<div class="relative flex-1 sm:flex-initial" bind:this={dropdownContainerRef}>
					<button
						type="button"
						onclick={(e) => {
							e.stopPropagation();
							sortDropdownOpen = !sortDropdownOpen;
						}}
						class="text-xs h-10 px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-black/75 dark:text-white/75 hover:border-(--primary) focus:border-(--primary) transition-all flex items-center justify-between gap-2 cursor-pointer font-medium select-none w-full sm:w-38 {sortDropdownOpen ? 'border-(--primary) ring-1 ring-(--primary)/30' : ''}"
						aria-haspopup="listbox"
						aria-expanded={sortDropdownOpen}
					>
						<span class="truncate">{sortOptions.find((o) => o.value === sortBy)?.label}</span>
						<svg
							class="w-3.5 h-3.5 shrink-0 transition-transform duration-200 {sortDropdownOpen ? 'rotate-180' : ''} text-black/40 dark:text-white/40"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{#if sortDropdownOpen}
						<div
							class="absolute right-0 top-[calc(100%+6px)] w-full py-1.5 px-1 rounded-xl bg-white dark:bg-[#1a1b26] border border-black/10 dark:border-white/15 shadow-2xl z-50 flex flex-col gap-0.5 text-xs backdrop-blur-xl"
							role="listbox"
						>
							{#each sortOptions as opt}
								<button
									type="button"
									onclick={() => {
										sortBy = opt.value;
										sortDropdownOpen = false;
									}}
									class="w-full text-left px-2.5 py-2 rounded-lg transition-colors flex items-center justify-between gap-1.5 cursor-pointer {sortBy === opt.value
										? 'bg-(--primary)/15 text-(--primary) font-semibold'
										: 'text-black/75 dark:text-white/75 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black/90 dark:hover:text-white/90'}"
									role="option"
									aria-selected={sortBy === opt.value}
								>
									<span class="truncate">{opt.label}</span>
									{#if sortBy === opt.value}
										<svg class="w-3.5 h-3.5 text-(--primary) shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
										</svg>
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- 视图模式切换器 (3D 空间轮盘 / Bento 平铺 / List 列表) -->
				<div class="flex items-center rounded-xl bg-black/5 dark:bg-white/5 p-1 border border-black/5 dark:border-white/10 h-10">
					<!-- 3D 空间轮盘/手风琴视图 -->
					<button
						onclick={() => {
							viewMode = "carousel";
							currentSubject = null;
						}}
						class="h-8 w-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer {viewMode === 'carousel' && !currentSubject ? 'bg-white dark:bg-neutral-800 text-(--primary) shadow-xs' : 'text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70'}"
						title="3D 空间轮盘/手风琴学科选择"
						aria-label="3D 空间轮盘学科视图"
					>
						<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
							<polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
							<line x1="12" y1="22.08" x2="12" y2="12"></line>
						</svg>
					</button>

					<!-- 平铺视图 (Bento) -->
					<button
						onclick={() => {
							viewMode = "bento";
							currentSubject = null;
						}}
						class="h-8 w-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer {viewMode === 'bento' && !currentSubject ? 'bg-white dark:bg-neutral-800 text-(--primary) shadow-xs' : 'text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70'}"
						title="Bento Grid 平铺网格视图"
						aria-label="Bento Grid 平铺网格视图"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
						</svg>
					</button>

					<!-- 列表视图 (List) -->
					<button
						onclick={() => {
							viewMode = "list";
							currentSubject = null;
						}}
						class="h-8 w-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer {viewMode === 'list' && !currentSubject ? 'bg-white dark:bg-neutral-800 text-(--primary) shadow-xs' : 'text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70'}"
						title="列表视图"
						aria-label="列表视图"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- 结果统计提示与公共课包含切换 -->
	{#if viewMode !== 'carousel' || (selectedMajor && selectedMajor !== "公共课") || searchQuery}
	<div class="flex items-center justify-between text-xs text-black/50 dark:text-white/50 px-1 gap-2 flex-wrap">
		<div class="flex items-center gap-3 flex-wrap">
			{#if viewMode !== 'carousel'}
				<div>
					共找到 <span class="font-bold text-(--primary)">{filteredCourses.length}</span> 门核心学科
				</div>
			{/if}
			{#if selectedMajor && selectedMajor !== "公共课"}
				<button
					type="button"
					onclick={() => (includePublic = !includePublic)}
					class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer border select-none {includePublic
						? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 font-medium'
						: 'bg-black/5 dark:bg-white/5 text-black/45 dark:text-white/45 border-transparent hover:text-black/80 dark:hover:text-white/80'}"
					title="切换是否在当前专业下包含全校公共课与大类基础课"
				>
					<svg class="w-3.5 h-3.5 {includePublic ? 'text-indigo-600 dark:text-indigo-400' : 'text-current'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						{#if includePublic}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
						{:else}
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6" />
						{/if}
					</svg>
					<span>包含公共基础课</span>
				</button>
			{/if}
		</div>
		{#if searchQuery || selectedMajor}
			<div class="flex items-center gap-2 flex-wrap">
				{#if selectedMajor}
					<span class="text-black/40 dark:text-white/40">专业：</span>
					<span class="px-2 py-0.5 rounded-md bg-(--primary)/10 text-(--primary) font-medium">"{selectedMajor}"</span>
					<button
						onclick={() => selectMajor("")}
						class="text-(--primary) hover:underline cursor-pointer font-medium"
					>
						全部专业
					</button>
				{/if}
				{#if searchQuery}
					<span class="text-black/40 dark:text-white/40">搜索：</span>
					<span class="px-2 py-0.5 rounded-md bg-(--primary)/10 text-(--primary) font-medium">"{searchQuery}"</span>
					<button
						onclick={() => (searchQuery = "")}
						class="text-(--primary) hover:underline cursor-pointer ml-1 font-medium"
					>
						清空搜索
					</button>
				{/if}
			</div>
		{/if}
	</div>
	{/if}
	{/if}

	<!-- ================= 视图呈现区 ================= -->
	{#if currentSubject}
		<!-- 学科专属目录树与 Firefly 归档时间轴面板 (ArchivePanel & CategoryBar 规范) -->
		<SubjectArchivePanel
			subject={currentSubject}
			onBack={() => {
				currentSubject = null;
				if (typeof window !== "undefined") {
					const url = new URL(window.location.href);
					url.searchParams.delete("subject");
					window.history.pushState({}, "", url.href);
				}
			}}
		/>

	{:else if viewMode === "carousel"}
		<!-- ================= 模式 1：3D 空间学期轮盘 / 手风琴视图 ================= -->
		<div class="card-base p-3 sm:p-6 pb-4 sm:pb-5 rounded-2xl flex flex-col gap-3 relative overflow-hidden border border-black/5 dark:border-white/5">
			<!-- 顶部状态栏：左侧交互提示，右侧手风琴风格微调按钮 -->
			<div class="flex items-center justify-between px-1 text-xs gap-2">
				<div class="flex items-center gap-1.5 text-black/45 dark:text-white/45 font-medium select-none truncate">
					<svg class="w-3.5 h-3.5 text-(--primary) shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
					</svg>
					<span>横向拖拽旋转 · 点击学科卡片阅读</span>
				</div>
				<div class="hidden sm:flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/10 shrink-0">
					<button
						class="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer {accordionMode === 'continuous' ? 'bg-white dark:bg-neutral-800 text-(--primary) shadow-xs' : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'}"
						onclick={() => (accordionMode = "continuous")}
					>
						连续无缝
					</button>
					<button
						class="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer {accordionMode === 'independent' ? 'bg-white dark:bg-neutral-800 text-(--primary) shadow-xs' : 'text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'}"
						onclick={() => (accordionMode = "independent")}
					>
						独立卡片
					</button>
				</div>
			</div>

			<!-- 3D 轮播组件 -->
			<Carousel3D
				{tree}
				{accordionMode}
				onSelectSubject={handleSelectSubject}
			/>
		</div>

	{:else if filteredCourses.length === 0}
		<!-- 空状态 -->
		<div class="card-base p-12 rounded-2xl flex flex-col items-center justify-center text-center gap-3 border border-black/5 dark:border-white/5">
			<div class="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-black/30 dark:text-white/30">
				<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<div class="text-base font-semibold text-black/75 dark:text-white/75">暂未找到符合条件的课程</div>
			<div class="text-xs text-black/45 dark:text-white/45 max-w-sm">
				可以尝试修改搜索关键词、切换学科方向，或者向开源项目提 PR 补充该课程资料！
			</div>
			<button
				onclick={resetFilters}
				class="mt-2 text-xs px-4 py-2 rounded-xl bg-(--primary) text-white font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
			>
				重置筛选条件
			</button>
		</div>

	{:else if viewMode === "bento"}
		<!-- ================= 模式 2：Bento Grid 平铺网格视图 ================= -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			{#each filteredCourses as course (course.id)}
				<div
					class="card-base p-4 sm:p-5 rounded-2xl flex flex-col justify-between group transition-all duration-300 hover:shadow-lg hover:border-(--primary)/30 hover:-translate-y-1 relative overflow-hidden border border-black/5 dark:border-white/5 min-h-[170px] cursor-pointer"
					onclick={() => handleCourseCardClick(course)}
					role="button"
					tabindex="0"
					onkeydown={(e) => { if (e.key === 'Enter') handleCourseCardClick(course); }}
				>
					<div class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-(--primary)/5 pointer-events-none transition-all group-hover:scale-150"></div>

					<div class="flex flex-col gap-2.5">
						<!-- 顶部微标行 -->
						<div class="flex items-center gap-1.5 flex-wrap text-xs">
							<span class="px-2 py-0.5 rounded-md font-medium border {getSemesterColor(course.semester)} shrink-0">
								{course.semester}
							</span>
							{#if isCrossPublicCourse(course, selectedMajor)}
								<span class="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 shrink-0">
									公共基础
								</span>
							{/if}
							{#each normalizeMajors(course.major) as m}
								<button
									type="button"
									onclick={(e) => {
										e.stopPropagation();
										selectMajor(m);
									}}
									class="px-2 py-0.5 rounded-md font-medium shrink-0 cursor-pointer transition-transform hover:scale-105 {getMajorBadgeClass(m)}"
									title={`筛选 ${m}`}
								>
									{m}
								</button>
							{/each}
							<span class="px-2 py-0.5 rounded-md bg-black/4 dark:bg-white/5 text-black/60 dark:text-white/60 shrink-0">
								{course.category}
							</span>
						</div>

						<!-- 课程大标题与英文副标 -->
						<div>
							<div class="text-base sm:text-lg font-bold text-black/90 dark:text-white/90 group-hover:text-(--primary) transition-colors inline-flex items-center gap-1.5 max-w-full">
								<span class="truncate">{course.title}</span>
								<svg class="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-(--primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
								</svg>
							</div>
							{#if course.titleEn}
								<div class="text-xs text-black/45 dark:text-white/45 font-medium mt-0.5 truncate">
									{course.titleEn}
								</div>
							{/if}
						</div>

						<!-- 课程简述 -->
						{#if course.description}
							<p class="text-xs sm:text-sm text-black/65 dark:text-white/65 line-clamp-2 leading-relaxed">
								{course.description}
							</p>
						{/if}
					</div>

					<!-- 卡片底部动作条 -->
					<div class="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2 min-h-[34px]">
						{#if course.tags.length > 0}
							<div class="flex items-center gap-1.5 flex-nowrap overflow-hidden min-w-0 mr-auto">
								{#each course.tags.slice(0, 2) as tag}
									<button
										onclick={(e) => {
											e.stopPropagation();
											searchQuery = tag;
										}}
										class="text-[11px] px-2 py-0.5 rounded-md bg-black/4 dark:bg-white/5 text-black/60 dark:text-white/60 hover:text-(--primary) hover:bg-(--primary)/10 transition-colors cursor-pointer truncate shrink-0 max-w-[100px]"
										title={`搜索 #${tag}`}
									>
										#{tag}
									</button>
								{/each}
							</div>
						{:else}
							<div></div>
						{/if}

						<button
							type="button"
							class="text-xs px-2.5 py-1 rounded-lg text-(--primary) bg-(--primary)/10 font-semibold group-hover:bg-(--primary) group-hover:text-white transition-all flex items-center gap-1 shrink-0 ml-auto"
						>
							阅读资料 →
						</button>
					</div>
				</div>
			{/each}
		</div>

	{:else}
		<!-- ================= 模式 3：紧凑列表布局 (List Mode) ================= -->
		<div class="flex flex-col gap-3">
			{#each filteredCourses as course (course.id)}
				<div
					class="card-base p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-(--primary)/30 transition-all border border-black/5 dark:border-white/5 cursor-pointer"
					onclick={() => handleCourseCardClick(course)}
					role="button"
					tabindex="0"
					onkeydown={(e) => { if (e.key === 'Enter') handleCourseCardClick(course); }}
				>
					<div class="flex items-start sm:items-center gap-3 min-w-0">
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2 flex-wrap">
								<span class="font-bold text-base text-black/90 dark:text-white/90 group-hover:text-(--primary) transition-colors truncate">
									{course.title}
								</span>
								<span class="text-xs px-1.5 py-0.2 rounded border {getSemesterColor(course.semester)} shrink-0">
									{course.semester}
								</span>
								{#if isCrossPublicCourse(course, selectedMajor)}
									<span class="text-xs px-1.5 py-0.2 rounded font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 shrink-0">
										公共基础
									</span>
								{/if}
								{#each normalizeMajors(course.major) as m}
									<button
										type="button"
										onclick={(e) => {
											e.stopPropagation();
											selectMajor(m);
										}}
										class="text-xs px-1.5 py-0.2 rounded font-medium shrink-0 cursor-pointer {getMajorBadgeClass(m)}"
										title={`筛选 ${m}`}
									>
										{m}
									</button>
								{/each}
								<span class="text-xs px-1.5 py-0.2 rounded bg-black/4 dark:bg-white/5 text-black/60 dark:text-white/60 shrink-0">
									{course.category}
								</span>
							</div>
							{#if course.description}
								<div class="text-xs text-black/50 dark:text-white/50 truncate mt-1">
									{course.description}
								</div>
							{/if}
						</div>
					</div>

					<div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
						<span class="text-xs px-3 py-1.5 rounded-lg bg-(--primary)/10 text-(--primary) font-medium group-hover:bg-(--primary) group-hover:text-white transition-all flex items-center gap-1">
							进入阅读
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
/* 确保筛选面板下拉菜单不被 .card-base 的 overflow: hidden 裁剪 */
:global(.card-base.dashboard-filter-card) {
	overflow: visible !important;
}

/* 基础 Markdown 容器样式 (匹配 Firefly-Template 样式规范) */
:global(.custom-md) {
	word-break: break-word;
}
:global(.custom-md h1),
:global(.custom-md h2),
:global(.custom-md h3),
:global(.custom-md h4) {
	margin-top: 1.5em;
	margin-bottom: 0.5em;
	font-weight: 700;
}
:global(.custom-md h1) { font-size: 1.75rem; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.3em; }
:global(.custom-md h2) { font-size: 1.4rem; border-bottom: 1px solid rgba(0,0,0,0.06); padding-bottom: 0.2em; }
:global(.custom-md h3) { font-size: 1.2rem; }
:global(.custom-md p) { margin: 0.8em 0; line-height: 1.75; }
:global(.custom-md ul),
:global(.custom-md ol) { padding-left: 1.5em; margin: 0.8em 0; }
:global(.custom-md li) { margin: 0.3em 0; }
:global(.custom-md blockquote) {
	margin: 1em 0;
	padding: 0.5em 1em;
	background: rgba(59, 130, 246, 0.08);
	border-left: 4px solid #3b82f6;
	border-radius: 0 8px 8px 0;
}
:global(.custom-md table) {
	border-collapse: collapse;
	width: 100%;
	margin: 1em 0;
}
:global(.custom-md th),
:global(.custom-md td) {
	border: 1px solid rgba(0,0,0,0.1);
	padding: 8px 12px;
	text-align: left;
}
:global(.custom-md code:not(pre code)) {
	background: rgba(0,0,0,0.06);
	color: #ef4444;
	padding: 2px 5px;
	border-radius: 4px;
	font-size: 0.9em;
}
:global(.custom-md pre) {
	background: #0f172a;
	color: #f8fafc;
	padding: 14px;
	border-radius: 8px;
	overflow-x: auto;
}
:global(.custom-md pre code) {
	background: transparent;
	color: inherit;
	padding: 0;
}
:global(.custom-md img) {
	max-width: 100%;
	height: auto;
	border-radius: 6px;
}
:global(.katex-error) {
	color: #e11d48 !important;
	background-color: #fff1f2;
	border: 1px dashed #f43f5e;
	padding: 1px 4px;
	border-radius: 3px;
	cursor: help;
}
</style>
