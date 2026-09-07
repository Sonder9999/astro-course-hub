<script lang="ts">
import type {
	CourseCategoryConfig,
	CourseSemesterConfig,
} from "@/types/course";
import type { CourseListItem } from "@/utils/course-utils";

interface Props {
	courses: CourseListItem[];
	semesters: CourseSemesterConfig[];
	categories: CourseCategoryConfig[];
	featuredTags: string[];
}

let {
	courses = [],
	semesters = [],
	categories = [],
	featuredTags = [],
}: Props = $props();

// Svelte 5 响应式状态
let searchQuery = $state("");
let selectedSemester = $state("all");
let selectedCategory = $state("全部方向");
let selectedTag = $state("");
let sortBy = $state<"default" | "credits" | "difficulty" | "name">("default");
let viewMode = $state<"bento" | "list">("bento");

// 学期色标辅助函数
const getSemesterColor = (semName: string): string => {
	const found = semesters.find((s) => s.name === semName);
	return (
		found?.color ||
		"bg-neutral-500/10 text-neutral-600 dark:text-neutral-300 border-neutral-500/20"
	);
};

// 过滤与搜索派生状态
const filteredCourses = $derived.by(() => {
	const query = searchQuery.trim().toLowerCase();

	const list = courses.filter((c) => {
		// 1. 学期过滤
		if (selectedSemester !== "all" && c.semester !== selectedSemester) {
			return false;
		}

		// 2. 学科方向过滤
		if (selectedCategory !== "全部方向" && c.category !== selectedCategory) {
			return false;
		}

		// 3. 标签过滤
		if (selectedTag && !c.tags.includes(selectedTag)) {
			return false;
		}

		// 4. 搜索关键字过滤
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

			if (
				!matchTitle &&
				!matchTitleEn &&
				!matchCode &&
				!matchDesc &&
				!matchTags &&
				!matchInstructors &&
				!matchCategory &&
				!matchSemester
			) {
				return false;
			}
		}

		return true;
	});

	// 排序
	return list.slice().sort((a, b) => {
		if (sortBy === "credits") {
			return (b.credits || 0) - (a.credits || 0);
		}
		if (sortBy === "difficulty") {
			return (b.difficulty || 0) - (a.difficulty || 0);
		}
		if (sortBy === "name") {
			return a.title.localeCompare(b.title, "zh-CN");
		}
		return a.order - b.order;
	});
});

// 计算各学期符合条件的课程数
const getSemesterCourseCount = (semId: string, semName: string) => {
	if (semId === "all") return courses.length;
	return courses.filter((c) => c.semester === semName).length;
};

// 统计全局指标
const totalCredits = $derived(
	courses.reduce((sum, c) => sum + (c.credits || 0), 0),
);
const totalLinks = $derived(
	courses.reduce(
		(sum, c) => sum + (c.externalLinks?.length || 0) + (c.repoUrl ? 1 : 0),
		0,
	),
);

// 重置所有筛选
function resetFilters() {
	searchQuery = "";
	selectedSemester = "all";
	selectedCategory = "全部方向";
	selectedTag = "";
	sortBy = "default";
}
</script>

<div class="course-dashboard w-full flex flex-col gap-6">
	<!-- 顶部关键指标看板 (Overview Metrics) -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
		<div class="card-base p-4 rounded-xl flex items-center gap-3.5 transition-all hover:translate-y-[-2px]">
			<div class="w-10 h-10 rounded-lg bg-(--primary)/15 text-(--primary) flex items-center justify-center shrink-0">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
				</svg>
			</div>
			<div class="min-w-0">
				<div class="text-2xl font-black text-black/90 dark:text-white/90 leading-tight">{courses.length}</div>
				<div class="text-xs text-black/50 dark:text-white/50 truncate">已收录课程</div>
			</div>
		</div>

		<div class="card-base p-4 rounded-xl flex items-center gap-3.5 transition-all hover:translate-y-[-2px]">
			<div class="w-10 h-10 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
			</div>
			<div class="min-w-0">
				<div class="text-2xl font-black text-black/90 dark:text-white/90 leading-tight">{semesters.length - 1}</div>
				<div class="text-xs text-black/50 dark:text-white/50 truncate">覆盖开课学期</div>
			</div>
		</div>

		<div class="card-base p-4 rounded-xl flex items-center gap-3.5 transition-all hover:translate-y-[-2px]">
			<div class="w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
				</svg>
			</div>
			<div class="min-w-0">
				<div class="text-2xl font-black text-black/90 dark:text-white/90 leading-tight">{totalCredits}</div>
				<div class="text-xs text-black/50 dark:text-white/50 truncate">培养方案总学分</div>
			</div>
		</div>

		<div class="card-base p-4 rounded-xl flex items-center gap-3.5 transition-all hover:translate-y-[-2px]">
			<div class="w-10 h-10 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
				</svg>
			</div>
			<div class="min-w-0">
				<div class="text-2xl font-black text-black/90 dark:text-white/90 leading-tight">{totalLinks}</div>
				<div class="text-xs text-black/50 dark:text-white/50 truncate">开源资源链接</div>
			</div>
		</div>
	</div>

	<!-- 交互筛选与搜索主控板 (Filter Controls Card) -->
	<div class="card-base p-4 md:p-6 rounded-2xl flex flex-col gap-4">
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
					placeholder="实时搜索：课程名、英文名、课程代码 (如 CS201)、标签、教师..."
					class="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm bg-black/5 dark:bg-white/5 border border-transparent focus:border-(--primary) focus:bg-transparent outline-none transition-all text-black/90 dark:text-white/90 placeholder:text-black/40 dark:placeholder:text-white/40"
				/>
				{#if searchQuery}
					<button
						onclick={() => (searchQuery = "")}
						class="absolute inset-y-0 right-0 pr-3 flex items-center text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white transition-colors"
						aria-label="清空搜索"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				{/if}
			</div>

			<!-- 排序与布局按钮组 -->
			<div class="flex items-center gap-2 shrink-0">
				<!-- 排序选择 -->
				<select
					bind:value={sortBy}
					class="text-xs py-2.5 px-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-black/75 dark:text-white/75 outline-none cursor-pointer hover:border-(--primary) transition-colors"
				>
					<option value="default">默认推荐排序</option>
					<option value="credits">按学分从高到低</option>
					<option value="difficulty">按课程难度排序</option>
					<option value="name">按课程名称 A-Z</option>
				</select>

				<!-- 视图切换 (Bento / List) -->
				<div class="flex items-center rounded-xl bg-black/5 dark:bg-white/5 p-1 border border-black/5 dark:border-white/10">
					<button
						onclick={() => (viewMode = "bento")}
						class="p-1.5 rounded-lg transition-colors {viewMode === 'bento' ? 'bg-white dark:bg-neutral-800 text-(--primary) shadow-xs' : 'text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70'}"
						title="Bento Grid 网格视图"
						aria-label="Bento Grid 网格视图"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
						</svg>
					</button>
					<button
						onclick={() => (viewMode = "list")}
						class="p-1.5 rounded-lg transition-colors {viewMode === 'list' ? 'bg-white dark:bg-neutral-800 text-(--primary) shadow-xs' : 'text-black/40 dark:text-white/40 hover:text-black/70 dark:hover:text-white/70'}"
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

		<!-- 学期 Filter Tabs 胶囊横排 -->
		<div class="flex flex-col gap-1.5">
			<div class="text-xs font-semibold text-black/50 dark:text-white/50">开课学期</div>
			<div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
				{#each semesters as sem}
					{@const count = getSemesterCourseCount(sem.id, sem.name)}
					{@const active = (sem.id === "all" && selectedSemester === "all") || selectedSemester === sem.name}
					<button
						onclick={() => (selectedSemester = sem.id === "all" ? "all" : sem.name)}
						class="shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer flex items-center gap-1.5 border {active
							? 'bg-(--primary) text-white border-(--primary) shadow-sm'
							: 'bg-black/4 dark:bg-white/5 border-transparent text-black/70 dark:text-white/70 hover:bg-black/8 dark:hover:bg-white/10'}"
					>
						<span>{sem.name}</span>
						<span class="text-[10px] px-1.5 py-0.2 rounded-full {active ? 'bg-white/25 text-white' : 'bg-black/8 dark:bg-white/10 text-black/60 dark:text-white/60'}">
							{count}
						</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- 学科方向分类 Filter Chips -->
		<div class="flex flex-col gap-1.5">
			<div class="text-xs font-semibold text-black/50 dark:text-white/50">学科方向</div>
			<div class="flex flex-wrap items-center gap-2">
				{#each categories as cat}
					{@const active = selectedCategory === cat.name}
					<button
						onclick={() => (selectedCategory = cat.name)}
						class="text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer border {active
							? 'bg-(--primary)/15 text-(--primary) border-(--primary)/40 font-semibold'
							: 'bg-black/3 dark:bg-white/4 border-transparent text-black/65 dark:text-white/65 hover:bg-black/6 dark:hover:bg-white/8'}"
					>
						{cat.name}
					</button>
				{/each}
			</div>
		</div>

		<!-- 常用标签快速过滤 -->
		{#if featuredTags.length > 0}
			<div class="flex items-center gap-2 flex-wrap pt-1 border-t border-black/5 dark:border-white/5 text-xs">
				<span class="text-black/40 dark:text-white/40 flex items-center gap-1 shrink-0">
					<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
					</svg>
					常用标签：
				</span>
				{#each featuredTags as tag}
					<button
						onclick={() => (selectedTag = selectedTag === tag ? "" : tag)}
						class="cursor-pointer px-2 py-0.5 rounded-md transition-all text-xs {selectedTag === tag
							? 'bg-(--primary) text-white font-medium'
							: 'bg-black/5 dark:bg-white/5 text-black/60 dark:text-white/60 hover:text-(--primary)'}"
					>
						#{tag}
					</button>
				{/each}

				{#if selectedTag || selectedSemester !== "all" || selectedCategory !== "全部方向" || searchQuery}
					<button
						onclick={resetFilters}
						class="ml-auto text-xs text-(--primary) hover:underline flex items-center gap-1 cursor-pointer font-medium"
					>
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
						</svg>
						清空所有筛选
					</button>
				{/if}
			</div>
		{/if}
	</div>

	<!-- 结果统计提示 -->
	<div class="flex items-center justify-between text-xs text-black/50 dark:text-white/50 px-1">
		<div>
			共找到 <span class="font-bold text-(--primary)">{filteredCourses.length}</span> 门匹配课程
		</div>
		{#if selectedSemester !== "all" || selectedCategory !== "全部方向" || selectedTag}
			<div class="flex items-center gap-1.5 flex-wrap">
				<span>当前过滤：</span>
				{#if selectedSemester !== "all"}
					<span class="px-1.5 py-0.5 rounded-sm bg-(--primary)/10 text-(--primary)">{selectedSemester}</span>
				{/if}
				{#if selectedCategory !== "全部方向"}
					<span class="px-1.5 py-0.5 rounded-sm bg-(--primary)/10 text-(--primary)">{selectedCategory}</span>
				{/if}
				{#if selectedTag}
					<span class="px-1.5 py-0.5 rounded-sm bg-(--primary)/10 text-(--primary)">#{selectedTag}</span>
				{/if}
			</div>
		{/if}
	</div>

	<!-- 课程展示区 (Bento Grid 或 List 模式) -->
	{#if filteredCourses.length === 0}
		<!-- 空状态 -->
		<div class="card-base p-12 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
			<div class="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-black/30 dark:text-white/30">
				<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
			</div>
			<div class="text-base font-semibold text-black/75 dark:text-white/75">暂未找到符合条件的课程</div>
			<div class="text-xs text-black/45 dark:text-white/45 max-w-sm">
				可以尝试修改搜索关键词、重置学期或学科方向筛选，或者向开源项目提 PR 补充该课程资料！
			</div>
			<button
				onclick={resetFilters}
				class="mt-2 text-xs px-4 py-2 rounded-xl bg-(--primary) text-white font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
			>
				重置筛选条件
			</button>
		</div>
	{:else if viewMode === "bento"}
		<!-- Bento Grid 布局 -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			{#each filteredCourses as course (course.id)}
				<div class="card-base p-5 rounded-2xl flex flex-col justify-between group transition-all duration-300 hover:shadow-lg hover:border-(--primary)/30 hover:-translate-y-1 relative overflow-hidden border border-black/5 dark:border-white/5">
					<!-- 卡片右上角微妙装饰 -->
					<div class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-(--primary)/5 pointer-events-none transition-all group-hover:scale-150"></div>

					<!-- 卡片主体内容 -->
					<div class="flex flex-col gap-3">
						<!-- 顶部微标行 (Code, Semester, Category, Rating) -->
						<div class="flex items-center justify-between gap-2 flex-wrap text-xs">
							<div class="flex items-center gap-1.5 flex-wrap">
								{#if course.code}
									<span class="font-mono font-bold px-2 py-0.5 rounded-md bg-black/6 dark:bg-white/10 text-black/80 dark:text-white/80">
										{course.code}
									</span>
								{/if}
								<span class="px-2 py-0.5 rounded-md font-medium border {getSemesterColor(course.semester)}">
									{course.semester}
								</span>
								<span class="px-2 py-0.5 rounded-md bg-black/4 dark:bg-white/5 text-black/60 dark:text-white/60">
									{course.category}
								</span>
							</div>

							{#if course.difficulty}
								<div class="flex items-center gap-1 text-amber-500 font-semibold text-xs shrink-0" title="课程难度推荐指数">
									<svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
									</svg>
									<span>{course.difficulty}</span>
								</div>
							{/if}
						</div>

						<!-- 课程大标题与英文副标 -->
						<div>
							<a
								href={course.url}
								class="text-lg md:text-xl font-bold text-black/90 dark:text-white/90 group-hover:text-(--primary) transition-colors flex items-center gap-2"
							>
								<span>{course.title}</span>
								<svg class="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-(--primary)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
								</svg>
							</a>
							{#if course.titleEn}
								<div class="text-xs text-black/45 dark:text-white/45 font-medium mt-0.5 truncate">
									{course.titleEn}
								</div>
							{/if}
						</div>

						<!-- 学分、学时与授课老师信息 -->
						<div class="flex items-center gap-3 text-xs text-black/55 dark:text-white/55 flex-wrap">
							{#if course.credits}
								<span class="flex items-center gap-1">
									<svg class="w-3.5 h-3.5 text-black/40 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									{course.credits} 学分
									{#if course.hours}· {course.hours} 学时{/if}
								</span>
							{/if}

							{#if course.instructors && course.instructors.length > 0}
								<span class="flex items-center gap-1 truncate">
									<svg class="w-3.5 h-3.5 text-black/40 dark:text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
									{course.instructors.join(", ")}
								</span>
							{/if}

							{#if course.prerequisites && course.prerequisites.length > 0}
								<span class="text-black/40 dark:text-white/40 truncate">
									先修: {course.prerequisites.join("/")}
								</span>
							{/if}
						</div>

						<!-- 课程简述 (2行截断) -->
						{#if course.description}
							<p class="text-xs md:text-sm text-black/65 dark:text-white/65 line-clamp-2 leading-relaxed">
								{course.description}
							</p>
						{/if}

						<!-- 标签列表 -->
						{#if course.tags.length > 0}
							<div class="flex items-center gap-1.5 flex-wrap pt-1">
								{#each course.tags as tag}
									<button
										onclick={() => (selectedTag = tag)}
										class="text-[11px] px-2 py-0.5 rounded-md bg-black/4 dark:bg-white/5 text-black/60 dark:text-white/60 hover:text-(--primary) transition-colors cursor-pointer"
									>
										#{tag}
									</button>
								{/each}
							</div>
						{/if}
					</div>

					<!-- 卡片底部动作条 (Action Bar) -->
					<div class="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-2">
						<a
							href={course.url}
							class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-(--primary)/10 text-(--primary) hover:bg-(--primary) hover:text-white transition-all flex items-center gap-1.5 group/btn"
						>
							<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
							</svg>
							<span>阅读攻略指南</span>
						</a>

						<div class="flex items-center gap-1.5">
							{#if course.repoUrl}
								<a
									href={course.repoUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="text-xs p-1.5 rounded-lg text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
									title="查看 GitHub 课程资源仓库"
									aria-label="GitHub 课程资料仓库"
								>
									<svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
										<path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
									</svg>
								</a>
							{/if}

							{#if course.externalLinks && course.externalLinks.length > 0}
								<a
									href={course.externalLinks[0].url}
									target="_blank"
									rel="noopener noreferrer"
									class="text-xs px-2 py-1 rounded-lg text-black/60 dark:text-white/60 hover:text-(--primary) hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex items-center gap-1"
									title={course.externalLinks[0].name}
								>
									<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
									</svg>
									<span>{course.externalLinks[0].name}</span>
								</a>
							{/if}
						</div>
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
						{#if course.code}
							<span class="font-mono text-xs font-bold px-2 py-1 rounded-md bg-black/6 dark:bg-white/10 text-black/80 dark:text-white/80 shrink-0">
								{course.code}
							</span>
						{/if}
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2 flex-wrap">
								<a href={course.url} class="font-bold text-base text-black/90 dark:text-white/90 group-hover:text-(--primary) transition-colors truncate">
									{course.title}
								</a>
								<span class="text-xs px-1.5 py-0.2 rounded border {getSemesterColor(course.semester)} shrink-0">
									{course.semester}
								</span>
								<span class="text-xs px-1.5 py-0.2 rounded bg-black/4 dark:bg-white/5 text-black/60 dark:text-white/60 shrink-0">
									{course.category}
								</span>
							</div>
							{#if course.description}
								<div class="text-xs text-black/50 dark:text-white/50 truncate mt-0.5">
									{course.description}
								</div>
							{/if}
						</div>
					</div>

					<div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
						{#if course.credits}
							<span class="text-xs text-black/45 dark:text-white/45">
								{course.credits}学分
							</span>
						{/if}
						<a
							href={course.url}
							class="text-xs px-3 py-1.5 rounded-lg bg-(--primary)/10 text-(--primary) font-medium hover:bg-(--primary) hover:text-white transition-all flex items-center gap-1"
						>
							详情
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
/* 隐藏原生横向滚动条但保留滑动 */
.no-scrollbar::-webkit-scrollbar {
	display: none;
}
.no-scrollbar {
	-ms-overflow-style: none;
	scrollbar-width: none;
}
</style>
