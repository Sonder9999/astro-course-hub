<script lang="ts">
import { onDestroy, onMount } from "svelte";
import ReviewsMarquee from "@/components/common/ReviewsMarquee.svelte";
import { profileConfig } from "@/config/profileConfig";
import type { ReviewItem, SpotContactConfig } from "@/types/review";
import type { Spot } from "@/types/spot";
import {
	analyzeGiscusComments,
	fetchGiscusDiscussionData,
} from "@/utils/giscus-parser";
import SpotReviewHelper from "./SpotReviewHelper.svelte";

interface Props {
	/** 默认页面路径，例如 "/map/" */
	defaultPath?: string;
	/** Giscus 基础配置 */
	giscusConfig: {
		repo: string;
		repoId: string;
		category: string;
		categoryId: string;
		mapping?: string;
		strict?: string;
		reactionsEnabled?: string;
		emitMetadata?: string;
		inputPosition?: string;
		lang?: string;
		loading?: string;
	};
	/** 精选评价列表 */
	reviews?: ReviewItem[];
	/** 全量点位列表（用于跑马灯点击联动检索） */
	spots?: Spot[];
	/** 备用投稿渠道配置 */
	contactConfig?: SpotContactConfig;
}

const {
	defaultPath = "/map/",
	giscusConfig,
	reviews = [],
	spots = [],
	contactConfig = {
		enable: true,
		email: "admin@henu.edu.cn",
		qq: "12345678",
		noticeText:
			"没有 GitHub 账号？欢迎通过邮件或 QQ 将点位评价与修正建议发送给管理员代为收录。",
	},
}: Props = $props();

let sectionElement: HTMLDivElement | undefined = $state(undefined);
let activeSpot: Spot | null = $state(null);
let currentThemeUrl: string = $state("light");
let giscusReviews: ReviewItem[] = $state([]);
let isLoadingReviews: boolean = $state(false);

const currentTerm = $derived(
	activeSpot ? `spot:${activeSpot.id}` : defaultPath,
);

// 根据全站讨论 vs 点位专属模式精确隔离与补全口碑列表
const displayReviews = $derived.by(() => {
	if (!activeSpot) {
		// 全站模式：优先展示 Giscus 真实口碑，不足 8 条以静态数据补齐
		const combined = [...giscusReviews];
		const existingIds = new Set(combined.map((r) => r.id));
		for (const r of reviews) {
			if (!existingIds.has(r.id)) {
				combined.push(r);
				existingIds.add(r.id);
			}
			if (combined.length >= 8) break;
		}
		return combined;
	}
	// 点位模式：仅展示当前点位的评价（Giscus真实评价 + 该点位的静态评价）
	const spotStatic = reviews.filter((r) => r.spotId === activeSpot.id);
	const combined = [...giscusReviews];
	const existingIds = new Set(combined.map((r) => r.id));
	for (const r of spotStatic) {
		if (!existingIds.has(r.id)) {
			combined.push(r);
			existingIds.add(r.id);
		}
	}
	return combined;
});

// 获取 profileConfig 中的联系链接
const profileQqLink = profileConfig.links.find(
	(l) => l.name.toLowerCase() === "qq",
)?.url;
const profileEmailLink = profileConfig.links.find(
	(l) => l.name.toLowerCase() === "email",
)?.url;

const effectiveQqUrl = $derived.by(() => {
	if (profileQqLink && profileQqLink.startsWith("http")) return profileQqLink;
	if (contactConfig?.qq) return `https://qm.qq.com/q/${contactConfig.qq}`;
	return profileQqLink || "";
});

const effectiveEmail = $derived(
	contactConfig?.email ||
		(profileEmailLink
			? profileEmailLink.replace("mailto:", "")
			: "admin@henu.edu.cn"),
);

// 构造唤起邮件客户端链接
const mailtoUrl = $derived.by(() => {
	if (!effectiveEmail) return "#";
	const subject = encodeURIComponent(
		`[点位评价投稿] ${activeSpot ? activeSpot.name : "校园点位"}`,
	);
	const body = encodeURIComponent(
		`点位名称: ${activeSpot ? activeSpot.name : ""}\n点位ID: ${activeSpot ? activeSpot.id : ""}\n我的评分(1-5分): \n评价内容: \n我的昵称: \n`,
	);
	return `mailto:${effectiveEmail}?subject=${subject}&body=${body}`;
});

// 解析适配 Firefly 动态主题的 Giscus 主题方案
function resolveGiscusTheme(): string {
	if (typeof window === "undefined") return "preferred_color_scheme";
	const isDark = document.documentElement.classList.contains("dark");
	// 生产 HTTPS 环境下加载深度定制的动态风格样式表
	if (window.location.protocol === "https:") {
		return `${window.location.origin}/assets/css/giscus-dynamic-${isDark ? "dark" : "light"}.css`;
	}
	// 本地开发环境因浏览器 Mixed Content 策略限制，使用内置透明/明亮主题，卡片底色由外层 card-base 磨砂承载
	return isDark ? "transparent_dark" : "light";
}

// 动态向 Giscus 发送配置更新指令
function postGiscusConfig(config: Record<string, string | number | boolean>) {
	const iframe = document.querySelector<HTMLIFrameElement>(
		"iframe.giscus-frame",
	);
	if (iframe?.contentWindow) {
		iframe.contentWindow.postMessage(
			{
				giscus: {
					setConfig: config,
				},
			},
			"https://giscus.app",
		);
	}
	const widget = document.querySelector("giscus-widget");
	if (widget) {
		for (const [key, val] of Object.entries(config)) {
			widget.setAttribute(key, String(val));
		}
	}
}

// 异步拉取 Giscus 官方评论并严格解析口碑
async function loadGiscusReviews() {
	if (!giscusConfig?.repo || !giscusConfig?.category) return;
	const term = activeSpot ? `spot:${activeSpot.id}` : defaultPath;
	isLoadingReviews = true;
	try {
		const data = await fetchGiscusDiscussionData({
			repo: giscusConfig.repo,
			term,
			category: giscusConfig.category,
			strict: "1",
		});

		const analysis = analyzeGiscusComments(
			data.comments,
			data.totalCommentCount,
			{
				spotId: activeSpot ? activeSpot.id : undefined,
				spotName: activeSpot ? activeSpot.name : undefined,
				tag: activeSpot ? "点位口碑" : "全站口碑",
			},
		);

		giscusReviews = analysis.validReviews;

		// 派发动态更新事件给地图：传递真实评论总数、合规评分平均值与口碑列表
		if (typeof window !== "undefined" && activeSpot) {
			window.dispatchEvent(
				new CustomEvent("update-spot-reviews", {
					detail: {
						spotId: activeSpot.id,
						totalCount: analysis.totalCommentCount,
						rating: analysis.averageRating,
						reviews: displayReviews,
					},
				}),
			);
		}
	} catch {
		giscusReviews = [];
	} finally {
		isLoadingReviews = false;
	}
}

// 切换当前点位并重载对应隔离的 Discussion（默认不滚动/不跳转页面视野）
function setSpot(spot: Spot | null, scrollToComments = false) {
	activeSpot = spot;
	const term = spot ? `spot:${spot.id}` : defaultPath;
	postGiscusConfig({
		mapping: "specific",
		term,
		strict: "1",
		theme: resolveGiscusTheme(),
	});

	loadGiscusReviews();

	if (scrollToComments && spot && sectionElement) {
		sectionElement.scrollIntoView({ behavior: "smooth", block: "start" });
	}
}

// 退出点位专属模式，返回全站讨论
function exitSpotMode() {
	setSpot(null);
}

// 监听昼夜模式切换并同步给 Giscus
function syncGiscusTheme() {
	currentThemeUrl = resolveGiscusTheme();
	postGiscusConfig({ theme: currentThemeUrl });
}

// 跑马灯口碑卡片点击联动
function handleSelectReview(review: ReviewItem) {
	if (!review.spotId) return;

	if (typeof window !== "undefined") {
		window.dispatchEvent(
			new CustomEvent("select-spot-on-map", {
				detail: { spotId: review.spotId },
			}),
		);
	}

	const target = spots.find((s) => s.id === review.spotId);
	if (target) {
		setSpot(target);
	} else if (review.spotName) {
		setSpot({
			id: review.spotId,
			name: review.spotName,
			address: "",
			lon: 0,
			lat: 0,
			city_code: "",
			adcode: "",
			industry: "campus",
			parent_id: "",
			floor: "",
		});
	}
}

let themeObserver: MutationObserver | null = null;

onMount(() => {
	currentThemeUrl = resolveGiscusTheme();

	// 动态加载官方 Giscus 引擎
	import("https://esm.sh/giscus");

	loadGiscusReviews();

	const handleSwitchEvent = (e: Event) => {
		const customEvt = e as CustomEvent<{
			spot: Spot;
			scrollToComments?: boolean;
		}>;
		if (customEvt.detail?.spot) {
			setSpot(customEvt.detail.spot, !!customEvt.detail.scrollToComments);
		}
	};

	const handleGiscusMessage = (event: MessageEvent) => {
		if (event.origin !== "https://giscus.app") return;
		if (event.data?.giscus?.discussion || event.data?.giscus?.resizeHeight) {
			loadGiscusReviews();
		}
	};

	window.addEventListener("switch-spot-comment", handleSwitchEvent);
	window.addEventListener("message", handleGiscusMessage);

	if (typeof MutationObserver !== "undefined") {
		themeObserver = new MutationObserver(() => {
			syncGiscusTheme();
		});
		themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});
	}

	return () => {
		window.removeEventListener("switch-spot-comment", handleSwitchEvent);
		window.removeEventListener("message", handleGiscusMessage);
		if (themeObserver) themeObserver.disconnect();
	};
});

onDestroy(() => {
	if (themeObserver) themeObserver.disconnect();
});
</script>

<div class="spot-comment-flow w-full">
	<!-- 顶部精选口碑双向跑马灯卡片（点位与全站各自展示对应数据） -->
	{#if displayReviews.length > 0}
		<div class="marquee-card card-base p-3.5 sm:p-5 md:p-6 mb-4">
			<div class="flex items-center justify-between mb-3 px-1">
				<div class="flex items-center gap-2">
					<span class="w-1.5 h-4 bg-(--primary) rounded-full"></span>
					<span class="text-sm font-semibold text-(--deep-text)">
						{activeSpot ? `${activeSpot.name} 口碑评价` : "校园点位精选口碑"}
					</span>
					{#if activeSpot}
						<span class="text-[11px] px-1.5 py-0.5 rounded bg-(--primary)/10 text-(--primary) font-medium">
							共 {displayReviews.length} 条评价
						</span>
					{/if}
				</div>
				<span class="text-xs text-(--content-meta) opacity-80 hidden sm:inline">
					{activeSpot ? "点位专属口碑，来自真实评价" : "支持左右滑动与悬浮暂停，点击卡片可联动定位"}
				</span>
			</div>
			<ReviewsMarquee
				reviews={displayReviews}
				twoWay={displayReviews.length >= 2}
				speed={40}
				onSelectReview={handleSelectReview}
			/>
		</div>
	{:else if activeSpot}
		<div class="card-base p-4 sm:p-5 mb-4 text-center text-xs text-(--content-meta) border border-(--line-divider)">
			<span>该点位暂无口碑评价，欢迎在下方发表第一条带评分的评价</span>
		</div>
	{/if}

	<!-- dynamic 风格状态栏卡片 (移动端与桌面端自适应排版，杜绝标题文字被挤压截断) -->
	<header class="spot-status-header card-base p-3.5 sm:p-5 md:p-6 mb-4">
		<div class="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
			<!-- 左侧：图标 + 标题与副标题 -->
			<div class="flex items-start gap-2.5 sm:gap-3.5 min-w-0 flex-1">
				<div class="status-icon-box w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-xl bg-(--btn-regular-bg) text-(--primary) flex items-center justify-center shrink-0 border border-(--line-divider) mt-0.5">
					{#if activeSpot}
						<svg class="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
							<circle cx="12" cy="9" r="2.5" />
						</svg>
					{:else}
						<svg class="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
						</svg>
					{/if}
				</div>

				<div class="min-w-0 flex-1">
					<div class="flex items-center gap-2 flex-wrap">
						<h2 class="text-base sm:text-lg md:text-xl font-bold text-(--deep-text) leading-snug">
							{activeSpot ? activeSpot.name : "校园地图留言交流"}
						</h2>
						<span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-(--primary) text-white shrink-0">
							{activeSpot ? "点位专属" : "全站讨论"}
						</span>
						{#if activeSpot?.floor}
							<span class="px-1.5 py-0.5 rounded text-[11px] bg-(--btn-regular-bg) text-(--btn-content) shrink-0 border border-(--line-divider)">
								{activeSpot.floor}
							</span>
						{/if}
					</div>

					<p class="text-xs text-(--content-meta) mt-1 leading-relaxed break-words">
						{#if activeSpot}
							{activeSpot.address ? `地址：${activeSpot.address}` : "当前点位专属讨论区，留言独立留存"}
						{:else}
							在此留言讨论全校地图、点位补充或建议；点击地图点位气泡中的评分/评价可进入专属讨论区
						{/if}
					</p>
				</div>
			</div>

			<!-- 右侧：操作动作组 (移动端自然在下方全宽布局，桌面端水平靠右对齐) -->
			<div class="flex items-center gap-2 flex-wrap justify-between md:justify-end pt-2 md:pt-0 border-t border-(--line-divider)/50 md:border-t-0 shrink-0">
				{#if contactConfig?.enable}
					<div class="inline-flex items-center gap-1.5 text-xs text-(--content-meta)">
						<span class="text-[11px] opacity-75 select-none">无账号代录:</span>
						{#if effectiveQqUrl}
							<a
								href={effectiveQqUrl}
								target="_blank"
								rel="noopener noreferrer"
								aria-label="qq"
								title={`通过 QQ 联系代录: ${contactConfig?.qq || '点击跳转'}`}
								class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-(--btn-regular-bg) hover:bg-(--card-bg) hover:text-(--primary) text-(--content-meta) border border-(--line-divider) transition-all active:scale-90"
							>
								<svg class="w-3.5 h-3.5" viewBox="0 0 640 640" fill="currentColor">
									<path d="M530.1 484.4c-11.5 1.4-44.9-52.7-44.9-52.7c0 31.3-16.1 72.2-51 101.8c16.8 5.2 54.8 19.2 45.8 34.4c-7.3 12.3-125.5 7.9-159.6 4c-34.1 3.8-152.3 8.3-159.6-4c-9-15.2 28.9-29.2 45.8-34.4c-34.9-29.5-51.1-70.4-51.1-101.8c0 0-33.3 54.1-44.9 52.7c-5.4-.6-12.4-29.6 9.3-99.7c10.3-33 22-60.5 40.1-105.8c-3.1-116.9 45.2-215 160.3-215c113.7 0 163.2 96.1 160.3 215c18.1 45.2 29.9 72.9 40.1 105.8c21.8 70.1 14.7 99.1 9.3 99.7z" />
								</svg>
							</a>
						{/if}
						{#if effectiveEmail}
							<a
								href={mailtoUrl}
								aria-label="email"
								title={`通过邮件发送点位评价: ${effectiveEmail}`}
								class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-(--btn-regular-bg) hover:bg-(--card-bg) hover:text-(--primary) text-(--content-meta) border border-(--line-divider) transition-all active:scale-90"
							>
								<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
									<polyline points="22,6 12,13 2,6" />
								</svg>
							</a>
						{/if}
					</div>
				{/if}

				{#if activeSpot}
					<button
						type="button"
						class="text-xs px-3 py-1.5 rounded-lg bg-(--primary) text-white font-medium hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1 shrink-0 ml-auto md:ml-0 shadow-xs"
						onclick={exitSpotMode}
					>
						<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M19 12H5M12 19l-7-7 7-7" />
						</svg>
						<span>返回全站留言</span>
					</button>
				{/if}
			</div>
		</div>
	</header>

	<!-- Firefly 标准风格评论承载卡片 -->
	<div
		id="post-comments"
		bind:this={sectionElement}
		class="card-base p-4 sm:p-6 md:p-8 mb-6 relative overflow-hidden"
	>
		<!-- 装饰性背景环 -->
		<div class="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 opacity-5 pointer-events-none">
			<svg viewBox="0 0 100 100" class="w-full h-full">
				<circle cx="50" cy="50" r="40" fill="currentColor" class="text-(--primary)" />
				<circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" stroke-width="2" class="text-(--primary)" />
				<circle cx="50" cy="50" r="10" fill="currentColor" class="text-(--primary)" />
			</svg>
		</div>

		<!-- 评论区标题与状态引导 -->
		<div class="relative z-10 mb-4 sm:mb-6">
			<div class="flex items-center gap-2.5 sm:gap-3 {activeSpot ? '' : 'mb-1.5 sm:mb-2'}">
				<div class="w-1 h-5 sm:h-6 bg-linear-to-b from-(--primary) to-transparent rounded-full"></div>
				<h3 class="text-lg sm:text-xl font-bold text-(--btn-content)">
					{activeSpot ? activeSpot.name : "地图全站讨论区"}
				</h3>
			</div>
			{#if !activeSpot}
				<p class="text-xs sm:text-sm text-(--content-meta) ml-3.5 sm:ml-4">
					在此留言讨论全校地图、点位补充或维护建议
				</p>
			{/if}
		</div>

		<!-- 点位专属打分与评价模板助手（全站模式不显示，点位模式显示） -->
		{#if activeSpot}
			<SpotReviewHelper
				spot={activeSpot}
				repo={giscusConfig.repo}
				category={giscusConfig.category}
			/>
		{/if}

		<!-- Giscus 挂载区 -->
		<div class="relative z-10 pl-1 pr-1 min-h-[220px]">
			{#if giscusConfig.repo && giscusConfig.repoId}
				<giscus-widget
					id="comments"
					repo={giscusConfig.repo}
					repoId={giscusConfig.repoId}
					category={giscusConfig.category}
					categoryId={giscusConfig.categoryId}
					mapping="specific"
					term={currentTerm}
					strict="1"
					reactionsEnabled={giscusConfig.reactionsEnabled ?? "1"}
					emitMetadata={giscusConfig.emitMetadata ?? "0"}
					inputPosition={giscusConfig.inputPosition ?? "top"}
					theme={currentThemeUrl}
					lang={giscusConfig.lang ?? "zh-CN"}
					loading={giscusConfig.loading ?? "lazy"}
				></giscus-widget>
			{:else}
				<div class="p-8 text-center rounded-xl bg-(--btn-regular-bg) border border-dashed border-(--line-divider) text-(--content-meta)">
					<p class="text-sm font-semibold mb-1 text-(--deep-text)">
						Giscus 评论系统待绑定 GitHub 仓库
					</p>
					<p class="text-xs max-w-md mx-auto leading-relaxed">
						点位专属隔离切换引擎已就绪。在 <code>src/config/commentConfig.ts</code> 中填写您的 GitHub repo 与 repoId 即可激活实时评论输入。
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
