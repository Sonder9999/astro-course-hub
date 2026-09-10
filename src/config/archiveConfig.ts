/**
 * 学科归档与文件展示配置文件
 * Subject Archive & Document Tree Configuration
 *
 * 在此文件中可自由调整目录显示开关、复合子目录阈值，以及灵活扩展文件类型与后缀映射。
 */

export interface FileTypeFilterItem {
	/** 分类唯一标识 (例如 'md', 'pdf', 'ppt', 'text', 'other') */
	id: string;
	/** 前端筛选胶囊展示的标签名称 (例如 'md', 'pdf', 'ppt', '文本文件', '其他') */
	label: string;
	/** 首次进入页面时默认是否勾选激活 (默认 md 为 true，其余为 false) */
	defaultChecked?: boolean;
	/**
	 * 映射的文件拓展名：
	 * 支持单个字符串如 'md' 或数组如 ['txt', 'text', 'doc', 'docx']
	 * 匹配时不区分大小写，带点或不带点（如 'pdf' 与 '.pdf' 均能自动识别）
	 */
	exts?: string | string[];
	/** 是否作为未匹配任何具体扩展名时的兜底分类 (如 '其他') */
	isOther?: boolean;
}

export interface ArchiveDisplayConfig {
	/** 是否显示文件序号 (01, 02...) */
	showOrder: boolean;
	/** 是否显示文件修改日期 (如 09-04) */
	showDate: boolean;
	/** 是否显示复合子目录路径徽章 (如 lab01) */
	showPathBadge: boolean;
	/** 是否显示文件扩展名徽章 (#MD, #PDF...) */
	showExt: boolean;
	/** 是否显示文件大小徽章 (#1.2KB) */
	showSize: boolean;
	/** 复合子目录平铺/折叠阈值：子目录文件数 > 此值时默认折叠；<= 此值时直接平铺展示 */
	subfolderThreshold: number;
}

/**
 * 界面显示控制配置
 */
export const archiveDisplayConfig: ArchiveDisplayConfig = {
	showOrder: true,
	showDate: true,
	showPathBadge: true,
	showExt: false,
	showSize: true,
	subfolderThreshold: 5,
};

/**
 * 文件类型筛选与拓展名映射配置
 *
 * 拓展新类型极简方便：直接在此数组添加即可，例如：
 *   { id: "code", label: "代码", defaultChecked: false, exts: ["c", "cpp", "py", "java", "rs"] }
 */
export const archiveFileTypeConfig: FileTypeFilterItem[] = [
	{
		id: "md",
		label: "md",
		defaultChecked: true,
		exts: ["md", "markdown"],
	},
	{
		id: "pdf",
		label: "pdf",
		defaultChecked: false,
		exts: ["pdf"],
	},
	{
		id: "ppt",
		label: "ppt",
		defaultChecked: false,
		exts: ["ppt", "pptx"],
	},
	{
		id: "text",
		label: "文本文件",
		defaultChecked: false,
		exts: ["txt", "text", "doc", "docx", "wps", "rtf", "log"],
	},
	{
		id: "other",
		label: "其他",
		defaultChecked: false,
		isOther: true,
	},
];

/**
 * 课程知识库归档系统总配置
 */
export interface CourseArchiveConfig {
	/**
	 * 外部课程归档扫描根目录
	 * 优先读取环境变量 COURSE_ARCHIVE_DIR，未设置时兜底为本地目录
	 */
	contentDir: string;
	/**
	 * 静态媒体与附件资源的前端请求路径前缀
	 * 默认 "/course-assets"
	 */
	assetsPrefix: string;
	/**
	 * 课程接口 API 请求前缀
	 * 默认 "/api/course"
	 */
	apiPrefix: string;
	/**
	 * 页面展示控制参数
	 */
	display: ArchiveDisplayConfig;
	/**
	 * 文件类型胶囊与筛选配置
	 */
	fileTypes: FileTypeFilterItem[];
}

/**
 * 课程知识库归档系统默认配置
 */
export const courseArchiveConfig: CourseArchiveConfig = {
	contentDir:
		(typeof process !== "undefined" && process.env?.COURSE_ARCHIVE_DIR) ||
		(typeof import.meta !== "undefined" &&
			(import.meta as unknown as { env?: Record<string, string> }).env
				?.COURSE_ARCHIVE_DIR) ||
		"./src/content/courses",
	assetsPrefix: "/course-assets",
	apiPrefix: "/api/course",
	display: archiveDisplayConfig,
	fileTypes: archiveFileTypeConfig,
};
