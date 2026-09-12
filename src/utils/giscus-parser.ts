import type { ReviewItem } from "@/types/review";

export interface GiscusFetchOptions {
	repo: string;
	term: string;
	category: string;
	strict?: string | boolean;
}

export interface GiscusAuthor {
	login: string;
	avatarUrl?: string;
	url?: string;
}

export interface GiscusCommentRaw {
	id: string;
	createdAt: string;
	url?: string;
	bodyHTML: string;
	author?: GiscusAuthor;
	replies?: GiscusCommentRaw[];
}

export interface GiscusDiscussionData {
	comments: GiscusCommentRaw[];
	totalCommentCount: number;
}

export interface GiscusAnalysisResult {
	/** 讨论区全部真实评论总数（包含未按模板打分的普通留言） */
	totalCommentCount: number;
	/** 严格包含合规有效评分的口碑列表 */
	validReviews: ReviewItem[];
	/** 平均评分（保留两位小数），若无任何合规评分评论则为 undefined */
	averageRating?: number;
}

/**
 * 异步请求 Giscus 官方公共只读接口获取讨论数据与总数
 */
export async function fetchGiscusDiscussionData(
	options: GiscusFetchOptions,
): Promise<GiscusDiscussionData> {
	const { repo, term, category, strict = "1" } = options;
	if (!repo || !term) return { comments: [], totalCommentCount: 0 };

	const strictParam =
		strict === true || strict === "1" || strict === "true" ? "1" : "0";
	const url = `https://giscus.app/api/discussions?repo=${encodeURIComponent(
		repo,
	)}&term=${encodeURIComponent(term)}&category=${encodeURIComponent(
		category,
	)}&strict=${strictParam}`;

	try {
		const res = await fetch(url, {
			headers: {
				Accept: "application/json",
			},
		});

		if (!res.ok) {
			return { comments: [], totalCommentCount: 0 };
		}

		const data = await res.json();
		const discussion = data?.discussion;
		if (!discussion || !Array.isArray(discussion.comments)) {
			return { comments: [], totalCommentCount: 0 };
		}

		// 展平一级评论与二级回复
		const allComments: GiscusCommentRaw[] = [];
		for (const comment of discussion.comments) {
			allComments.push(comment);
			if (Array.isArray(comment.replies)) {
				for (const reply of comment.replies) {
					allComments.push(reply);
				}
			}
		}

		const totalCommentCount =
			typeof discussion.totalCommentCount === "number"
				? discussion.totalCommentCount
				: allComments.length;

		return {
			comments: allComments,
			totalCommentCount,
		};
	} catch {
		return { comments: [], totalCommentCount: 0 };
	}
}

/**
 * 兼容旧方法：异步请求 Giscus 评论列表
 */
export async function fetchGiscusComments(
	options: GiscusFetchOptions,
): Promise<GiscusCommentRaw[]> {
	const data = await fetchGiscusDiscussionData(options);
	return data.comments;
}

/**
 * HTML 转纯文本工具
 */
function stripHtmlToText(html: string): string {
	if (!html) return "";
	return html
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/p>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, " ")
		.trim();
}

/**
 * 从 HTML 中提取所有非系统表情的用户图片 URL
 */
function extractImagesFromHtml(html: string): string[] {
	if (!html) return [];
	const imgRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
	const images: string[] = [];
	let match = imgRegex.exec(html);

	while (match !== null) {
		const imgTag = match[0];
		const src = match[1];

		// 过滤 GitHub 系统 emoji 与内置图标
		const isSystemAsset =
			src.includes("github.githubassets.com") ||
			src.includes("/images/icons/emoji/") ||
			src.includes("/emoji/") ||
			src.includes("identicons");

		if (!isSystemAsset && src) {
			// 若有 data-canonical-src，优先提取原图链接
			const canonicalMatch = /data-canonical-src=["']([^"']+)["']/i.exec(
				imgTag,
			);
			const finalUrl = canonicalMatch ? canonicalMatch[1] : src;
			images.push(finalUrl);
		}

		match = imgRegex.exec(html);
	}

	return images;
}

/**
 * 严格评分正则：
 * 匹配：
 *   > 评分: 5/5
 *   > 评分：5
 *   【评分】5
 *   评分: 4
 *   评分: 4/5
 * 不匹配无评分的普通留言
 */
const RATING_REGEX =
	/(?:^|\n)\s*(?:>\s*)?(?:评分|【评分】|rating)\s*[:：]?\s*([1-5])(?:\s*[/分]\s*(?:5)?)?(?:\s|$)/i;

/**
 * 清除正文中包含评分格式的行
 */
function removeRatingLine(text: string): string {
	return text
		.split("\n")
		.filter((line) => !RATING_REGEX.test(line))
		.join("\n")
		.trim();
}

/**
 * 将 Giscus 原始评论列表严格解析为 ReviewItem 数组
 * 规则：无评分或格式不匹配的评论直接忽略，不计入口碑列表
 */
export function parseGiscusCommentsToReviews(
	rawComments: GiscusCommentRaw[],
	options?: {
		spotId?: string;
		spotName?: string;
		tag?: string;
	},
): ReviewItem[] {
	if (!rawComments || rawComments.length === 0) return [];

	const validReviews: ReviewItem[] = [];

	for (const raw of rawComments) {
		if (!raw.bodyHTML) continue;

		const plainText = stripHtmlToText(raw.bodyHTML);

		// 严格校验是否包含评分
		const ratingMatch = RATING_REGEX.exec(plainText);
		if (!ratingMatch) {
			// 没有评分或格式不符合，严格不计入口碑
			continue;
		}

		const ratingNum = Number.parseInt(ratingMatch[1], 10);
		if (Number.isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
			continue;
		}

		// 提取图片
		const images = extractImagesFromHtml(raw.bodyHTML);

		// 清洗正文，移除评分声明行
		let cleanContent = removeRatingLine(plainText);
		if (!cleanContent) {
			cleanContent = images.length > 0 ? "点位实景与评价打卡" : "点位打卡推荐";
		}

		const authorName = raw.author?.login || "河大同学";
		const avatarUrl =
			raw.author?.avatarUrl ||
			`https://avatars.githubusercontent.com/u/1000${(validReviews.length % 8) + 1}?v=4`;

		validReviews.push({
			id: `giscus-${raw.id}`,
			author: authorName,
			avatar: avatarUrl,
			rating: ratingNum,
			content: cleanContent,
			date: raw.createdAt ? raw.createdAt.slice(0, 10) : "",
			spotId: options?.spotId,
			spotName: options?.spotName,
			tag: options?.tag,
			images: images.length > 0 ? images : undefined,
		});
	}

	return validReviews;
}

/**
 * 分析 Giscus 评论数据：
 * 1. 评论总数：计入全部评论（即使未按模板评分）
 * 2. 口碑列表：仅保留严格按模板打分的评论
 * 3. 平均评分：仅由合规评分计算平均值，保留后两位小数（如 4.50）
 */
export function analyzeGiscusComments(
	rawComments: GiscusCommentRaw[],
	totalDiscussionCount?: number,
	options?: {
		spotId?: string;
		spotName?: string;
		tag?: string;
	},
): GiscusAnalysisResult {
	const validReviews = parseGiscusCommentsToReviews(rawComments, options);
	const totalCommentCount =
		totalDiscussionCount !== undefined
			? totalDiscussionCount
			: rawComments.length;

	let averageRating: number | undefined;
	if (validReviews.length > 0) {
		const total = validReviews.reduce((acc, r) => acc + r.rating, 0);
		// 平均数保留后两位
		averageRating = Math.round((total / validReviews.length) * 100) / 100;
	}

	return {
		totalCommentCount,
		validReviews,
		averageRating,
	};
}
