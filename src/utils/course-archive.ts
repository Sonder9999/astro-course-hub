import { courseConfig } from "@/config/courseConfig";
import { getSubjectMeta, semesterGroups } from "@/config/subjectConfig";
import type { CourseListItem } from "./course-utils";
import { url } from "./url-utils";

/**
 * 将学科体系与学期分组配置转换为 Firefly 课程列表项数据结构
 */
export function getCourseArchiveListData(): CourseListItem[] {
	const list: CourseListItem[] = [];
	let orderIndex = 1;

	for (const sem of semesterGroups) {
		const semName = sem.name.split("·")[0].trim(); // e.g. "大一上"

		for (const subId of sem.subjectIds) {
			const meta = getSubjectMeta(subId);
			list.push({
				id: subId,
				slug: subId,
				url: url(`/courses/${subId}/`),
				title: meta.name,
				titleEn: subId.replace(/[-_]/g, " "),
				code: `CS${String(orderIndex * 10).padStart(3, "0")}`,
				semester: semName,
				category: meta.category || "专业核心课",
				major: ["计算机科学与技术"],
				tags: [meta.category, semName].filter(Boolean),
				description: meta.description || "课程资料与知识图谱",
				credits: 3.5,
				hours: 48,
				instructors: [],
				prerequisites: [],
				difficulty: 3,
				repoUrl: courseConfig.repository.defaultRepoUrl,
				externalLinks: [],
				icon: meta.icon || "material-symbols:book-2-outline",
				image: meta.image || "",
				order: orderIndex++,
				updated: new Date().toISOString().split("T")[0],
			});
		}
	}

	return list;
}
