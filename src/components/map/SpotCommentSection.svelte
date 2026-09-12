<script lang="ts">
import { onDestroy, onMount } from "svelte";
import ReviewsMarquee from "@/components/common/ReviewsMarquee.svelte";
import type { ReviewItem, SpotContactConfig } from "@/types/review";
import type { Spot } from "@/types/spot";

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
let isContactModalOpen: boolean = $state(false);
let copyMessage: string = $state("");
let copyTimer: ReturnType<typeof setTimeout> | null = null;
let currentThemeUrl: string = $state("light");

const currentTerm = $derived(
	activeSpot ? `spot:${activeSpot.id}` : defaultPath,
);

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

// 切换当前点位并重载对应隔离的 Discussion
function setSpot(spot: Spot | null) {
	activeSpot = spot;
	const term = spot ? `spot:${spot.id}` : defaultPath;
	postGiscusConfig({
		mapping: "specific",
		term,
		strict: "1",
		theme: resolveGiscusTheme(),
	});

	if (spot && sectionElement) {
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

// 复制文本提示
async function handleCopy(text: string, label: string) {
	try {
		await navigator.clipboard.writeText(text);
		copyMessage = `已复制${label}`;
	} catch {
		copyMessage = `复制失败，请手动记录: ${text}`;
	}
	clearTimeout(copyTimer);
	copyTimer = setTimeout(() => {
		copyMessage = "";
	}, 2000);
}

// 构造唤起邮件客户端链接
const mailtoUrl = $derived.by(() => {
	if (!contactConfig?.email) return "#";
	const subject = encodeURIComponent(
		`[点位评价投稿] ${activeSpot ? activeSpot.name : "校园点位"}`,
	);
	const body = encodeURIComponent(
		`点位名称: ${activeSpot ? activeSpot.name : ""}\n点位ID: ${activeSpot ? activeSpot.id : ""}\n我的评分(1-5分): \n评价内容: \n我的昵称: \n`,
	);
	return `mailto:${contactConfig.email}?subject=${subject}&body=${body}`;
});

let themeObserver: MutationObserver | null = null;

onMount(() => {
	currentThemeUrl = resolveGiscusTheme();

	// 动态加载官方 Giscus 引擎
	import("https://esm.sh/giscus");

	const handleSwitchEvent = (e: Event) => {
		const customEvt = e as CustomEvent<{ spot: Spot }>;
		if (customEvt.detail?.spot) {
			setSpot(customEvt.detail.spot);
		}
	};

	window.addEventListener("switch-spot-comment", handleSwitchEvent);

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
		if (themeObserver) themeObserver.disconnect();
		clearTimeout(copyTimer);
	};
});

onDestroy(() => {
	if (themeObserver) themeObserver.disconnect();
	clearTimeout(copyTimer);
});
</script>

<div class="spot-comment-flow w-full">
	<!-- 顶部精选口碑双向跑马灯卡片 -->
	{#if reviews.length > 0}
		<div class="marquee-card card-base p-5 md:p-6 mb-4">
			<div class="flex items-center justify-between mb-3 px-1">
				<div class="flex items-center gap-2">
					<span class="w-1.5 h-4 bg-(--primary) rounded-full"></span>
					<span class="text-sm font-semibold text-(--deep-text)">
						校园点位精选口碑
					</span>
				</div>
				<span class="text-xs text-(--content-meta) opacity-80">
					支持左右滑动与悬浮暂停，点击卡片可联动定位
				</span>
			</div>
			<ReviewsMarquee
				{reviews}
				twoWay={true}
				speed={40}
				onSelectReview={handleSelectReview}
			/>
		</div>
	{/if}

	<!-- dynamic 原生风格状态栏卡片 -->
	<header class="dynamic-page-header card-base mb-4">
		<div class="dynamic-page-heading">
			<div class="dynamic-page-icon" aria-hidden="true">
				{#if activeSpot}
					<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
						<circle cx="12" cy="9" r="2.5" />
					</svg>
				{:else}
					<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
					</svg>
				{/if}
			</div>
			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-2 flex-wrap">
					<h2 class="text-lg md:text-xl font-bold text-(--deep-text) truncate">
						{activeSpot ? activeSpot.name : "校园地图留言交流"}
					</h2>
					<span class="px-2 py-0.5 rounded text-xs font-semibold bg-(--primary) text-white shrink-0">
						{activeSpot ? "点位专属" : "全站讨论"}
					</span>
					{#if activeSpot?.floor}
						<span class="px-1.5 py-0.5 rounded text-xs bg-(--btn-regular-bg) text-(--btn-content) shrink-0">
							{activeSpot.floor}
						</span>
					{/if}
				</div>
				<p class="text-xs text-(--content-meta) mt-1 truncate">
					{#if activeSpot}
						{activeSpot.address ? `地址：${activeSpot.address}` : "当前点位专属讨论区，留言独立留存"}
					{:else}
						在此留言讨论全校地图、点位补充或建议；点击地图点位气泡中的评分/评价可进入专属讨论区
					{/if}
				</p>
			</div>
		</div>

		<!-- 头部右侧操作动作 -->
		<div class="flex items-center gap-2 flex-wrap justify-end">
			{#if activeSpot}
				<button
					type="button"
					class="text-xs px-3.5 py-1.5 rounded-lg bg-(--primary) text-white font-medium hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1"
					onclick={exitSpotMode}
				>
					<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M19 12H5M12 19l-7-7 7-7" />
					</svg>
					<span>返回全站留言</span>
				</button>
			{/if}

			{#if contactConfig?.enable}
				<button
					type="button"
					class="text-xs px-3.5 py-1.5 rounded-lg border border-(--line-divider) bg-(--btn-regular-bg) text-(--deep-text) hover:bg-(--card-bg) transition-colors cursor-pointer"
					onclick={() => (isContactModalOpen = true)}
				>
					无GitHub账号？联系代录
				</button>
			{/if}
		</div>
	</header>

	<!-- Firefly 标准风格评论承载卡片 -->
	<div
		id="post-comments"
		bind:this={sectionElement}
		class="card-base p-6 md:p-8 mb-6 relative overflow-hidden"
	>
		<!-- 装饰性背景环 -->
		<div class="absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none">
			<svg viewBox="0 0 100 100" class="w-full h-full">
				<circle cx="50" cy="50" r="40" fill="currentColor" class="text-(--primary)" />
				<circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" stroke-width="2" class="text-(--primary)" />
				<circle cx="50" cy="50" r="10" fill="currentColor" class="text-(--primary)" />
			</svg>
		</div>

		<!-- 评论区标题与状态引导 -->
		<div class="relative z-10 mb-6">
			<div class="flex items-center gap-3 mb-2">
				<div class="w-1 h-6 bg-linear-to-b from-(--primary) to-transparent rounded-full"></div>
				<h3 class="text-xl font-bold text-(--btn-content)">
					{activeSpot ? `${activeSpot.name} 专属评价` : "地图全站讨论区"}
				</h3>
			</div>
			<p class="text-sm text-(--content-meta) ml-4">
				{activeSpot ? "GitHub Discussions 隔离驱动，评论仅在当前点位显示" : "在此留言讨论全校地图、点位补充或维护建议"}
			</p>
		</div>

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

<!-- 备用投稿与联系管理员弹窗 -->
{#if isContactModalOpen}
	<div class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
		<div class="modal-card card-base max-w-md w-full p-6 relative rounded-2xl border border-(--line-divider) bg-(--card-bg) shadow-2xl">
			<div class="flex items-center justify-between mb-4 border-b border-(--line-divider) pb-3">
				<h4 class="text-base font-bold text-(--deep-text)">
					线下与备用投稿通道
				</h4>
				<button
					type="button"
					class="close-btn text-(--content-meta) hover:text-(--deep-text) text-sm p-1 cursor-pointer"
					aria-label="关闭弹窗"
					onclick={() => (isContactModalOpen = false)}
				>
					关闭
				</button>
			</div>

			<p class="text-xs text-(--content-meta) leading-relaxed mb-4">
				{contactConfig?.noticeText}
			</p>

			<div class="space-y-3 mb-5">
				{#if contactConfig?.email}
					<div class="flex items-center justify-between p-3 rounded-xl bg-(--btn-regular-bg) border border-(--line-divider)">
						<div class="flex flex-col">
							<span class="text-xs text-(--content-meta)">管理员邮箱</span>
							<span class="text-sm font-mono font-medium text-(--deep-text)">{contactConfig.email}</span>
						</div>
						<div class="flex items-center gap-2">
							<a
								href={mailtoUrl}
								class="text-xs px-2.5 py-1 rounded bg-(--primary) text-white font-medium hover:opacity-90"
							>
								唤起邮件
							</a>
							<button
								type="button"
								class="text-xs px-2.5 py-1 rounded border border-(--line-divider) text-(--deep-text) hover:bg-(--card-bg) cursor-pointer"
								onclick={() => handleCopy(contactConfig.email ?? "", "邮箱地址")}
							>
								复制
							</button>
						</div>
					</div>
				{/if}

				{#if contactConfig?.qq}
					<div class="flex items-center justify-between p-3 rounded-xl bg-(--btn-regular-bg) border border-(--line-divider)">
						<div class="flex flex-col">
							<span class="text-xs text-(--content-meta)">QQ / 交流群</span>
							<span class="text-sm font-mono font-medium text-(--deep-text)">{contactConfig.qq}</span>
						</div>
						<button
							type="button"
							class="text-xs px-2.5 py-1 rounded border border-(--line-divider) text-(--deep-text) hover:bg-(--card-bg) cursor-pointer"
							onclick={() => handleCopy(contactConfig.qq ?? "", "QQ号")}
						>
							复制
						</button>
					</div>
				{/if}
			</div>

			{#if copyMessage}
				<div class="text-xs text-center py-1 px-2 rounded bg-(--btn-regular-bg) text-(--primary) font-medium mb-3">
					{copyMessage}
				</div>
			{/if}

			<div class="text-right">
				<button
					type="button"
					class="text-xs px-4 py-2 rounded-lg bg-(--btn-regular-bg) text-(--deep-text) hover:bg-(--line-divider) cursor-pointer"
					onclick={() => (isContactModalOpen = false)}
				>
					我知道了
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
.modal-backdrop {
	animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}
</style>
