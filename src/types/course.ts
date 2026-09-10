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
	major: string | string[]; // 所属专业, e.g. "计算机科学与技术" 或 "公共课"
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

export type CourseMajorConfig = {
	id?: string;
	name: string;
	color?: string;
	badgeColor?: string;
	description?: string;
};

/**
 * 课程封面壁纸配置定义
 */
export interface CourseCoverConfig {
	api: string;
	randomOnRefresh: boolean;
}

/**
 * 递归目录树节点数据结构
 */
export interface TreeNode {
	name: string;
	path: string;
	isDirectory: boolean;
	size?: number;
	ext?: string;
	mtime?: string;
	children?: TreeNode[];
}

/**
 * 学科元数据定义（用于 3D 轮盘卡片及归档头信息）
 */
export interface SubjectMeta {
	id: string; // 文件夹名/学科ID
	name: string; // 中文显示名
	category: string; // 分类标签
	icon?: string; // 徽标或图标标识 (可选)
	gradient: string; // 渐变背景兜底
	image: string; // 视觉卡片配图
	description: string; // 课程简介
	semester?: string; // 对应开课学期

	// 远程仓库配置 (可选, 留空则视为纯本地学科)
	/** 远程 Git 仓库 URL (HTTPS), 留空则视为纯本地学科 */
	remoteRepo?: string;
	/** 远程仓库中的内容根目录, 默认 "/" 表示仓库根目录 */
	remoteRootDir?: string;
	/** 远程仓库的分支名, 默认 "main" */
	remoteBranch?: string;
	/** 拉取时排除的文件/目录名列表 */
	remoteExclude?: string[];
}

/**
 * 学期轮盘大组定义
 */
export interface SemesterGroup {
	id: string;
	name: string;
	enName: string;
	subTitle: string;
	themeColor: string;
	subjectIds: string[];
}

/**
 * 学科体系总配置
 */
export interface SubjectConfig {
	semesters: SemesterGroup[];
	subjects: Record<string, SubjectMeta>;
}
