import { type CollectionEntry, getCollection } from "astro:content";
import { courseConfig } from "@/config/courseConfig";
import { url } from "@/utils/url-utils";

export type CourseEntry = CollectionEntry<"courses">;

export type CourseListItem = {
	id: string;
	slug: string;
	url: string;
	title: string;
	titleEn: string;
	code: string;
	semester: string;
	category: string;
	major: string | string[];
	tags: string[];
	description: string;
	credits?: number;
	hours?: number;
	instructors: string[];
	prerequisites: string[];
	difficulty?: number;
	repoUrl: string;
	externalLinks: { name: string; url: string; icon?: string }[];
	icon: string;
	image: string;
	order: number;
	updated?: string;
};

// 学期排序权重辅助表
const SEMESTER_ORDER_MAP = new Map<string, number>(
	courseConfig.semesters.map((s, index) => [s.name, index]),
);

function getSemesterWeight(semester: string): number {
	return SEMESTER_ORDER_MAP.get(semester) ?? 999;
}

/**
 * 获取所有课程并进行排序
 * 默认排序规则：学期先后 -> 自定义 order 权重 -> 课程代码 -> 标题
 */
export async function getSortedCourses(): Promise<CourseEntry[]> {
	const allCourses = await getCollection("courses", ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});

	return allCourses.sort((a, b) => {
		// 1. 学期先后
		const semDiff =
			getSemesterWeight(a.data.semester) - getSemesterWeight(b.data.semester);
		if (semDiff !== 0) return semDiff;

		// 2. 自定义 order
		const orderA = a.data.order ?? 100;
		const orderB = b.data.order ?? 100;
		if (orderA !== orderB) return orderA - orderB;

		// 3. 课程代码
		const codeA = a.data.code ?? "";
		const codeB = b.data.code ?? "";
		if (codeA && codeB && codeA !== codeB) return codeA.localeCompare(codeB);

		// 4. 标题字母
		return a.data.title.localeCompare(b.data.title);
	});
}

/**
 * 获取可用于客户端序列化的轻量课程列表数据
 */
export async function getCourseListData(): Promise<CourseListItem[]> {
	const sorted = await getSortedCourses();
	return sorted.map((c) => {
		const slug = c.id.replace(/\.(md|mdx)$/i, "");
		return {
			id: c.id,
			slug,
			url: url(`/courses/${slug}/`),
			title: c.data.title,
			titleEn: c.data.titleEn || "",
			code: c.data.code || "",
			semester: c.data.semester,
			category: c.data.category,
			major: c.data.major || "公共课",
			tags: c.data.tags || [],
			description: c.data.description || "",
			credits: c.data.credits,
			hours: c.data.hours,
			instructors: c.data.instructors || [],
			prerequisites: c.data.prerequisites || [],
			difficulty: c.data.difficulty,
			repoUrl: c.data.repoUrl || "",
			externalLinks: c.data.externalLinks || [],
			icon: c.data.icon || "material-symbols:book-2-outline",
			image: c.data.image || "",
			order: c.data.order ?? 100,
			updated: c.data.updated
				? c.data.updated.toISOString().split("T")[0]
				: undefined,
		};
	});
}

export type CountItem = {
	name: string;
	count: number;
	url?: string;
};

/**
 * 获取所有学期及其课程统计
 */
export async function getCourseSemesters(): Promise<CountItem[]> {
	const courses = await getSortedCourses();
	const countMap = new Map<string, number>();

	for (const c of courses) {
		const sem = c.data.semester;
		countMap.set(sem, (countMap.get(sem) || 0) + 1);
	}

	return courseConfig.semesters
		.filter((s) => s.id !== "all")
		.map((s) => ({
			name: s.name,
			count: countMap.get(s.name) || 0,
		}));
}

/**
 * 获取所有学科方向分类及数量
 */
export async function getCourseCategories(): Promise<CountItem[]> {
	const courses = await getSortedCourses();
	const countMap = new Map<string, number>();

	for (const c of courses) {
		const cat = c.data.category;
		if (cat) {
			countMap.set(cat, (countMap.get(cat) || 0) + 1);
		}
	}

	const result: CountItem[] = [];
	for (const [name, count] of countMap.entries()) {
		result.push({ name, count });
	}

	return result.sort(
		(a, b) => b.count - a.count || a.name.localeCompare(b.name),
	);
}

/**
 * 获取所有培养专业/学科分类及其课程统计
 * 规则：完全从实际 markdown 课程数据动态提取（同博客分类模式一致）；
 * 仅保留实际课程数 > 0 的学科/专业；若某学科没有课程，则不显示；
 * 如果存在“公共课”，优先置前；配置文件中声明的专业（若有实际课程）优先按配置顺序排；其余动态学科按数量降序排
 */
export async function getCourseMajors(): Promise<CountItem[]> {
	const courses = await getSortedCourses();
	const countMap = new Map<string, number>();

	for (const c of courses) {
		const rawMajor = c.data.major;
		const majors = Array.isArray(rawMajor) ? rawMajor : [rawMajor || "公共课"];
		for (const m of majors) {
			const trimmed = typeof m === "string" ? m.trim() : String(m).trim();
			if (trimmed) {
				countMap.set(trimmed, (countMap.get(trimmed) || 0) + 1);
			}
		}
	}

	const result: CountItem[] = [];

	// 若存在“公共课”且数量 > 0，优先排第一位
	const publicCount = countMap.get("公共课");
	if (publicCount && publicCount > 0) {
		result.push({
			name: "公共课",
			count: publicCount,
		});
		countMap.delete("公共课");
	}

	// 如果配置文件中定义了排序偏好，仅对实际存在课程（count > 0）的专业按配置顺序优先排
	const configuredMajors = (courseConfig.majors || []).map((m) => m.name);
	for (const name of configuredMajors) {
		const count = countMap.get(name);
		if (count && count > 0) {
			result.push({ name, count });
			countMap.delete(name);
		}
	}

	// 其余完全从 markdown 动态提取出的学科按课程数量降序排，数量相同按名称排序
	const remaining: CountItem[] = [];
	for (const [name, count] of countMap.entries()) {
		if (count > 0) {
			remaining.push({ name, count });
		}
	}
	remaining.sort(
		(a, b) => b.count - a.count || a.name.localeCompare(b.name, "zh-CN"),
	);

	return [...result, ...remaining];
}

/**
 * 获取所有课程标签及数量
 */
export async function getCourseTags(): Promise<CountItem[]> {
	const courses = await getSortedCourses();
	const countMap = new Map<string, number>();

	for (const c of courses) {
		for (const tag of c.data.tags || []) {
			countMap.set(tag, (countMap.get(tag) || 0) + 1);
		}
	}

	const result: CountItem[] = [];
	for (const [name, count] of countMap.entries()) {
		result.push({ name, count });
	}

	return result.sort(
		(a, b) => b.count - a.count || a.name.localeCompare(b.name),
	);
}

/**
 * 获取相关课程推荐（同学期、同专业或同分类）
 */
export async function getRelatedCourses(
	current: CourseEntry,
	limit = 4,
): Promise<CourseEntry[]> {
	const all = await getSortedCourses();
	const currentMajors: string[] = Array.isArray(current.data.major)
		? current.data.major
		: [current.data.major || "公共课"];

	return all
		.filter((c) => c.id !== current.id)
		.map((c) => {
			let score = 0;
			if (c.data.semester === current.data.semester) score += 3;
			const cMajors: string[] = Array.isArray(c.data.major)
				? c.data.major
				: [c.data.major || "公共课"];
			if (cMajors.some((m: string) => currentMajors.includes(m))) score += 2.5;
			if (c.data.category === current.data.category) score += 2;
			const sharedTags = (c.data.tags || []).filter((t) =>
				(current.data.tags || []).includes(t),
			);
			score += sharedTags.length;
			return { course: c, score };
		})
		.filter((item) => item.score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit)
		.map((item) => item.course);
}
