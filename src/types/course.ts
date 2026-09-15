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
	collegeId?: string;
	color?: string;
	badgeColor?: string;
	description?: string;
	isStandalone?: boolean;
};

/**
 * 通用层级节点定义（支持学院、专业、独立无挂载实体）
 */
export interface HierarchyNode {
	id: string; // 唯一标识，如 "cs-college", "se-college", "toefl", "cs", "se"
	name: string; // 显示名称，如 "计算机与信息工程学院", "软件工程学院", "TOEFL"
	level: "college" | "major"; // 节点层级
	parentId?: string; // 父节点 ID (留空表示顶层根节点或独立无挂载)
	shortName?: string;
	description?: string;
	color?: string; // 主题色
	badge?: string; // 角标徽章，如 "语言认证", "核心学院"
	icon?: string;
	image?: string;
	order?: number;
}

/**
 * 3D 轮盘通用卡片数据项定义（解耦 Carousel3D，支持学院、专业、学期轮盘）
 */
export interface CarouselCardItem {
	id: string; // 唯一标识 (例如 "cs-college", "cs", "y1s1")
	name: string; // 主标题
	enName?: string; // 英文副标题
	subTitle?: string; // 详细副标题/简介
	themeColor: string; // 主题颜色
	image?: string; // 卡片壁纸
	badge?: string; // 徽标角标 (如 "12门课程")
	url?: string; // 点击跳转路径
	children?: Array<{
		id: string;
		name: string;
		category?: string;
		description?: string;
		image?: string;
		badge?: string;
		url?: string;
	}>;
}

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
	majors?: string[]; // 关联的专业 ID 列表，例如 ["cs", "se"]
	icon?: string; // 徽标或图标标识 (可选)
	gradient: string; // 渐变背景兜底
	image: string; // 视觉卡片配图
	description: string; // 课程简介
	semester?: string; // 对应开课学期
	semestersByMajor?: Record<string, string>; // 针对不同专业可能不同的学期归属

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
