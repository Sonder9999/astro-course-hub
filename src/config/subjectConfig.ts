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
	randomOnRefresh: false,
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
		id: "overview",
		name: "专业总览",
		enName: "Overview",
		subTitle: "培养方案与学习指南",
		themeColor: "#6366f1",
		subjectIds: ["Henu-Kaguya"],
	},
	{
		id: "y1s1",
		name: "大一上",
		enName: "Year 1 Fall",
		subTitle: "大学通识与学科基础",
		themeColor: "#3b82f6",
		subjectIds: [
			"Introduction-to-Computer-Science",
			"C-Primer-Plus-Programming",
			"Computational-Thinking-and-Innovation",
		],
	},
	{
		id: "y1s2",
		name: "大一下",
		enName: "Year 1 Spring",
		subTitle: "核心基础与程序设计",
		themeColor: "#06b6d4",
		subjectIds: ["Basic-Circuit-and-Electronics"],
	},
	{
		id: "y2s1",
		name: "大二上",
		enName: "Year 2 Fall",
		subTitle: "专业主干与核心理论",
		themeColor: "#f59e0b",
		subjectIds: [
			"Experiment-of-Logic-Design",
			"Logic-Design",
			"Discrete-Mathematics",
			"CSharp-Programing",
			"Introduction-to-Computer-Systems",
		],
	},
	{
		id: "y2s2",
		name: "大二下",
		enName: "Year 2 Spring",
		subTitle: "系统工程与专业进阶",
		themeColor: "#10b981",
		subjectIds: [
			"Operational-Research",
			"Principles-of-Computer-Organization",
			"Algorithmic-Design-and-Analysis",
			"CSharp-Network-Application-Programming",
			"Digital-Image-Processing",
		],
	},
	{
		id: "y3s1",
		name: "大三上",
		enName: "Year 3 Fall",
		subTitle: "高级架构与综合实训",
		themeColor: "#8b5cf6",
		subjectIds: [
			"Computer-Network",
			"Software-Engineering",
			"Database-Principles",
			"Operating-System",
			"Machine-Learning",
			"Computer-Architecture",
		],
	},
	{
		id: "y3s2",
		name: "大三下",
		enName: "Year 3 Spring",
		subTitle: "前沿选修与方向拓展",
		themeColor: "#ec4899",
		subjectIds: [
			"Compiler-Principles",
			"Natural-Language-Processing",
			"Computer-Ethics",
			"Computer-Graphics",
			"CS-Small-Term",
		],
	},
];

/**
 * 学科/课程元数据配置模板 (Subject Metadata Template)
 *
 * 您可在此为各个课程配置展示名称、分类标签、图标、背景渐变、卡片封面图与简短介绍。
 * 键名（Key）应与 semesterGroups 中的 subjectIds 或课程文件夹名对应。
 */
export const subjectMetas: Record<string, SubjectMeta> = {
	// --- 专业总览 (Overview) ---
	"Henu-Kaguya": {
		id: "Henu-Kaguya",
		name: "专业总览",
		category: "专业总览",
		gradient: "linear-gradient(135deg, #4f46e5, #6366f1, #818cf8)",
		image: getCourseCover("Henu-Kaguya"),
		description: "河南大学计算机科学与技术专业课程资料及学习指南合集 (HENU-CS)",
		remoteRepo: "https://github.com/Henu-Kaguya/Henu-Kaguya.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},

	// --- 第一学年 第一学期（大一上） ---
	"Introduction-to-Computer-Science": {
		id: "Introduction-to-Computer-Science",
		name: "计算机科学导论",
		category: "学科基础课",
		gradient: "linear-gradient(135deg, #0284c7, #38bdf8, #0ea5e9)",
		image: getCourseCover("Introduction-to-Computer-Science"),
		description: "计算机学科通识导引与计算基础认知",
		remoteRepo:
			"https://github.com/Henu-Kaguya/Introduction-to-Computer-Science.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},
	"C-Primer-Plus-Programming": {
		id: "C-Primer-Plus-Programming",
		name: "C语言程序设计",
		category: "学科基础课",
		gradient: "linear-gradient(135deg, #2563eb, #3b82f6, #60a5fa)",
		image: getCourseCover("C-Primer-Plus-Programming"),
		description: "C Primer Plus 程序设计课后作业、实验与代码实践",
		remoteRepo: "https://github.com/Henu-Kaguya/C-Primer-Plus-Programming.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},
	"Computational-Thinking-and-Innovation": {
		id: "Computational-Thinking-and-Innovation",
		name: "计算思维与创新",
		category: "学科基础课",
		gradient: "linear-gradient(135deg, #0d9488, #14b8a6, #2dd4bf)",
		image: getCourseCover("Computational-Thinking-and-Innovation"),
		description: "计算思维方法论、创新实践与习题资料",
		remoteRepo:
			"https://github.com/Henu-Kaguya/Computational-Thinking-and-Innovation.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},

	// --- 第一学年 第二学期（大一下） ---
	"Basic-Circuit-and-Electronics": {
		id: "Basic-Circuit-and-Electronics",
		name: "基本电路与电子学",
		category: "学科基础课",
		gradient: "linear-gradient(135deg, #059669, #10b981, #34d399)",
		image: getCourseCover("Basic-Circuit-and-Electronics"),
		description: "电路理论基础、模拟与数字电子学实验与习题资料",
		remoteRepo:
			"https://github.com/Henu-Kaguya/Basic-Circuit-and-Electronics.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},

	// --- 第二学年 第一学期（大二上） ---
	"Experiment-of-Logic-Design": {
		id: "Experiment-of-Logic-Design",
		name: "逻辑设计实验",
		category: "实践与实验",
		gradient: "linear-gradient(135deg, #d97706, #f59e0b, #fbbf24)",
		image: getCourseCover("Experiment-of-Logic-Design"),
		description: "组合与时序逻辑电路设计、FPGA/数字电路实验指导与源代码",
		remoteRepo: "https://github.com/Henu-Kaguya/Experiment-of-Logic-Design.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},
	"Logic-Design": {
		id: "Logic-Design",
		name: "逻辑设计",
		category: "学科基础课",
		gradient: "linear-gradient(135deg, #ea580c, #f97316, #fb923c)",
		image: getCourseCover("Logic-Design"),
		description: "布尔代数、卡诺图化简、组合逻辑与时序逻辑设计原理",
		remoteRepo: "https://github.com/Henu-Kaguya/Logic-Design.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},
	"Discrete-Mathematics": {
		id: "Discrete-Mathematics",
		name: "离散数学",
		category: "学科基础课",
		gradient: "linear-gradient(135deg, #0369a1, #38bdf8, #0284c7)",
		image: getCourseCover("Discrete-Mathematics"),
		description: "数理逻辑、集合论、代数系统与图论基础与考卷练习",
		remoteRepo: "https://github.com/Henu-Kaguya/Discrete-Mathematics.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},
	"CSharp-Programing": {
		id: "CSharp-Programing",
		name: "C#程序设计",
		category: "专业选修课",
		gradient: "linear-gradient(135deg, #6d28d9, #8b5cf6, #a78bfa)",
		image: getCourseCover("CSharp-Programing"),
		description: ".NET 体系、C# 语法特性、面向对象编程与课程项目",
		remoteRepo: "https://github.com/Henu-Kaguya/CSharp-Programing.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},
	"Introduction-to-Computer-Systems": {
		id: "Introduction-to-Computer-Systems",
		name: "计算机系统基础",
		category: "专业核心课",
		gradient: "linear-gradient(135deg, #1e40af, #3b82f6, #60a5fa)",
		image: getCourseCover("Introduction-to-Computer-Systems"),
		description: "数据表示、指令集架构、汇编与机器级表示底层原理",
		remoteRepo:
			"https://github.com/Henu-Kaguya/Introduction-to-Computer-Systems.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},

	// --- 第二学年 第二学期（大二下） ---
	"Operational-Research": {
		id: "Operational-Research",
		name: "运筹学",
		category: "专业核心课",
		gradient: "linear-gradient(135deg, #047857, #10b981, #6ee7b7)",
		image: getCourseCover("Operational-Research"),
		description: "线性规划、单纯形法、对偶理论与动态规划运筹优化",
		remoteRepo: "https://github.com/Henu-Kaguya/Operational-Research.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},
	"Principles-of-Computer-Organization": {
		id: "Principles-of-Computer-Organization",
		name: "计算机组成原理",
		category: "专业核心课",
		gradient: "linear-gradient(135deg, #0f766e, #14b8a6, #5eead4)",
		image: getCourseCover("Principles-of-Computer-Organization"),
		description: "运算器、控制器、存储系统、指令流水线与总线接口技术",
		remoteRepo:
			"https://github.com/Henu-Kaguya/Principles-of-Computer-Organization.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},
	"Algorithmic-Design-and-Analysis": {
		id: "Algorithmic-Design-and-Analysis",
		name: "算法设计与分析",
		category: "专业选修课",
		gradient: "linear-gradient(135deg, #b45309, #f59e0b, #fde68a)",
		image: getCourseCover("Algorithmic-Design-and-Analysis"),
		description: "分治策略、贪心算法、动态规划、回溯法与计算复杂度分析",
		remoteRepo:
			"https://github.com/Henu-Kaguya/Algorithmic-Design-and-Analysis.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},
	"CSharp-Network-Application-Programming": {
		id: "CSharp-Network-Application-Programming",
		name: "C#网络应用编程",
		category: "专业选修课",
		gradient: "linear-gradient(135deg, #4338ca, #6366f1, #a5b4fc)",
		image: getCourseCover("CSharp-Network-Application-Programming"),
		description: "Socket 通信、多线程网络编程、WinForms/WPF 与网络服务应用",
		remoteRepo:
			"https://github.com/Henu-Kaguya/CSharp-Network-Application-Programming.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},
	"Digital-Image-Processing": {
		id: "Digital-Image-Processing",
		name: "数字图像处理",
		category: "专业选修课",
		gradient: "linear-gradient(135deg, #c026d3, #e879f9, #f0abfc)",
		image: getCourseCover("Digital-Image-Processing"),
		description: "图像空域/频域增强、形态学处理、边缘检测与分割算法",
		remoteRepo: "https://github.com/Henu-Kaguya/Digital-Image-Processing.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},

	// --- 第三学年 第一学期（大三上） ---
	"Computer-Network": {
		id: "Computer-Network",
		name: "计算机网络",
		category: "专业核心课",
		gradient: "linear-gradient(135deg, #0284c7, #38bdf8, #7dd3fc)",
		image: getCourseCover("Computer-Network"),
		description: "分层体系结构、TCP/IP 协议栈、路由算法与网络安全体系",
		remoteRepo: "https://github.com/Henu-Kaguya/Computer-Network.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},
	"Software-Engineering": {
		id: "Software-Engineering",
		name: "软件工程",
		category: "专业选修课",
		gradient: "linear-gradient(135deg, #059669, #34d399, #6ee7b7)",
		image: getCourseCover("Software-Engineering"),
		description: "敏捷开发、需求工程、UML 建模、软件架构设计与测试流程",
		remoteRepo: "https://github.com/Henu-Kaguya/Software-Engineering.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},
	"Database-Principles": {
		id: "Database-Principles",
		name: "数据库系统原理及应用",
		category: "专业核心课",
		gradient: "linear-gradient(135deg, #b91c1c, #ef4444, #f87171)",
		image: getCourseCover("Database-Principles"),
		description: "关系代数、SQL 编程、事务 ACID 特性、并发控制与数据库设计",
		remoteRepo: "https://github.com/Henu-Kaguya/Database-Principles.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},
	"Operating-System": {
		id: "Operating-System",
		name: "操作系统",
		category: "专业核心课",
		gradient: "linear-gradient(135deg, #374151, #4b5563, #6b7280)",
		image: getCourseCover("Operating-System"),
		description: "进程与线程同步、死锁处理、虚拟内存管理与文件系统设计",
		remoteRepo: "https://github.com/Henu-Kaguya/Operating-System.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},
	"Machine-Learning": {
		id: "Machine-Learning",
		name: "机器学习与数据挖掘",
		category: "专业选修课",
		gradient: "linear-gradient(135deg, #7e22ce, #a855f7, #c084fc)",
		image: getCourseCover("Machine-Learning"),
		description: "监督学习、无监督聚类、深度神经网络算法与数据挖掘实验",
		remoteRepo: "https://github.com/Henu-Kaguya/Machine-Learning.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},
	"Computer-Architecture": {
		id: "Computer-Architecture",
		name: "计算机体系结构",
		category: "专业选修课",
		gradient: "linear-gradient(135deg, #1d4ed8, #3b82f6, #93c5fd)",
		image: getCourseCover("Computer-Architecture"),
		description: "动态流水线调度、分支预测、ILP 挖掘与多核存储一致性协议",
		remoteRepo: "https://github.com/Henu-Kaguya/Computer-Architecture.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},

	// --- 第三学年 第二学期（大三下） ---
	"Compiler-Principles": {
		id: "Compiler-Principles",
		name: "编译原理",
		category: "专业选修课",
		gradient: "linear-gradient(135deg, #be123c, #f43f5e, #fb7185)",
		image: getCourseCover("Compiler-Principles"),
		description: "词法语法分析、抽象语法树、中间代码生成与运行时环境优化",
		remoteRepo: "https://github.com/Henu-Kaguya/Compiler-Principles.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},
	"Natural-Language-Processing": {
		id: "Natural-Language-Processing",
		name: "自然语言处理",
		category: "专业选修课",
		gradient: "linear-gradient(135deg, #0e7490, #06b6d4, #67e8f9)",
		image: getCourseCover("Natural-Language-Processing"),
		description: "统计语言模型、词向量表征、Seq2Seq、Transformer 与大模型微调",
		remoteRepo:
			"https://github.com/Henu-Kaguya/Natural-Language-Processing.git",
		remoteBranch: "master",
		remoteExclude: ["LICENSE"],
	},
	"Computer-Ethics": {
		id: "Computer-Ethics",
		name: "计算机伦理学",
		category: "通识教育课",
		gradient: "linear-gradient(135deg, #7c3aed, #a78bfa, #6d28d9)",
		image: getCourseCover("Computer-Ethics"),
		description: "工程伦理规范、人工智能与深度伪造伦理治理、知识产权与案例分析",
		remoteRepo: "https://github.com/Henu-Kaguya/Computer-Ethics.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},
	"Computer-Graphics": {
		id: "Computer-Graphics",
		name: "计算机图形学",
		category: "专业选修课",
		gradient: "linear-gradient(135deg, #0369a1, #0284c7, #38bdf8)",
		image: getCourseCover("Computer-Graphics"),
		description: "图形渲染管线、变换矩阵、光照模型与 OpenGL 着色器实验",
		remoteRepo: "https://github.com/Henu-Kaguya/Computer-Graphics.git",
		remoteBranch: "main",
		remoteExclude: ["LICENSE"],
	},
	"CS-Small-Term": {
		id: "CS-Small-Term",
		name: "专业实践与小学期实训",
		category: "实践与实验",
		gradient: "linear-gradient(135deg, #047857, #10b981, #34d399)",
		image: getCourseCover("CS-Small-Term"),
		description:
			"计算机专业小学期全栈开发实训：网络爬虫、目标检测、RAG与AIGC工程",
		remoteRepo: "https://github.com/Henu-Kaguya/CS-Small-Term.git",
		remoteBranch: "master",
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
