import type { HierarchyNode } from "@/types/course";

/**
 * 学院与专业层级总配置
 *
 * 支持多层级自由配置与扩展：
 * 1. 学院级 (level: 'college'): 例如计算机与信息工程学院、软件工程学院。
 * 2. 同级独立科目/认证 (level: 'college'): 例如 TOEFL，与学院同级别，独立无挂载。
 * 3. 专业级 (level: 'major'): 通过 parentId 挂载在具体学院下。
 */
export const hierarchyNodes: HierarchyNode[] = [
	// ==================== 学院 / 同级实体 (College Level) ====================
	{
		id: "cs-college",
		name: "计算机与信息工程学院",
		shortName: "计信学院",
		level: "college",
		description: "计算机科学理论、系统架构、网络信息与算法技术核心培养学院",
		color: "#3b82f6",
		icon: "material-symbols:computer-outline",
		badge: "核心学院",
		order: 1,
	},
	{
		id: "se-college",
		name: "软件工程学院",
		shortName: "软工学院",
		level: "college",
		description: "现代大型软件体系设计、工程化开发与系统全生命周期实践",
		color: "#10b981",
		icon: "material-symbols:terminal",
		badge: "工程卓越",
		order: 2,
	},
	{
		id: "toefl",
		name: "TOEFL",
		shortName: "托福",
		level: "college", // 与学院同级别！
		description: "托福语言考试备考方法论、分类题型精解、核心词汇与真题模考体系",
		color: "#06b6d4",
		icon: "material-symbols:language",
		badge: "语言认证",
		order: 3,
	},

	// ==================== 专业 / 方向 (Major Level) ====================
	{
		id: "cs",
		name: "计算机科学与技术",
		shortName: "计科",
		level: "major",
		parentId: "cs-college",
		description: "涵盖基础理论、算法设计、操作系统、计算机网络与系统软件",
		color: "#3b82f6",
		icon: "material-symbols:code",
		order: 1,
	},
	{
		id: "se",
		name: "软件工程",
		shortName: "软工",
		level: "major",
		parentId: "se-college",
		description: "面向工程实践的高等数学、计算机网络与计算机组成原理等核心基础",
		color: "#10b981",
		icon: "material-symbols:developer-mode-tv",
		order: 2,
	},
];

/**
 * 获取所有学院及同级别独立实体
 */
export function getColleges(): HierarchyNode[] {
	return hierarchyNodes
		.filter((n) => n.level === "college")
		.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

/**
 * 根据学院 ID 获取下辖的所有专业列表
 */
export function getMajorsByCollege(collegeId: string): HierarchyNode[] {
	return hierarchyNodes
		.filter((n) => n.level === "major" && n.parentId === collegeId)
		.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

/**
 * 获取所有专业列表
 */
export function getAllMajors(): HierarchyNode[] {
	return hierarchyNodes
		.filter((n) => n.level === "major")
		.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

/**
 * 根据 ID 查找指定节点 (支持查找学院或专业)
 */
export function getHierarchyNode(id: string): HierarchyNode | undefined {
	return hierarchyNodes.find((n) => n.id.toLowerCase() === id.toLowerCase());
}

/**
 * 根据专业 ID 反查所属学院
 */
export function getCollegeByMajor(majorId: string): HierarchyNode | undefined {
	const major = getHierarchyNode(majorId);
	if (!major?.parentId) return undefined;
	return getHierarchyNode(major.parentId);
}
