<script lang="ts">
import type {
	CourseCategoryConfig,
	CourseMajorConfig,
	CourseSemesterConfig,
} from "@/types/course";
import type { CourseListItem } from "@/utils/course-utils";

interface Props {
	courses: CourseListItem[];
	semesters?: CourseSemesterConfig[];
	majors?: CourseMajorConfig[];
	categories?: CourseCategoryConfig[];
	featuredTags?: string[];
}

let {
	courses = [],
	semesters = [],
	majors = [],
	categories = [],
}: Props = $props();

// Svelte 5 响应式状态
let searchQuery = $state("");
let selectedMajor = $state("");
let sortBy = $state<"default" | "name">("default");
let viewMode = $state<"bento" | "list">("bento");
let sortDropdownOpen = $state(false);
let dropdownContainerRef: HTMLDivElement | null = $state(null);

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

// 从 URL 读取初始搜索关键字及专业筛选 (例如 ?q=xxx, ?tag=xxx, ?major=xxx)
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
	}

	window.addEventListener("course-major-change", handleMajorChange);
	window.addEventListener("popstate", handlePopState);
	return () => {
		window.removeEventListener("course-major-change", handleMajorChange);
		window.removeEventListener("popstate", handlePopState);
	};
});

// 选择/重置专业并同步 URL 与分类导航栏
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

// 专业色标辅助函数
function getMajorBadgeClass(majorName: string): string {
	const found = majors.find((m) => m.name === majorName);
	if (found?.color) return found.color;
	if (majorName === "公共课") {
		return "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30";
	}
	return "bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30";
}

// 过滤与搜索派生状态
const filteredCourses = $derived.by(() => {
	const query = searchQuery.trim().toLowerCase();

	const list = courses.filter((c) => {
		// 专业过滤
		if (selectedMajor) {
			const cMajors = normalizeMajors(c.major);
			if (!cMajors.includes(selectedMajor)) {
				return false;
			}
		}

		// 搜索关键字过滤
		if (query) {
			const matchTitle = c.title.toLowerCase().includes(query);
			const matchTitleEn = c.titleEn.toLowerCase().includes(query);
			const matchCode = c.code.toLowerCase().includes(query);
			const matchDesc = c.description.toLowerCase().includes(query);
			const matchTags = c.tags.some((t) => t.toLowerCase().includes(query));
			const matchInstructors = c.instructors.some((inst) =>
				inst.toLowerCase().includes(query),
			);
			const matchCategory = c.category.toLowerCase().includes(query);
			const matchSemester = c.semester.toLowerCase().includes(query);
			const cMajors = normalizeMajors(c.major);
			const matchMajor = cMajors.some((m) => m.toLowerCase().includes(query));

			if (
				!matchTitle &&
				!matchTitleEn &&
				!matchCode &&
				!matchDesc &&
				!matchTags &&
				!matchInstructors &&
				!matchCategory &&
				!matchSemester &&
				!matchMajor
			) {
				return false;
			}
		}

		return true;
	});

	// 排序
	return list.slice().sort((a, b) => {
		if (sortBy === "name") {
			return a.title.localeCompare(b.title, "zh-CN");
		}
		return a.order - b.order;
	});
});

// 重置所有筛选
function resetFilters() {
	searchQuery = "";
	sortBy = "default";
	selectMajor("");
}
</script>

<div class="course-dashboard w-full flex flex-col gap-6">
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

			<!-- 排序与布局按钮组 -->
			<div class="flex items-center gap-2 shrink-0 w-full sm:w-auto">
				<!-- 自定义主题排序下拉菜单 (Custom Themed Dropdown) -->
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

				<!-- 视图切换 (Bento / List) -->
				<div class="flex items-center rounded-xl bg-black/5 dark:bg-white/5 p-1 border border-black/5 dark:border-white/10 h-10">
					<button
						onclick={() => (viewMode = "bento")}
						class="h-8 w-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer {viewMode === 'bento' ? 'bg-white dark:bg-neutral-800 text-(--primary) shadow-xs' : 'text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70'}"
						title="Bento Grid 网格视图"
						aria-label="Bento Grid 网格视图"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
						</svg>
					</button>
					<button
						onclick={() => (viewMode = "list")}
						class="h-8 w-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer {viewMode === 'list' ? 'bg-white dark:bg-neutral-800 text-(--primary) shadow-xs' : 'text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70'}"
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

	<!-- 结果统计提示 -->
	<div class="flex items-center justify-between text-xs text-black/50 dark:text-white/50 px-1">
		<div>
			共找到 <span class="font-bold text-(--primary)">{filteredCourses.length}</span> 门课程
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

	<!-- 课程展示区 (Bento Grid 或 List 模式) -->
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
	{:else if viewMode === "bento"}
		<!-- Bento Grid 布局: 移动端与平板采用单列宽敞排布，大屏使用 lg:grid-cols-2 双列 -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			{#each filteredCourses as course (course.id)}
				<div class="card-base p-4 sm:p-5 rounded-2xl flex flex-col justify-between group transition-all duration-300 hover:shadow-lg hover:border-(--primary)/30 hover:-translate-y-1 relative overflow-hidden border border-black/5 dark:border-white/5 min-h-[170px]">
					<!-- 卡片右上角微妙装饰 -->
					<div class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-(--primary)/5 pointer-events-none transition-all group-hover:scale-150"></div>

					<!-- 卡片主体内容 -->
					<div class="flex flex-col gap-2.5">
						<!-- 顶部微标行 (Semester, Major, Category) -->
						<div class="flex items-center gap-1.5 flex-wrap text-xs">
							<span class="px-2 py-0.5 rounded-md font-medium border {getSemesterColor(course.semester)} shrink-0">
								{course.semester}
							</span>
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
							<a
								href={course.url}
								class="text-base sm:text-lg font-bold text-black/90 dark:text-white/90 group-hover:text-(--primary) transition-colors inline-flex items-center gap-1.5 max-w-full"
							>
								<span class="truncate">{course.title}</span>
								<svg class="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-(--primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
								</svg>
							</a>
							{#if course.titleEn}
								<div class="text-xs text-black/45 dark:text-white/45 font-medium mt-0.5 truncate">
									{course.titleEn}
								</div>
							{/if}
						</div>

						<!-- 课程简述 (2行截断) -->
						{#if course.description}
							<p class="text-xs sm:text-sm text-black/65 dark:text-white/65 line-clamp-2 leading-relaxed">
								{course.description}
							</p>
						{/if}
					</div>

					<!-- 卡片底部动作条 (Tags on left, GitHub link on right) -->
					<div class="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2 min-h-[34px]">
						<!-- 标签列表：至多显示前 2 个标签，多余标签不展示，禁止换行以保证整体美观 -->
						{#if course.tags.length > 0}
							<div class="flex items-center gap-1.5 flex-nowrap overflow-hidden min-w-0 mr-auto">
								{#each course.tags.slice(0, 2) as tag}
									<button
										onclick={() => (searchQuery = tag)}
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

						{#if course.repoUrl}
							<a
								href={course.repoUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="text-xs px-2.5 py-1 rounded-lg text-black/60 dark:text-white/60 hover:text-(--primary) hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5 shrink-0 ml-auto"
								title="查看 GitHub 课程资源仓库"
								aria-label="GitHub 课程资料仓库"
							>
								<svg class="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
									<path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
								</svg>
								<span>GitHub</span>
							</a>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<!-- 紧凑列表布局 (List Mode) -->
		<div class="flex flex-col gap-3">
			{#each filteredCourses as course (course.id)}
				<div class="card-base p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-(--primary)/30 transition-all border border-black/5 dark:border-white/5">
					<div class="flex items-start sm:items-center gap-3 min-w-0">
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2 flex-wrap">
								<a href={course.url} class="font-bold text-base text-black/90 dark:text-white/90 group-hover:text-(--primary) transition-colors truncate">
									{course.title}
								</a>
								<span class="text-xs px-1.5 py-0.2 rounded border {getSemesterColor(course.semester)} shrink-0">
									{course.semester}
								</span>
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
						{#if course.repoUrl}
							<a
								href={course.repoUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="text-xs px-2.5 py-1.5 rounded-lg text-black/60 dark:text-white/60 hover:text-(--primary) hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-1"
								title="查看 GitHub 课程资源仓库"
							>
								<svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
									<path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
								</svg>
								<span>GitHub</span>
							</a>
						{/if}
						<a
							href={course.url}
							class="text-xs px-3 py-1.5 rounded-lg bg-(--primary)/10 text-(--primary) font-medium hover:bg-(--primary) hover:text-white transition-all flex items-center gap-1"
						>
							进入课程
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</a>
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
</style>
