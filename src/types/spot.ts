/** 点位行业分类 */
export type SpotIndustry =
	| "campus"
	| "dining"
	| "scenic"
	| "shopping"
	| "enjoy"
	| "residential"
	| "other";

/** 单条评论（预留字段，当前不可填写） */
export interface SpotComment {
	author: string;
	content: string;
	date: string;
}

/** 点位数据结构 */
export interface Spot {
	id: string;
	name: string;
	address: string;
	lon: number;
	lat: number;
	city_code: string;
	adcode: string;
	industry: SpotIndustry;
	parent_id: string;
	floor: string;
	/** 评分（0-5），预留字段 */
	rating?: number;
	/** 实际评论总数（含未打分的普通留言） */
	commentCount?: number;
	/** 评论列表，预留字段 */
	comments?: SpotComment[];
	/** 自定义图标标识符、本地相对路径或图片 URL */
	icon?: string;
}
