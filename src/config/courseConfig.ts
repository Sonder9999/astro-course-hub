import type {
	CourseCategoryConfig,
	CourseMajorConfig,
	CourseSemesterConfig,
} from "@/types/course";

export interface CourseSiteConfig {
	// 学期选项列表（用于首页筛选和归档分类）
	semesters: CourseSemesterConfig[];
	// 培养专业分类列表（用于分类栏及方向面板）
	majors: CourseMajorConfig[];
	// 学科/课程性质分类列表
	categories: CourseCategoryConfig[];
	// 快捷标签推荐（用于筛选栏快捷点击）
	featuredTags: string[];
	// 默认排序方式：'semester' | 'code' | 'title' | 'credits'
	defaultSort: "semester" | "code" | "title" | "credits";
	// 是否显示课程难度/星级
	showDifficulty: boolean;
	// 是否在卡片上显示外部资源快速链接
	showQuickLinks: boolean;
	// 资源仓库与贡献配置（通用指引）
	repository: {
		defaultRepoUrl: string; // 默认课程资料总仓库
		contributionUrl: string; // 贡献指引页面路径或外链
	};
}

export const courseConfig: CourseSiteConfig = {
	semesters: [
		{
			id: "all",
			name: "全部学期",
			color:
				"bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 border-neutral-500/20",
		},
		{
			id: "y1s1",
			name: "大一上",
			color:
				"bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
		},
		{
			id: "y1s2",
			name: "大一下",
			color:
				"bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
		},
		{
			id: "y2s1",
			name: "大二上",
			color: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
		},
		{
			id: "y2s2",
			name: "大二下",
			color:
				"bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30",
		},
		{
			id: "y3s1",
			name: "大三上",
			color:
				"bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
		},
		{
			id: "y3s2",
			name: "大三下",
			color:
				"bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
		},
		{
			id: "y4",
			name: "大四",
			color:
				"bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
		},
		{
			id: "general",
			name: "通识选修",
			color:
				"bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
		},
	],
	majors: [
		{
			name: "公共课",
			description: "全校通识必修、数学物理等公共基础课",
			color:
				"bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30",
		},
		{
			name: "计算机科学与技术",
			description: "计算机科学理论、系统结构与核心软件",
			color: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
		},
		{
			name: "人工智能",
			description: "智能系统、前沿机器学习与数据算法",
			color:
				"bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
		},
		{
			name: "软件工程",
			description: "大型工程架构、系统工程化开发与测试",
			color:
				"bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30",
		},
	],
	categories: [
		{ name: "全部方向" },
		{ name: "学科基础课", description: "数学、物理与跨专业大类基础" },
		{ name: "专业核心课", description: "本专业骨干必修主干课程" },
		{ name: "专业选修课", description: "细分领域进阶选修方向" },
		{ name: "通识教育课", description: "人文社科与通用科学素养" },
		{ name: "实践与实验", description: "课程设计、大型实验与工程实训" },
	],
	featuredTags: [
		"必修",
		"专业核心",
		"含实验",
		"历年试卷",
		"课程设计",
		"考研重点",
	],
	defaultSort: "semester",
	showDifficulty: true,
	showQuickLinks: true,
	repository: {
		defaultRepoUrl: "https://github.com/example-univ/course-resources",
		contributionUrl: "/about/",
	},
};
