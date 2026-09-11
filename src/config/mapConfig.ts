import type { SpotIndustry } from "@/types/spot";

export interface CategoryMeta {
	/** 分类中文标签 */
	label: string;
	/** 标记颜色（HEX） */
	color: string;
	/** 该分类默认图标（预设名称或路径） */
	defaultIcon?: string;
}

export interface MarkerIconPreset {
	/** 图标图片相对于站点的路径或外部 URL */
	src: string;
	/** 尺寸百分比（如 "80%"、80 或 0.8），无需计算像素，方便直观调整大小 */
	scale: string | number;
	/** 可选：图片高宽比 (width / height)，自动保持不拉伸变形 */
	aspectRatio?: number;
	/** 可选：兼容固定像素模式 */
	width?: number;
	height?: number;
	anchor?: [number, number];
}

/** 常用内置图标预设映射（百分比调整大小，无需计算具体像素） */
export const markerIconPresets: Record<string, MarkerIconPreset> = {
	// 学校校区：原神七天神像（想要更大改 "100%"，更小改 "75%"）
	genshin_statue: {
		src: "/assets/images/map/genshin_StatueOfTheSeven.png",
		scale: "90%",
		aspectRatio: 58 / 92,
	},
	// 餐饮美食：流萤蛋糕
	firefly_cake: {
		src: "/assets/images/map/firefly_cake.png",
		scale: "100%",
		aspectRatio: 1.0,
	},
	// 购物休闲：大厦建筑
	mansion: {
		src: "/assets/images/map/mansion.png",
		scale: "75%",
		aspectRatio: 44 / 38,
	},
	// 景点打卡：流萤精灵
	firefly_elf: {
		src: "/assets/images/map/firefly_elf.png",
		scale: "80%",
		aspectRatio: 560 / 679,
	},
	// 娱乐生活：原神传送锚点
	genshin_waypoint: {
		src: "/assets/images/map/genshin_TeleportWaypoint.png",
		scale: "90%",
		aspectRatio: 58 / 92,
	},
};

/** 地图点位聚合配置 */
export interface MapClusterConfig {
	/** 是否开启点位附近聚合 */
	enable: boolean;
	/** 聚合计算网格像素大小（数值越大聚合范围越广），默认 60 */
	gridSize: number;
	/** 最大聚合级别（缩放到此级别及以上时散开显示单点，不再聚合），默认 16 */
	maxZoom: number;
	/** 聚合大图标（预设别名或图片路径），默认使用流萤精灵图 */
	icon?: string;
	/** 聚合大图标尺寸百分比（如 "125%" 或 1.25），相对于基准地标放大 */
	scale?: string | number;
	/** 兼容固定像素选项 */
	width?: number;
	height?: number;
}

/** 地图昼夜样式配置 */
export interface MapThemeStyles {
	/** 亮色模式底图样式（官方预设如 "amap://styles/normal"、"amap://styles/whitesmoke"） */
	light: string;
	/** 暗色模式底图样式（官方预设如 "amap://styles/dark"、"amap://styles/darkblue"） */
	dark: string;
}

export interface MapConfig {
	/** 地图默认中心点 [经度, 纬度] */
	center: [number, number];
	/** 默认缩放级别 */
	zoom: number;
	/** 全局图标缩放百分比（如 "90%"、0.9），方便在此统一按比例放大/缩小所有图标 */
	iconScale: string | number;
	/** 昼夜地图样式配置，跟随站点深浅主题自动切换 */
	themeStyles: MapThemeStyles;
	/** 点位附近聚合配置 */
	cluster: MapClusterConfig;
	/** 分类配置：标签名称与标记颜色 */
	categories: Record<SpotIndustry, CategoryMeta>;
}

export const mapConfig: MapConfig = {
	// 河南大学金明校区
	center: [114.309225, 34.817047],
	zoom: 14,
	// 全局图标缩放百分比，可在此统一按比例微调大小
	iconScale: "90%",
	// 昼夜地图底图主题
	themeStyles: {
		light: "amap://styles/normal",
		dark: "amap://styles/dark",
	},
	// 点位聚合设置
	cluster: {
		enable: true,
		gridSize: 60,
		maxZoom: 16,
		icon: "/assets/images/map/firefly_elf.png",
		// 聚合大图标尺寸百分比（比普通点位大 30% 左右）
		scale: "125%",
	},
	categories: {
		campus: {
			label: "学校校区",
			color: "#0ea5e9",
			defaultIcon: "genshin_statue",
		},
		dining: {
			label: "餐饮美食",
			color: "#ef4444",
			defaultIcon: "firefly_cake",
		},
		shopping: {
			label: "购物休闲",
			color: "#3b82f6",
			defaultIcon: "mansion",
		},
		scenic: {
			label: "景点打卡",
			color: "#22c55e",
			defaultIcon: "firefly_elf",
		},
		enjoy: {
			label: "娱乐生活",
			color: "#a855f7",
			defaultIcon: "genshin_waypoint",
		},
		residential: { label: "住宅小区", color: "#f59e0b" },
		other: { label: "其他", color: "#6b7280" },
	},
};
