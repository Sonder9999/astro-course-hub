import { courseConfig } from "@/config/courseConfig";
import { getHierarchyNode } from "@/config/hierarchyConfig";
import { getSubjectMeta, subjectMetas } from "@/config/subjectConfig";
import type { CourseListItem } from "./course-utils";
import { url } from "./url-utils";

/**
 * 将学科体系与学期分组配置转换为 Firefly 课程列表项数据结构
 */
export function getCourseArchiveListData(): CourseListItem[] {
	const list: CourseListItem[] = [];
	let orderIndex = 1;

	// 遍历全部已配置的学科元数据，确保包含软工专设的高数、计组以及 TOEFL
	for (const subId of Object.keys(subjectMetas)) {
		const meta = getSubjectMeta(subId);
		const rawMajors =
			meta.majors && meta.majors.length > 0 ? meta.majors : ["cs"];

		// 将专业 ID 与全称同时纳入 major 数组，保证按 ID 或按名称筛选均能命中
		const resolvedMajors: string[] = [];
		for (const m of rawMajors) {
			resolvedMajors.push(m);
			const node = getHierarchyNode(m);
			if (node?.name && !resolvedMajors.includes(node.name)) {
				resolvedMajors.push(node.name);
			}
		}

		const semName = meta.semester || "专业核心课";

		list.push({
			id: subId,
			slug: subId,
			url: url(`/courses/${subId}/`),
			title: meta.name,
			titleEn: subId.replace(/[-_]/g, " "),
			code: `CS${String(orderIndex * 10).padStart(3, "0")}`,
			semester: semName,
			category: meta.category || "专业核心课",
			major: resolvedMajors,
			tags: [meta.category, semName].filter(Boolean),
			description: meta.description || "课程资料与知识图谱",
			credits: 3.5,
			hours: 48,
			instructors: [],
			prerequisites: [],
			difficulty: 3,
			repoUrl: meta.remoteRepo || courseConfig.repository.defaultRepoUrl,
			externalLinks: [],
			icon: meta.icon || "material-symbols:book-2-outline",
			image: meta.image || "",
			order: orderIndex++,
			updated: new Date().toISOString().split("T")[0],
		});
	}

	return list;
}
