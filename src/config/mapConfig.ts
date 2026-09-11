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
	/** 显示宽度（px） */
	width: number;
	/** 显示高度（px） */
	height: number;
	/** 锚点偏移 [x, y] 像素，相对于左上角，未设置则默认底部中心 */
	anchor?: [number, number];
}

/** 常用内置图标预设映射 */
export const markerIconPresets: Record<string, MarkerIconPreset> = {
	// 学校校区：原神七天神像
	genshin_statue: {
		src: "/assets/images/map/genshin_StatueOfTheSeven.png",
		width: 28,
		height: 44,
		anchor: [14, 42],
	},
	// 餐饮美食：流萤蛋糕
	firefly_cake: {
		src: "/assets/images/map/firefly_cake.png",
		width: 34,
		height: 34,
		anchor: [17, 32],
	},
	// 购物休闲：大厦建筑
	mansion: {
		src: "/assets/images/map/mansion.png",
		width: 36,
		height: 31,
		anchor: [18, 30],
	},
	// 景点打卡：流萤精灵
	firefly_elf: {
		src: "/assets/images/map/firefly_elf.png",
		width: 32,
		height: 39,
		anchor: [16, 39],
	},
	// 娱乐生活：原神传送锚点
	genshin_waypoint: {
		src: "/assets/images/map/genshin_TeleportWaypoint.png",
		width: 28,
		height: 44,
		anchor: [14, 42],
	},
};

export interface MapConfig {
	/** 地图默认中心点 [经度, 纬度] */
	center: [number, number];
	/** 默认缩放级别 */
	zoom: number;
	/** 分类配置：标签名称与标记颜色 */
	categories: Record<SpotIndustry, CategoryMeta>;
}

export const mapConfig: MapConfig = {
	// 河南大学金明校区
	center: [114.309225, 34.817047],
	zoom: 14,
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
