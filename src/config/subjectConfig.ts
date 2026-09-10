import type {
	CourseCoverConfig,
	SemesterGroup,
	SubjectConfig,
	SubjectMeta,
} from "@/types/course";

/**
 * 课程二次元封面壁纸 API 配置
 *
 * 【一、 本项目使用的核心 API：Alcy 随机二次元壁纸】
 * - PC 横屏壁纸（本项目使用）：https://t.alcy.cc/pc （适合电脑桌面壁纸、横版卡片、封面）
 * - 手机竖屏壁纸：https://t.alcy.cc/mp （适合移动端全屏背景、竖版卡片）
 * - 正方形头像：https://t.alcy.cc/tx （适合用户头像、小图标占位）
 * - 智能自适应：https://t.alcy.cc/ycy （根据访问设备自动识别返回横屏或竖屏）
 * - JSON 格式端点：https://t.alcy.cc/pc?json （用于异步 fetch 获取宽高或直链）
 *
 * 【二、 适合日后项目备用的其他高质量二次元 API】
 * 1. 韩小韩 Web API (二次元/风景/动漫分类)
 *    - 直出接口：https://api.vvhan.com/api/wallpaper/acg
 *    - JSON 接口：https://api.vvhan.com/api/wallpaper/acg?type=json
 *    - 特点：国内节点，加载速度极快，画质稳定在 1080P/2K。
 *
 * 2. 搏天 API（随机动漫壁纸）
 *    - 接口地址：https://api.btstu.cn/sjbz/api.php?lx=dongman&format=images
 *    - 特点：支持参数筛选分类（dongman 为动漫，meizi 为人物，fengjing 为风景）。
 *
 * 3. Waifu.pics（国际主流动漫插画 API）
 *    - 接口地址：https://api.waifu.pics/sfw/waifu
 *    - 返回格式：JSON，形如 {"url": "https://i.waifu.pics/xxxx.jpg"}
 *    - 特点：涵盖 Pixiv、知名动漫番剧的高清原画，适合通过前端 fetch() 动态获取插画并在渲染前做骨架屏加载。
 */
export const courseCoverConfig: CourseCoverConfig = {
	// 默认 API 端点
	api: "https://t.alcy.cc/pc",
	// 刷新模式开关：
	// true (默认): 每次刷新都不一样（每次进入/刷新页面时获取动态随机壁纸）
	// false: 读取缓存固定照片（利用 ?id=${courseId} 种子参数锁定单门课程固定壁纸，防止每次刷新闪烁变幻）
	randomOnRefresh: true,
};

/**
 * 根据课程 ID 生成对应的封面图 URL
 * @param courseId 课程标识/目录名
 * @param refreshSeed 可选的客户端刷新戳（在 randomOnRefresh 为 true 时用于确保跨刷新重拉取）
 */
export function getCourseCover(
	courseId: string,
	refreshSeed?: string | number,
): string {
	const base = courseCoverConfig.api;
	if (!courseCoverConfig.randomOnRefresh) {
		// 模式：固定照片（利用 ?id 参数锁定种子及浏览器/CDN缓存）
		return `${base}?id=${encodeURIComponent(courseId)}`;
	}
	// 模式：每次刷新都不一样（附带课程 id 保证同屏卡片互异，同时附加刷新时间戳保证每次刷新图片更换）
	if (refreshSeed) {
		return `${base}?id=${encodeURIComponent(courseId)}&_t=${refreshSeed}`;
	}
	return `${base}?id=${encodeURIComponent(courseId)}`;
}

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
		subjectIds: ["Computer-Ethics", "Discrete-Mathematics"],
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
		image: getCourseCover("sample-course-1"),
		description:
			"这是示例课程一的描述，请在 src/config/subjectConfig.ts 中自定义配置。",
	},
	"sample-course-2": {
		id: "sample-course-2",
		name: "示例课程二",
		category: "专业核心",
		gradient: "linear-gradient(135deg, #065f46, #059669, #047857)",
		image: getCourseCover("sample-course-2"),
		description: "这是示例课程二的描述，支持自定义分类、图标与封面图。",
	},
	"sample-course-3": {
		id: "sample-course-3",
		name: "示例课程三",
		category: "专业选修",
		gradient: "linear-gradient(135deg, #9a3412, #ea580c, #c2410c)",
		image: getCourseCover("sample-course-3"),
		description: "这是示例课程三的描述，可在该配置文件中自由添加新课程。",
	},
	"Computer-Ethics": {
		id: "Computer-Ethics",
		name: "计算机伦理学",
		category: "通识教育课",
		gradient: "linear-gradient(135deg, #7c3aed, #a78bfa, #6d28d9)",
		image: getCourseCover("Computer-Ethics"),
		description: "计算机伦理学课程讨论、课件与论文资料",
		remoteRepo: "https://github.com/Henu-Kaguya/Computer-Ethics.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},
	"Discrete-Mathematics": {
		id: "Discrete-Mathematics",
		name: "离散数学",
		category: "学科基础课",
		gradient: "linear-gradient(135deg, #0369a1, #38bdf8, #0284c7)",
		image: getCourseCover("Discrete-Mathematics"),
		description: "离散数学课程笔记、历年考卷与练习",
		remoteRepo: "https://github.com/Henu-Kaguya/Discrete-Mathematics.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
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
			image: subjectMetas[dirName].image || getCourseCover(dirName),
			semester: subjectMetas[dirName].semester || semester,
		};
	}

	// 自动兜底生成
	return {
		id: dirName,
		name: dirName.replace(/[-_]/g, " "),
		category: "专业课",
		gradient: "linear-gradient(135deg, #374151, #4b5563, #1f2937)",
		image: getCourseCover(dirName),
		description: "课程笔记、资料与指导文档",
		semester,
	};
}
