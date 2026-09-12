import type { ReviewItem } from "@/types/review";
import type { Spot, SpotComment } from "@/types/spot";

/**
 * 根据评价列表聚合统计点位的评分与评论列表
 * @param spots 原始点位数组
 * @param reviews 评价数组
 * @returns 注入了评分与评论列表的点位数组副本
 */
export function enrichSpotsWithReviews(
	spots: Spot[],
	reviews: ReviewItem[],
): Spot[] {
	if (!spots || spots.length === 0) return [];
	if (!reviews || reviews.length === 0) return spots.map((s) => ({ ...s }));

	// 建立 spotId -> ReviewItem[] 映射
	const reviewsBySpotId = new Map<string, ReviewItem[]>();
	for (const review of reviews) {
		if (!review.spotId) continue;
		const list = reviewsBySpotId.get(review.spotId) || [];
		list.push(review);
		reviewsBySpotId.set(review.spotId, list);
	}

	return spots.map((spot) => {
		const matchedReviews = reviewsBySpotId.get(spot.id);
		if (!matchedReviews || matchedReviews.length === 0) {
			return {
				...spot,
				rating: undefined,
				comments: [],
			};
		}

		// 计算平均分（保留一位小数）
		const totalRating = matchedReviews.reduce((sum, r) => sum + r.rating, 0);
		const rawAvg = totalRating / matchedReviews.length;
		const rating = Math.round(rawAvg * 10) / 10;

		const comments: SpotComment[] = matchedReviews.map((r) => ({
			author: r.author,
			content: r.content,
			date: r.date || "",
		}));

		return {
			...spot,
			rating,
			comments,
		};
	});
}

/**
 * 针对单个点位计算其最新的评分与评论统计
 */
export function calculateSingleSpotStats(
	spotId: string,
	reviews: ReviewItem[],
): { rating?: number; count: number; comments: SpotComment[] } {
	const matched = reviews.filter((r) => r.spotId === spotId);
	if (matched.length === 0) {
		return { rating: undefined, count: 0, comments: [] };
	}

	const totalRating = matched.reduce((sum, r) => sum + r.rating, 0);
	const rawAvg = totalRating / matched.length;
	const rating = Math.round(rawAvg * 10) / 10;

	const comments: SpotComment[] = matched.map((r) => ({
		author: r.author,
		content: r.content,
		date: r.date || "",
	}));

	return {
		rating,
		count: matched.length,
		comments,
	};
}
