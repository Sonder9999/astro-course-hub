import type { SemesterGroup, SubjectConfig, SubjectMeta } from "@/types/course";

/**
 * 学期轮盘大组配置模板 (Semester Groups Template)
 *
 * 您可在此自定义学期划分（如大一上至大三下），设置各学期主题色以及包含的课程标识 (subjectIds)。
 * 轮盘将依照此处的顺序进行 3D 环形渲染。
 */
export const semesterGroups: SemesterGroup[] = [
	{
		id: "y1s1",
		name: "大一上",
		enName: "Year 1 Fall",
		subTitle: "大学通识与学科基础",
		themeColor: "#3b82f6",
		subjectIds: ["sample-course-1", "sample-course-2"],
	},
	{
		id: "y1s2",
		name: "大一下",
		enName: "Year 1 Spring",
		subTitle: "核心基础与程序设计",
		themeColor: "#06b6d4",
		subjectIds: ["sample-course-3"],
	},
	{
		id: "y2s1",
		name: "大二上",
		enName: "Year 2 Fall",
		subTitle: "专业主干与核心理论",
		themeColor: "#f59e0b",
		subjectIds: [],
	},
	{
		id: "y2s2",
		name: "大二下",
		enName: "Year 2 Spring",
		subTitle: "系统工程与专业进阶",
		themeColor: "#10b981",
		subjectIds: [],
	},
	{
		id: "y3s1",
		name: "大三上",
		enName: "Year 3 Fall",
		subTitle: "高级架构与综合实训",
		themeColor: "#8b5cf6",
		subjectIds: [],
	},
	{
		id: "y3s2",
		name: "大三下",
		enName: "Year 3 Spring",
		subTitle: "前沿选修与方向拓展",
		themeColor: "#ec4899",
		subjectIds: [],
	},
];

/**
 * 学科/课程元数据配置模板 (Subject Metadata Template)
 *
 * 您可在此为各个课程配置展示名称、分类标签、图标、背景渐变、卡片封面图与简短介绍。
 * 键名（Key）应与 semesterGroups 中的 subjectIds 或课程文件夹名对应。
 */
export const subjectMetas: Record<string, SubjectMeta> = {
	"sample-course-1": {
		id: "sample-course-1",
		name: "示例课程一",
		category: "通识必修",
		gradient: "linear-gradient(135deg, #1e3a8a, #3b82f6, #1d4ed8)",
		image:
			"https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80",
		description:
			"这是示例课程一的描述，请在 src/config/subjectConfig.ts 中自定义配置。",
	},
	"sample-course-2": {
		id: "sample-course-2",
		name: "示例课程二",
		category: "专业核心",
		gradient: "linear-gradient(135deg, #065f46, #059669, #047857)",
		image:
			"https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
		description: "这是示例课程二的描述，支持自定义分类、图标与封面图。",
	},
	"sample-course-3": {
		id: "sample-course-3",
		name: "示例课程三",
		category: "专业选修",
		gradient: "linear-gradient(135deg, #9a3412, #ea580c, #c2410c)",
		image:
			"https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
		description: "这是示例课程三的描述，可在该配置文件中自由添加新课程。",
	},
};

/**
 * 完整学科体系配置主体
 */
export const subjectConfig: SubjectConfig = {
	semesters: semesterGroups,
	subjects: subjectMetas,
};

/**
 * 兼容性别名导出
 */
export const SEMESTER_GROUPS: SemesterGroup[] = semesterGroups;
export const SUBJECT_METAS: Record<string, SubjectMeta> = subjectMetas;

/**
 * 根据学科标识/文件夹名称获取学科元数据
 * 若在 subjectMetas 中定义了显式配置则读取配置，
 * 若未配置，则自动依据名称生成优雅的兜底元数据，保证开箱即用。
 */
export function getSubjectMeta(dirName: string): SubjectMeta {
	const group = semesterGroups.find((g) => g.subjectIds.includes(dirName));
	const semester = group ? group.name.split("·")[0].trim() : undefined;

	if (subjectMetas[dirName]) {
		return {
			...subjectMetas[dirName],
			semester: subjectMetas[dirName].semester || semester,
		};
	}

	// 自动兜底生成
	return {
		id: dirName,
		name: dirName.replace(/[-_]/g, " "),
		category: "专业课",
		gradient: "linear-gradient(135deg, #374151, #4b5563, #1f2937)",
		image:
			"https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
		description: "课程笔记、资料与指导文档",
		semester,
	};
}
