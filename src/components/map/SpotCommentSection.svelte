<script lang="ts">
import { onDestroy, onMount } from "svelte";
import ReviewsMarquee from "@/components/common/ReviewsMarquee.svelte";
import type { ReviewItem, SpotContactConfig } from "@/types/review";
import type { Spot } from "@/types/spot";
import SpotDynamicFeed from "./SpotDynamicFeed.svelte";

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
let viewMode: "dynamic" | "giscus" = $state("dynamic");

const currentTerm = $derived(
	activeSpot ? `spot:${activeSpot.id}` : defaultPath,
);

// 动态向 Giscus 发送配置更新协议
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

// 切换当前点位
function setSpot(spot: Spot | null) {
	activeSpot = spot;
	const term = spot ? `spot:${spot.id}` : defaultPath;
	postGiscusConfig({
		mapping: "specific",
		term,
		strict: "1",
	});

	if (spot && sectionElement) {
		sectionElement.scrollIntoView({ behavior: "smooth", block: "start" });
	}
}

// 退出点位评论，返回页面评论模式
function exitSpotMode() {
	setSpot(null);
}

// 监听主题切换以更新 Giscus 昼夜风格
function syncGiscusTheme() {
	if (typeof document === "undefined") return;
	const isDark = document.documentElement.classList.contains("dark");
	postGiscusConfig({ theme: isDark ? "dark" : "light" });
}

// 跑马灯卡片点击联动
function handleSelectReview(review: ReviewItem) {
	if (!review.spotId) return;

	// 通知地图聚焦到该点位
	if (typeof window !== "undefined") {
		window.dispatchEvent(
			new CustomEvent("select-spot-on-map", {
				detail: { spotId: review.spotId },
			}),
		);
	}

	// 查找点位对象并切换下方评论区
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

// 复制联系方式到剪贴板
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

// 组装邮件投稿链接
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
	// 加载官方 Giscus Web Component
	import("https://esm.sh/giscus");

	// 监听来自地图气泡等触发的切换事件
	const handleSwitchEvent = (e: Event) => {
		const customEvt = e as CustomEvent<{ spot: Spot }>;
		if (customEvt.detail?.spot) {
			setSpot(customEvt.detail.spot);
		}
	};

	window.addEventListener("switch-spot-comment", handleSwitchEvent);

	// 监听站点暗色模式变化
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

<div
	id="post-comments"
	bind:this={sectionElement}
	class="spot-comment-wrapper card-base p-6 md:p-8 mb-6 relative overflow-hidden"
>
	<!-- 顶部口碑跑马灯区（仅在全站概览时或任何时候作为口碑墙展示） -->
	{#if reviews.length > 0}
		<div class="marquee-section mb-6 pb-6 border-b border-[var(--line-color)]">
			<div class="flex items-center justify-between mb-3 px-1">
				<div class="flex items-center gap-2">
					<span class="w-1.5 h-4 bg-[var(--primary)] rounded-full"></span>
					<span class="text-sm font-semibold text-[var(--deep-text)]">
						校园点位精选口碑
					</span>
				</div>
				<span class="text-xs text-[var(--content-meta)] opacity-80">
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

	<!-- 评论区头部与模式切换控制栏 -->
	<div class="comment-control-header mb-6">
		{#if activeSpot}
			<!-- 点位专属评价模式 -->
			<div class="spot-mode-banner flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-color)]">
				<div class="flex flex-col gap-1">
					<div class="flex items-center gap-2 flex-wrap">
						<span class="px-2 py-0.5 rounded text-xs font-semibold bg-[var(--primary)] text-white">
							点位评价
						</span>
						{#if activeSpot.floor}
							<span class="px-1.5 py-0.5 rounded text-xs bg-[var(--card-bg)] text-[var(--btn-content)] border border-[var(--line-color)]">
								{activeSpot.floor}
							</span>
						{/if}
						<h3 class="text-lg font-bold text-[var(--deep-text)]">
							{activeSpot.name}
						</h3>
					</div>
					{#if activeSpot.address}
						<p class="text-xs text-[var(--content-meta)]">
							地址：{activeSpot.address}
						</p>
					{/if}
				</div>

				<!-- 操作按钮组 -->
				<div class="flex items-center gap-2 flex-wrap">
					{#if contactConfig?.enable}
						<button
							type="button"
							class="action-btn text-xs px-3 py-1.5 rounded-lg border border-[var(--line-color)] hover:border-[var(--primary)] bg-[var(--card-bg)] text-[var(--deep-text)] transition-colors"
							onclick={() => (isContactModalOpen = true)}
						>
							无GitHub账号投稿
						</button>
					{/if}

					<button
						type="button"
						class="action-btn-primary text-xs px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 transition-opacity"
						onclick={exitSpotMode}
					>
						返回全站留言
					</button>
				</div>
			</div>
		{:else}
			<!-- 全站留言模式 -->
			<div class="page-mode-banner flex flex-col md:flex-row md:items-center justify-between gap-3">
				<div>
					<div class="flex items-center gap-2 mb-1">
						<div class="w-1.5 h-5 bg-[var(--primary)] rounded-full"></div>
						<h3 class="text-xl font-bold text-[var(--btn-content)]">
							校园地图留言交流
						</h3>
					</div>
					<p class="text-xs text-[var(--content-meta)] ml-3.5">
						在此留言讨论全校地图、点位补充或建议；点击地图点位气泡中的评分/评价可进入专属讨论区
					</p>
				</div>

				{#if contactConfig?.enable}
					<button
						type="button"
						class="self-start md:self-auto text-xs px-3 py-1.5 rounded-lg border border-[var(--line-color)] hover:border-[var(--primary)] bg-[var(--btn-regular-bg)] text-[var(--deep-text)] transition-colors"
						onclick={() => (isContactModalOpen = true)}
					>
						无GitHub账号？联系代录
					</button>
				{/if}
			</div>
		{/if}
	</div>

	<!-- 评论展示形式切换栏（图文动态流 vs Giscus 留言板） -->
	<div class="view-mode-tabs flex items-center justify-between mb-5 border-b border-[var(--line-color)] pb-3">
		<div class="flex items-center gap-2">
			<button
				type="button"
				class="text-xs md:text-sm px-3.5 py-1.5 rounded-lg font-medium transition-all {viewMode === 'dynamic' ? 'bg-[var(--primary)] text-white shadow-xs' : 'text-[var(--content-meta)] hover:text-[var(--deep-text)] bg-[var(--btn-regular-bg)]'}"
				onclick={() => (viewMode = "dynamic")}
			>
				图文动态评价
			</button>
			<button
				type="button"
				class="text-xs md:text-sm px-3.5 py-1.5 rounded-lg font-medium transition-all {viewMode === 'giscus' ? 'bg-[var(--primary)] text-white shadow-xs' : 'text-[var(--content-meta)] hover:text-[var(--deep-text)] bg-[var(--btn-regular-bg)]'}"
				onclick={() => (viewMode = "giscus")}
			>
				Giscus 留言板
			</button>
		</div>
		<span class="text-xs text-[var(--content-meta)] hidden sm:inline">
			{viewMode === "dynamic" ? "实景打卡相册与动态流" : "GitHub Discussions 实时留言"}
		</span>
	</div>

	{#if viewMode === "dynamic"}
		<SpotDynamicFeed
			{reviews}
			activeSpotId={activeSpot?.id}
			activeSpotName={activeSpot?.name}
			onRequestContact={() => (isContactModalOpen = true)}
		/>
	{:else}
		<!-- Giscus 挂载区（纯静态 Web Component，属性驱动更新） -->
		<div class="giscus-container min-h-[220px]">
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
					theme={typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light"}
					lang={giscusConfig.lang ?? "zh-CN"}
					loading={giscusConfig.loading ?? "lazy"}
				></giscus-widget>
			{:else}
				<div class="p-8 text-center rounded-xl bg-[var(--btn-regular-bg)] border border-dashed border-[var(--line-color)] text-[var(--content-meta)]">
					<p class="text-sm font-semibold mb-1 text-[var(--deep-text)]">
						Giscus 评论系统待绑定 GitHub 仓库
					</p>
					<p class="text-xs max-w-md mx-auto leading-relaxed">
						点位专属隔离切换引擎已就绪。在 <code>src/config/commentConfig.ts</code> 中填写您的 GitHub repo 与 repoId 即可激活实时评论输入。
					</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- 备用投稿与联系管理员弹窗 -->
{#if isContactModalOpen}
	<div class="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
		<div class="modal-card card-base max-w-md w-full p-6 relative rounded-2xl border border-[var(--line-color)] bg-[var(--card-bg)] shadow-2xl">
			<div class="flex items-center justify-between mb-4 border-b border-[var(--line-color)] pb-3">
				<h4 class="text-base font-bold text-[var(--deep-text)]">
					线下与备用投稿通道
				</h4>
				<button
					type="button"
					class="close-btn text-[var(--content-meta)] hover:text-[var(--deep-text)] text-sm p-1"
					aria-label="关闭弹窗"
					onclick={() => (isContactModalOpen = false)}
				>
					关闭
				</button>
			</div>

			<p class="text-xs text-[var(--content-meta)] leading-relaxed mb-4">
				{contactConfig?.noticeText}
			</p>

			<div class="space-y-3 mb-5">
				{#if contactConfig?.email}
					<div class="flex items-center justify-between p-3 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-color)]">
						<div class="flex flex-col">
							<span class="text-xs text-[var(--content-meta)]">管理员邮箱</span>
							<span class="text-sm font-mono font-medium text-[var(--deep-text)]">{contactConfig.email}</span>
						</div>
						<div class="flex items-center gap-2">
							<a
								href={mailtoUrl}
								class="text-xs px-2.5 py-1 rounded bg-[var(--primary)] text-white font-medium hover:opacity-90"
							>
								唤起邮件
							</a>
							<button
								type="button"
								class="text-xs px-2.5 py-1 rounded border border-[var(--line-color)] text-[var(--deep-text)] hover:bg-[var(--card-bg)]"
								onclick={() => handleCopy(contactConfig.email ?? "", "邮箱地址")}
							>
								复制
							</button>
						</div>
					</div>
				{/if}

				{#if contactConfig?.qq}
					<div class="flex items-center justify-between p-3 rounded-xl bg-[var(--btn-regular-bg)] border border-[var(--line-color)]">
						<div class="flex flex-col">
							<span class="text-xs text-[var(--content-meta)]">QQ / 交流群</span>
							<span class="text-sm font-mono font-medium text-[var(--deep-text)]">{contactConfig.qq}</span>
						</div>
						<button
							type="button"
							class="text-xs px-2.5 py-1 rounded border border-[var(--line-color)] text-[var(--deep-text)] hover:bg-[var(--card-bg)]"
							onclick={() => handleCopy(contactConfig.qq ?? "", "QQ号")}
						>
							复制
						</button>
					</div>
				{/if}
			</div>

			{#if copyMessage}
				<div class="text-xs text-center py-1 px-2 rounded bg-[var(--btn-regular-bg)] text-[var(--primary)] font-medium mb-3">
					{copyMessage}
				</div>
			{/if}

			<div class="text-right">
				<button
					type="button"
					class="text-xs px-4 py-2 rounded-lg bg-[var(--btn-regular-bg)] text-[var(--deep-text)] hover:bg-[var(--line-color)]"
					onclick={() => (isContactModalOpen = false)}
				>
					我知道了
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
.spot-comment-wrapper {
	transition: border-color 0.3s ease;
}

.action-btn,
.action-btn-primary {
	cursor: pointer;
}

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
