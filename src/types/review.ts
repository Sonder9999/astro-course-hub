/**
 * 精选评价单项数据模型
 */
export interface ReviewItem {
	/** 评价唯一标识 */
	id: string;
	/** 评价者昵称或用户名 */
	author: string;
	/** 评价者头像地址（可选） */
	avatar?: string;
	/** 评分星级（1 - 5） */
	rating: number;
	/** 评价文字内容 */
	content: string;
	/** 评价时间（可选） */
	date?: string;
	/** 关联地图点位 ID（可选，用于联动地图聚焦与评论切换） */
	spotId?: string;
	/** 关联点位名称（可选） */
	spotName?: string;
	/** 点位分类标签或简述（可选） */
	tag?: string;
	/** 预留图片附件数组（可选） */
	images?: string[];
}

/**
 * 点位线下/备用投稿渠道配置
 */
export interface SpotContactConfig {
	/** 是否启用备用投稿方式 */
	enable: boolean;
	/** 管理员联系邮箱 */
	email?: string;
	/** 管理员联系 QQ 或交流群 */
	qq?: string;
	/** 微信公众号或微信号（可选） */
	wechat?: string;
	/** 备用投稿提示说明文案 */
	noticeText?: string;
}
