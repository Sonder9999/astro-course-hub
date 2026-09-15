<script lang="ts">
import { onMount } from "svelte";
import Carousel3D from "@/components/Carousel3D.svelte";
import TreeNodeComponent from "@/components/TreeNode.svelte";
import { courseArchiveConfig } from "@/config/archiveConfig";
import {
	getCollegeByMajor,
	getColleges,
	getHierarchyNode,
	getMajorsByCollege,
} from "@/config/hierarchyConfig";
import {
	courseCoverConfig,
	getCourseCover,
	getSemesterGroupsByMajor,
	getSubjectMeta,
	majorSemesterGroups,
	semesterGroups,
} from "@/config/subjectConfig";
import type {
	CarouselCardItem,
	CourseCategoryConfig,
	CourseMajorConfig,
	CourseSemesterConfig,
	SemesterGroup,
	TreeNode,
} from "@/types/course";
import type { CourseListItem } from "@/utils/course-utils";
import SubjectArchivePanel from "./SubjectArchivePanel.svelte";

// 页面刷新种子：在客户端加载时生成独立时间戳，若开启 randomOnRefresh 则保证每次刷新图片各异
const refreshSeed = typeof window !== "undefined" ? Date.now() : "";

function resolveCourseCover(course: CourseListItem): string {
	if (course.image && !course.image.includes("t.alcy.cc")) {
		return course.image;
	}
	return getCourseCover(course.id, refreshSeed);
}

function resolveNodeCover(nodeId: string, customImage?: string): string {
	if (customImage && !customImage.includes("t.alcy.cc")) {
		return customImage;
	}
	return getCourseCover(nodeId, refreshSeed);
}

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

// Svelte 5 响应式状态：多层级导航
let selectedCollege = $state("");
let selectedMajor = $state("");
let searchQuery = $state("");
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

// 当前层级判断 (Level 1: college | Level 2: major | Level 3: course)
const currentLevel = $derived.by<"college" | "major" | "course">(() => {
	if (selectedCollege === "toefl" || selectedMajor) {
		return "course";
	}
	if (selectedCollege) {
		return "major";
	}
	return "college";
});

const currentCollegeNode = $derived(
	selectedCollege ? getHierarchyNode(selectedCollege) : null,
);
const currentMajorNode = $derived(
	selectedMajor ? getHierarchyNode(selectedMajor) : null,
);

const currentSubjectMeta = $derived(
	currentSubject ? getSubjectMeta(currentSubject.name) : null,
);

// 当前专业或学院对应的学期轮盘配置（软工按要求仅标注大一上、大三上）
const currentSemesters = $derived.by<SemesterGroup[]>(() => {
	if (selectedMajor) {
		return getSemesterGroupsByMajor(selectedMajor);
	}
	if (selectedCollege === "toefl") {
		return getSemesterGroupsByMajor("toefl");
	}
	if (selectedCollege === "se-college") {
		return getSemesterGroupsByMajor("se");
	}
	return semesterGroups;
});

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

// 从 URL 读取初始搜索关键字、层级选择及学科
$effect(() => {
	if (typeof window !== "undefined") {
		const params = new URLSearchParams(window.location.search);
		const initialQuery = params.get("q") || params.get("tag");
		if (initialQuery && !searchQuery) {
			searchQuery = initialQuery;
		}
		const initialCollege = params.get("college");
		if (initialCollege && !selectedCollege) {
			selectedCollege = initialCollege;
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

function syncUrl() {
	if (typeof window !== "undefined") {
		const url = new URL(window.location.href);
		if (selectedCollege) {
			url.searchParams.set("college", selectedCollege);
		} else {
			url.searchParams.delete("college");
		}
		if (selectedMajor) {
			url.searchParams.set("major", selectedMajor);
		} else {
			url.searchParams.delete("major");
		}
		if (searchQuery) {
			url.searchParams.set("q", searchQuery);
		} else {
			url.searchParams.delete("q");
		}
		window.history.pushState({}, "", url.href);
	}
}

// 监听分类导航栏的专业变更自定义事件与 popstate 事件
$effect(() => {
	function handleMajorChange(e: Event) {
		const customEvent = e as CustomEvent<{ major: string }>;
		if (customEvent.detail && typeof customEvent.detail.major === "string") {
			selectMajor(customEvent.detail.major);
		}
	}

	function handlePopState() {
		const params = new URLSearchParams(window.location.search);
		selectedCollege = params.get("college") || "";
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

// 选择/重置学院
function selectCollege(collegeId: string) {
	selectedCollege = collegeId;
	if (collegeId === "toefl") {
		selectedMajor = "toefl";
	} else {
		selectedMajor = "";
	}
	currentSubject = null;
	syncUrl();
}

// 选择/重置专业
function selectMajor(majorName: string) {
	selectedMajor = majorName;
	if (majorName) {
		const parentCollege = getCollegeByMajor(majorName);
		if (parentCollege) {
			selectedCollege = parentCollege.id;
		}
	}
	currentSubject = null;
	syncUrl();
	if (typeof window !== "undefined") {
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

// 学院级 3D 轮盘卡片
const collegeCarouselCards = $derived.by<CarouselCardItem[]>(() => {
	const query = searchQuery.trim().toLowerCase();
	const list = getColleges();

	return list
		.filter((col) => {
			if (!query) return true;
			const matchName = col.name.toLowerCase().includes(query);
			const matchDesc = col.description?.toLowerCase().includes(query);
			const matchMajors = getMajorsByCollege(col.id).some((m) =>
				m.name.toLowerCase().includes(query),
			);
			return matchName || matchDesc || matchMajors;
		})
		.map((col) => {
			return {
				id: col.id,
				name: col.name,
				enName: col.shortName || "",
				subTitle: col.description,
				themeColor: col.color || "#3b82f6",
				image: col.image || getCourseCover(col.id, refreshSeed),
				badge: col.badge || "",
				actionLabel: col.id === "toefl" ? "开始备考 →" : "进入学院 →",
			};
		});
});

// 专业级 3D 轮盘卡片
const majorCarouselCards = $derived.by<CarouselCardItem[]>(() => {
	const query = searchQuery.trim().toLowerCase();
	const list = selectedCollege ? getMajorsByCollege(selectedCollege) : [];

	return list
		.filter((m) => {
			if (!query) return true;
			return (
				m.name.toLowerCase().includes(query) ||
				m.description?.toLowerCase().includes(query)
			);
		})
		.map((m) => {
			return {
				id: m.id,
				name: m.name,
				enName: m.shortName || "",
				subTitle: m.description,
				themeColor: m.color || "#3b82f6",
				image: m.image || getCourseCover(m.id, refreshSeed),
				badge: m.badge || "",
				actionLabel: "进入专业课程 →",
			};
		});
});

// 学院筛选派生列表
const filteredColleges = $derived.by(() => {
	const query = searchQuery.trim().toLowerCase();
	const list = getColleges();
	if (!query) return list;
	return list.filter((col) => {
		const matchName = col.name.toLowerCase().includes(query);
		const matchShort = col.shortName?.toLowerCase().includes(query);
		const matchDesc = col.description?.toLowerCase().includes(query);
		const matchMajors = getMajorsByCollege(col.id).some(
			(m) =>
				m.name.toLowerCase().includes(query) ||
				m.shortName?.toLowerCase().includes(query),
		);
		return matchName || matchShort || matchDesc || matchMajors;
	});
});

// 专业筛选派生列表 (仅在当前选定学院下)
const filteredMajors = $derived.by(() => {
	const query = searchQuery.trim().toLowerCase();
	const list = selectedCollege ? getMajorsByCollege(selectedCollege) : [];
	if (!query) return list;
	return list.filter((m) => {
		const matchName = m.name.toLowerCase().includes(query);
		const matchShort = m.shortName?.toLowerCase().includes(query);
		const matchDesc = m.description?.toLowerCase().includes(query);
		return matchName || matchShort || matchDesc;
	});
});

// 计算指定学院下的课程总数
function getCollegeCourseCount(collegeId: string): number {
	if (collegeId === "toefl") {
		return courses.filter((c) => {
			const cMajors = normalizeMajors(c.major);
			return cMajors.includes("toefl") || c.id === "TOEFL";
		}).length;
	}
	const colMajors = getMajorsByCollege(collegeId);
	const majorIds = colMajors.flatMap((m) => [m.id, m.name]);
	return courses.filter((c) => {
		const cMajors = normalizeMajors(c.major);
		return cMajors.some((m) => majorIds.includes(m));
	}).length;
}

// 计算指定专业下的课程总数
function getMajorCourseCount(majorId: string): number {
	const node = getHierarchyNode(majorId);
	const targetName = node?.name || majorId;
	return courses.filter((c) => {
		const cMajors = normalizeMajors(c.major);
		return cMajors.includes(majorId) || cMajors.includes(targetName);
	}).length;
}

// 获取指定专业下的课程实体（用于卡片预览）
function getMajorCourses(majorId: string): CourseListItem[] {
	const node = getHierarchyNode(majorId);
	const targetName = node?.name || majorId;
	return courses.filter((c) => {
		const cMajors = normalizeMajors(c.major);
		return cMajors.includes(majorId) || cMajors.includes(targetName);
	});
}

// 返回上一级
function navigateBack() {
	if (currentLevel === "course") {
		if (selectedCollege === "toefl") {
			selectCollege("");
		} else {
			selectedMajor = "";
			syncUrl();
		}
	} else if (currentLevel === "major") {
		selectCollege("");
	}
}

// 过滤与搜索派生状态
const filteredCourses = $derived.by(() => {
	const query = searchQuery.trim().toLowerCase();

	const list = courses.filter((c) => {
		const cMajors = normalizeMajors(c.major);

		if (selectedMajor) {
			const targetNode = getHierarchyNode(selectedMajor);
			const targetName = targetNode?.name || selectedMajor;
			const directMatch =
				cMajors.includes(selectedMajor) ||
				cMajors.includes(targetName) ||
				cMajors.some((m) => m.toLowerCase() === selectedMajor.toLowerCase());

			if (!directMatch) {
				// 软件工程 (se) 和 TOEFL 按要求严格仅展示绑定课程，不混入其他公共课
				if (
					!includePublic ||
					!isPublicCourse(c) ||
					selectedMajor === "toefl" ||
					selectedMajor === "se" ||
					selectedCollege === "se-college"
				) {
					return false;
				}
			}
		} else if (selectedCollege) {
			const colMajors = getMajorsByCollege(selectedCollege).flatMap((m) => [
				m.id,
				m.name,
			]);
			if (colMajors.length > 0) {
				const inCollege = cMajors.some((m) => colMajors.includes(m));
				if (!inCollege) {
					return false;
				}
			} else if (selectedCollege === "toefl") {
				if (!cMajors.includes("toefl") && c.id !== "TOEFL") {
					return false;
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
	selectedMajor = "";
	selectedCollege = "";
	syncUrl();
}

onMount(() => {
	fetchTree();
});
</script>

<div class="course-dashboard w-full flex flex-col gap-6">
	{#if !currentSubject}
		<!-- 顶部面包屑与层级导航栏 (Breadcrumbs & Navigation Bar) -->
		<div class="card-base p-3 sm:p-4 rounded-2xl flex items-center justify-between gap-3 border border-black/5 dark:border-white/5 flex-wrap">
			<!-- 面包屑路径 -->
			<nav class="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-black/60 dark:text-white/60 flex-wrap" aria-label="层级导航">
				<button
					type="button"
					onclick={() => {
						selectedCollege = "";
						selectedMajor = "";
						syncUrl();
					}}
					class="hover:text-(--primary) transition-colors cursor-pointer flex items-center gap-1.5 {!selectedCollege ? 'text-(--primary) font-bold' : ''}"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
					</svg>
					<span>课程大厅</span>
				</button>

				{#if currentCollegeNode}
					<span class="text-black/30 dark:text-white/30 select-none">/</span>
					<button
						type="button"
						onclick={() => {
							if (selectedCollege === "toefl") return;
							selectedMajor = "";
							syncUrl();
						}}
						class="hover:text-(--primary) transition-colors cursor-pointer {selectedCollege && !selectedMajor ? 'text-(--primary) font-bold' : ''}"
					>
						{currentCollegeNode.name}
					</button>
				{/if}

				{#if currentMajorNode && selectedCollege !== "toefl"}
					<span class="text-black/30 dark:text-white/30 select-none">/</span>
					<span class="text-(--primary) font-bold">{currentMajorNode.name}</span>
				{/if}
			</nav>

			<!-- 快捷返回上一级按钮 -->
			{#if currentLevel !== "college"}
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={navigateBack}
						class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-black/5 dark:bg-white/5 hover:bg-(--primary)/15 hover:text-(--primary) text-black/75 dark:text-white/75 transition-colors cursor-pointer font-medium border border-black/5 dark:border-white/10"
					>
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
						</svg>
						<span>返回{currentLevel === "course" && selectedCollege !== "toefl" ? "专业列表" : "学院大厅"}</span>
					</button>
				</div>
			{/if}
		</div>

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
						placeholder={
							currentLevel === "college"
								? "实时搜索学院、专业、独立模块..."
								: currentLevel === "major"
									? `实时搜索 ${currentCollegeNode?.name || "当前学院"} 下的专业、方向...`
									: "实时搜索课程名、英文名、标签..."
						}
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
						<!-- 3D 空间轮盘 -->
						<button
							onclick={() => {
								viewMode = "carousel";
								currentSubject = null;
							}}
							class="h-8 w-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer {viewMode === 'carousel' && !currentSubject ? 'bg-white dark:bg-neutral-800 text-(--primary) shadow-xs' : 'text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70'}"
							title="3D 空间轮盘/手风琴视图"
							aria-label="3D 空间轮盘视图"
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

		<!-- 统计提示与公共课切换 -->
		<div class="flex items-center justify-between text-xs text-black/50 dark:text-white/50 px-1 gap-2 flex-wrap">
			<div class="flex items-center gap-3 flex-wrap">
				{#if currentLevel === "college"}
					<div>
						共包含 <span class="font-bold text-(--primary)">{filteredColleges.length}</span> 个学院 / 独立单元
					</div>
				{:else if currentLevel === "major"}
					<div>
						【{currentCollegeNode?.name}】下共 <span class="font-bold text-(--primary)">{filteredMajors.length}</span> 个专业方向
					</div>
				{:else}
					<div>
						共找到 <span class="font-bold text-(--primary)">{filteredCourses.length}</span> 门核心课程
					</div>
					{#if selectedMajor && selectedMajor !== "公共课" && selectedMajor !== "toefl" && selectedMajor !== "se"}
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
				{/if}
			</div>

			{#if searchQuery || selectedCollege || selectedMajor}
				<div class="flex items-center gap-2 flex-wrap">
					{#if selectedCollege}
						<span class="text-black/40 dark:text-white/40">学院：</span>
						<span class="px-2 py-0.5 rounded-md bg-(--primary)/10 text-(--primary) font-medium">
							"{currentCollegeNode?.name || selectedCollege}"
						</span>
					{/if}
					{#if selectedMajor && selectedCollege !== "toefl"}
						<span class="text-black/40 dark:text-white/40">专业：</span>
						<span class="px-2 py-0.5 rounded-md bg-(--primary)/10 text-(--primary) font-medium">
							"{currentMajorNode?.name || selectedMajor}"
						</span>
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
					<button
						onclick={resetFilters}
						class="text-(--primary) hover:underline cursor-pointer ml-2 font-medium"
					>
						全部重置
					</button>
				</div>
			{/if}
		</div>
	{/if}

	<!-- ================= 视图呈现区 ================= -->
	{#if currentSubject}
		<!-- 学科专属目录树与 Firefly 归档时间轴面板 -->
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

	<!-- ==================== Level 1: 学院级展示 ==================== -->
	{:else if currentLevel === "college"}
		{#if filteredColleges.length === 0}
			<!-- 空状态 -->
			<div class="card-base p-12 rounded-2xl flex flex-col items-center justify-center text-center gap-3 border border-black/5 dark:border-white/5">
				<div class="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-black/30 dark:text-white/30">
					<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<div class="text-base font-semibold text-black/75 dark:text-white/75">暂未找到符合条件的学院</div>
				<div class="text-xs text-black/45 dark:text-white/45 max-w-sm">
					可以尝试修改搜索关键词或清空搜索条件。
				</div>
				<button
					onclick={resetFilters}
					class="mt-2 text-xs px-4 py-2 rounded-xl bg-(--primary) text-white font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
				>
					重置筛选条件
				</button>
			</div>

		{:else if viewMode === "carousel"}
			<!-- Level 1 模式 1：3D 学院轮盘 -->
			<div class="card-base p-3 sm:p-6 pb-4 sm:pb-5 rounded-2xl flex flex-col gap-3 relative overflow-hidden border border-black/5 dark:border-white/5">
				<div class="flex items-center justify-between px-1 text-xs gap-2">
					<div class="flex items-center gap-1.5 text-black/45 dark:text-white/45 font-medium select-none truncate">
						<svg class="w-3.5 h-3.5 text-(--primary) shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
						</svg>
						<span>横向旋转选择学院 · 点击卡片进入下属专业</span>
					</div>
				</div>

				<Carousel3D
					cards={collegeCarouselCards}
					cardActionLabel="进入学院 →"
					onSelectCard={(c) => selectCollege(c.id)}
				/>
			</div>

		{:else if viewMode === "bento"}
			<!-- Level 1 模式 2：Bento Grid 平铺网格 -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
				{#each filteredColleges as col (col.id)}
					<div
						class="card-base p-5 sm:p-6 rounded-2xl flex flex-col justify-between group transition-all duration-300 hover:shadow-xl hover:border-(--primary)/40 hover:-translate-y-1 relative overflow-hidden border border-black/5 dark:border-white/5 min-h-[200px] cursor-pointer"
						onclick={() => selectCollege(col.id)}
						role="button"
						tabindex="0"
						onkeydown={(e) => { if (e.key === 'Enter') selectCollege(col.id); }}
					>
						<div class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-(--primary)/5 pointer-events-none transition-all group-hover:scale-150"></div>

						{#if resolveNodeCover(col.id, col.image)}
							<div class="absolute right-0 top-0 bottom-0 w-36 sm:w-44 pointer-events-none overflow-hidden opacity-15 dark:opacity-25 transition-opacity group-hover:opacity-30">
								<img
									src={resolveNodeCover(col.id, col.image)}
									alt={col.name}
									class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
									loading="lazy"
									onerror={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
								/>
								<!-- 线性渐变遮罩：让图片左侧与卡片底色自然淡化融合 -->
								<div class="absolute inset-0 bg-gradient-to-r from-[var(--card-bg,#fff)] dark:from-[var(--card-bg,#1a1b26)] via-transparent to-transparent"></div>
							</div>
						{/if}

						<div class="flex flex-col gap-3 relative z-10">
							{#if col.badge || col.shortName}
								<div class="flex items-center justify-between gap-2">
									{#if col.badge}
										<span
											class="px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0"
											style="background: {col.color ? `${col.color}20` : 'rgba(59,130,246,0.15)'}; color: {col.color || '#3b82f6'};"
										>
											{col.badge}
										</span>
									{/if}
									{#if col.shortName}
										<span class="text-xs text-black/45 dark:text-white/45 font-mono">
											{col.shortName}
										</span>
									{/if}
								</div>
							{/if}

							<!-- 学院名与简介 -->
							<div>
								<div class="text-lg sm:text-xl font-bold text-black/90 dark:text-white/90 group-hover:text-(--primary) transition-colors flex items-center gap-2">
									<span>{col.name}</span>
									<svg class="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-(--primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
									</svg>
								</div>
								{#if col.description}
									<p class="text-xs sm:text-sm text-black/60 dark:text-white/60 mt-2 line-clamp-2 leading-relaxed">
										{col.description}
									</p>
								{/if}
							</div>
						</div>

						<!-- 底部动作条 -->
						<div class="mt-5 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs relative z-10">
							<span class="text-black/50 dark:text-white/50">
								{getCollegeCourseCount(col.id)} 门核心课程
							</span>
							<span class="font-semibold text-(--primary) flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
								{col.id === 'toefl' ? '开始备考' : '进入学院'} →
							</span>
						</div>
					</div>
				{/each}
			</div>

		{:else}
			<!-- Level 1 模式 3：List 列表视图 -->
			<div class="flex flex-col gap-3">
				{#each filteredColleges as col (col.id)}
					<div
						class="card-base p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-(--primary)/30 transition-all border border-black/5 dark:border-white/5 cursor-pointer"
						onclick={() => selectCollege(col.id)}
						role="button"
						tabindex="0"
						onkeydown={(e) => { if (e.key === 'Enter') selectCollege(col.id); }}
					>
						<div class="flex items-start sm:items-center gap-3 min-w-0">
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2 flex-wrap">
									<span class="font-bold text-base text-black/90 dark:text-white/90 group-hover:text-(--primary) transition-colors">
										{col.name}
									</span>
									{#if col.badge}
										<span
											class="text-xs px-2 py-0.5 rounded-md font-semibold"
											style="background: {col.color ? `${col.color}20` : 'rgba(59,130,246,0.15)'}; color: {col.color || '#3b82f6'};"
										>
											{col.badge}
										</span>
									{/if}
									<span class="text-xs text-black/50 dark:text-white/50">
										{getCollegeCourseCount(col.id)} 门核心课程
									</span>
								</div>
								{#if col.description}
									<div class="text-xs text-black/50 dark:text-white/50 truncate mt-1">
										{col.description}
									</div>
								{/if}
							</div>
						</div>

						<div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
							<span class="text-xs px-3 py-1.5 rounded-lg bg-(--primary)/10 text-(--primary) font-medium group-hover:bg-(--primary) group-hover:text-white transition-all flex items-center gap-1">
								{col.id === 'toefl' ? '进入备考' : '进入学院'}
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}

	<!-- ==================== Level 2: 专业级展示 ==================== -->
	{:else if currentLevel === "major"}
		{#if filteredMajors.length === 0}
			<!-- 空状态 -->
			<div class="card-base p-12 rounded-2xl flex flex-col items-center justify-center text-center gap-3 border border-black/5 dark:border-white/5">
				<div class="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-black/30 dark:text-white/30">
					<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<div class="text-base font-semibold text-black/75 dark:text-white/75">暂未找到符合条件的专业方向</div>
				<div class="text-xs text-black/45 dark:text-white/45 max-w-sm">
					可以尝试清空搜索词或返回查看其他学院。
				</div>
				<button
					onclick={() => { searchQuery = ""; }}
					class="mt-2 text-xs px-4 py-2 rounded-xl bg-(--primary) text-white font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
				>
					清空搜索
				</button>
			</div>

		{:else if viewMode === "carousel"}
			<!-- Level 2 模式 1：3D 专业轮盘 -->
			<div class="card-base p-3 sm:p-6 pb-4 sm:pb-5 rounded-2xl flex flex-col gap-3 relative overflow-hidden border border-black/5 dark:border-white/5">
				<div class="flex items-center justify-between px-1 text-xs gap-2">
					<div class="flex items-center gap-1.5 text-black/45 dark:text-white/45 font-medium select-none truncate">
						<svg class="w-3.5 h-3.5 text-(--primary) shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
						</svg>
						<span>横向旋转选择专业 · 点击卡片进入专业课程体系</span>
					</div>
				</div>

				<Carousel3D
					cards={majorCarouselCards}
					cardActionLabel="进入专业课程 →"
					onSelectCard={(c) => selectMajor(c.id)}
				/>
			</div>

		{:else if viewMode === "bento"}
			<!-- Level 2 模式 2：Bento Grid 平铺网格 -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
				{#each filteredMajors as m (m.id)}
					<div
						class="card-base p-5 sm:p-6 rounded-2xl flex flex-col justify-between group transition-all duration-300 hover:shadow-xl hover:border-(--primary)/40 hover:-translate-y-1 relative overflow-hidden border border-black/5 dark:border-white/5 min-h-[200px] cursor-pointer"
						onclick={() => selectMajor(m.id)}
						role="button"
						tabindex="0"
						onkeydown={(e) => { if (e.key === 'Enter') selectMajor(m.id); }}
					>
						<div class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-(--primary)/5 pointer-events-none transition-all group-hover:scale-150"></div>

						{#if resolveNodeCover(m.id, m.image)}
							<div class="absolute right-0 top-0 bottom-0 w-36 sm:w-44 pointer-events-none overflow-hidden opacity-15 dark:opacity-25 transition-opacity group-hover:opacity-30">
								<img
									src={resolveNodeCover(m.id, m.image)}
									alt={m.name}
									class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
									loading="lazy"
									onerror={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
								/>
								<!-- 线性渐变遮罩：让图片左侧与卡片底色自然淡化融合 -->
								<div class="absolute inset-0 bg-gradient-to-r from-[var(--card-bg,#fff)] dark:from-[var(--card-bg,#1a1b26)] via-transparent to-transparent"></div>
							</div>
						{/if}

						<div class="flex flex-col gap-3 relative z-10">
							<div class="flex items-center justify-between gap-2">
								<span
									class="px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0"
									style="background: {m.color ? `${m.color}20` : 'rgba(59,130,246,0.15)'}; color: {m.color || '#3b82f6'};"
								>
									{getMajorCourseCount(m.id)} 门培养课程
								</span>
							</div>

							<div>
								<div class="text-lg sm:text-xl font-bold text-black/90 dark:text-white/90 group-hover:text-(--primary) transition-colors flex items-center gap-2">
									<span>{m.name}</span>
									<svg class="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-(--primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
									</svg>
								</div>
								{#if m.description}
									<p class="text-xs sm:text-sm text-black/60 dark:text-white/60 mt-2 line-clamp-2 leading-relaxed">
										{m.description}
									</p>
								{/if}
							</div>
						</div>

						<div class="mt-5 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs relative z-10">
							<span class="text-black/50 dark:text-white/50">
								{currentCollegeNode?.name}
							</span>
							<span class="font-semibold text-(--primary) flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
								浏览专业课程 →
							</span>
						</div>
					</div>
				{/each}
			</div>

		{:else}
			<!-- Level 2 模式 3：List 列表视图 -->
			<div class="flex flex-col gap-3">
				{#each filteredMajors as m (m.id)}
					<div
						class="card-base p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-(--primary)/30 transition-all border border-black/5 dark:border-white/5 cursor-pointer"
						onclick={() => selectMajor(m.id)}
						role="button"
						tabindex="0"
						onkeydown={(e) => { if (e.key === 'Enter') selectMajor(m.id); }}
					>
						<div class="flex items-start sm:items-center gap-3 min-w-0">
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2 flex-wrap">
									<span class="font-bold text-base text-black/90 dark:text-white/90 group-hover:text-(--primary) transition-colors">
										{m.name}
									</span>
									<span
										class="text-xs px-2 py-0.5 rounded-md font-semibold"
										style="background: {m.color ? `${m.color}20` : 'rgba(59,130,246,0.15)'}; color: {m.color || '#3b82f6'};"
									>
										{getMajorCourseCount(m.id)} 门课程
									</span>
								</div>
								{#if m.description}
									<div class="text-xs text-black/50 dark:text-white/50 truncate mt-1">
										{m.description}
									</div>
								{/if}
							</div>
						</div>

						<div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
							<span class="text-xs px-3 py-1.5 rounded-lg bg-(--primary)/10 text-(--primary) font-medium group-hover:bg-(--primary) group-hover:text-white transition-all flex items-center gap-1">
								浏览专业课程
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
								</svg>
							</span>
						</div>
					</div>
				{/each}
			</div>
		{/if}

	<!-- ==================== Level 3: 课程级展示 ==================== -->
	{:else}
		{#if filteredCourses.length === 0}
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

		{:else if viewMode === "carousel"}
			<!-- Level 3 模式 1：3D 课程轮盘 (对于软工仅有大一上和大三上两个学期) -->
			<div class="card-base p-3 sm:p-6 pb-4 sm:pb-5 rounded-2xl flex flex-col gap-3 relative overflow-hidden border border-black/5 dark:border-white/5">
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

				<Carousel3D
					semesters={currentSemesters}
					{tree}
					{accordionMode}
					onSelectSubject={handleSelectSubject}
				/>
			</div>

		{:else if viewMode === "bento"}
			<!-- Level 3 模式 2：Bento Grid 课程卡片平铺 -->
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

						{#if resolveCourseCover(course)}
							<div class="absolute right-0 top-0 bottom-0 w-36 pointer-events-none overflow-hidden opacity-15 dark:opacity-25 transition-opacity group-hover:opacity-30">
								<img
									src={resolveCourseCover(course)}
									alt={course.title}
									class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
									loading="lazy"
									onerror={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
								/>
								<div class="absolute inset-0 bg-gradient-to-r from-[var(--card-bg,#fff)] dark:from-[var(--card-bg,#1a1b26)] via-transparent to-transparent"></div>
							</div>
						{/if}

						<div class="flex flex-col gap-2.5 relative z-10">
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
						<div class="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2 min-h-[34px] relative z-10">
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
			<!-- Level 3 模式 3：List 列表视图 -->
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
