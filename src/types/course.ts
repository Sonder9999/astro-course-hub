export type CourseExternalLink = {
	name: string;
	url: string;
	icon?: string;
};

export type CourseData = {
	title: string; // 课程名称, e.g. "数据结构与算法"
	titleEn?: string; // 英文名/简称, e.g. "Data Structures and Algorithms"
	code?: string; // 课程代码, e.g. "CS201"
	semester: string; // 开课学期, e.g. "大二上"
	category: string; // 课程类别, e.g. "专业核心课"
	tags: string[]; // 标签, e.g. ["必修", "含实验", "历年卷"]
	description?: string; // 课程速览/一句话评价
	credits?: number; // 学分, e.g. 4.0
	hours?: number; // 学时, e.g. 64
	instructors?: string[]; // 主讲/推荐教师
	prerequisites?: string[]; // 先修课程
	difficulty?: number; // 难度指数 (1-5)
	repoUrl?: string; // GitHub 课程仓库链接
	externalLinks?: CourseExternalLink[]; // 外部链接 (选课网/MOOC/精品课/云盘等)
	icon?: string; // 课程图标
	image?: string; // 封面图 (可选)
	order?: number; // 排序权重
	draft?: boolean;
	published?: Date;
	updated?: Date;
	comment?: boolean;
};

export type CourseSemesterConfig = {
	id: string; // e.g. "y1s1", "y1s2", "all"
	name: string; // e.g. "大一上"
	color: string; // Badge badge color / class
};

export type CourseCategoryConfig = {
	name: string;
	color?: string;
	description?: string;
};
