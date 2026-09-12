<script lang="ts">
import type { ReviewItem } from "@/types/review";

interface Props {
	/** 评价列表 */
	reviews: ReviewItem[];
	/** 当前选中的点位 ID（如果处于点位专属模式） */
	activeSpotId?: string | null;
	/** 当前选中的点位名称 */
	activeSpotName?: string | null;
	/** 请求打开投稿弹窗的回调 */
	onRequestContact?: () => void;
}

const {
	reviews = [],
	activeSpotId = null,
	activeSpotName = null,
	onRequestContact,
}: Props = $props();

// 过滤当前展示的评价（点位模式下展示该点位评价，全站模式下展示全部评价）
const displayReviews = $derived.by(() => {
	if (!activeSpotId) return reviews;
	const filtered = reviews.filter((r) => r.spotId === activeSpotId);
	return filtered.length > 0 ? filtered : [];
});

// 每个卡片的图片展开查看器状态：reviewId -> { isOpen, activeIndex }
let galleryStates = $state<
	Record<string, { isOpen: boolean; activeIndex: number }>
>({});

function openViewer(reviewId: string, index: number) {
	galleryStates[reviewId] = { isOpen: true, activeIndex: index };
}

function collapseViewer(reviewId: string) {
	if (galleryStates[reviewId]) {
		galleryStates[reviewId] = {
			...galleryStates[reviewId],
			isOpen: false,
		};
	}
}

function setViewerIndex(reviewId: string, index: number, total: number) {
	const safeIndex = (index + total) % total;
	galleryStates[reviewId] = {
		isOpen: true,
		activeIndex: safeIndex,
	};
}

function openLightbox(url: string) {
	if (typeof window !== "undefined") {
		window.open(url, "_blank", "noopener,noreferrer");
	}
}
</script>

<div class="spot-dynamic-feed-container space-y-4">
	{#if displayReviews.length > 0}
		{#each displayReviews as item (item.id)}
			{@const images = item.images ?? []}
			{@const state = galleryStates[item.id] ?? { isOpen: false, activeIndex: 0 }}
			{@const activeImg = images[state.activeIndex] ?? images[0]}

			<article class="dynamic-entry card-base p-5 md:p-6 transition-all duration-200">
				<!-- 卡片头部：头像、作者、时间、点位标签、评分、引用标识 -->
				<header class="dynamic-entry-header">
					<div class="dynamic-avatar">
						{#if item.avatar}
							<img src={item.avatar} alt={item.author} loading="lazy" />
						{:else}
							<div class="w-full h-full rounded-full bg-[var(--btn-regular-bg)] text-[var(--primary)] font-bold flex items-center justify-center text-sm border border-[var(--line-color)]">
								{item.author.slice(0, 1)}
							</div>
						{/if}
					</div>

					<div class="dynamic-identity">
						<div class="flex items-center gap-2 flex-wrap">
							<strong class="text-sm md:text-base font-bold text-[var(--deep-text)]">
								{item.author}
							</strong>
							{#if item.tag}
								<span class="text-[11px] px-2 py-0.5 rounded-full bg-[var(--btn-regular-bg)] text-[var(--btn-content)] font-medium">
									{item.tag}
								</span>
							{/if}
						</div>

						<div class="dynamic-meta mt-1 flex items-center gap-3 flex-wrap">
							{#if item.date}
								<span class="dynamic-time text-xs text-[var(--content-meta)]">
									{item.date}
								</span>
							{/if}
							{#if item.spotName}
								<span class="dynamic-location text-xs text-[var(--btn-content)] flex items-center gap-1">
									<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
										<circle cx="12" cy="9" r="2.5" />
									</svg>
									<span>{item.spotName}</span>
								</span>
							{/if}

							<!-- 星级评分 -->
							<div class="flex items-center gap-0.5 ml-auto" aria-label={`评分 ${item.rating} 星`}>
								{#each Array(5) as _, starIdx}
									<svg
										class="w-3.5 h-3.5 {starIdx < item.rating ? 'text-[#f59e0b]' : 'text-[var(--line-color)]'}"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
									</svg>
								{/each}
							</div>
						</div>
					</div>

					<!-- 右侧装饰图标 -->
					<div class="text-[var(--primary)] opacity-40 ml-2 hidden sm:block">
						<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
							<path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
						</svg>
					</div>
				</header>

				<!-- 正文内容 -->
				<div class="dynamic-content mt-3 text-sm md:text-base leading-relaxed text-[var(--deep-text)]">
					<p>{item.content}</p>
				</div>

				<!-- 多图画廊组件（完全继承 dynamic 规范与交互） -->
				{#if images.length > 0}
					<div class="dynamic-gallery mt-3">
						{#if !state.isOpen}
							<!-- 1. 网格缩略图模式（支持 1/2/3/4/5/6 宫格自适应与 +N 提示） -->
							<div
								class="dynamic-gallery-grid"
								data-count={String(Math.min(images.length, 6))}
								data-layout={images.length === 1 ? "single" : "grid"}
							>
								{#each images.slice(0, 6) as imgUrl, imgIdx}
									<button
										type="button"
										class="dynamic-gallery-grid-item"
										aria-label={`查看第 ${imgIdx + 1} 张图片`}
										onclick={() => openViewer(item.id, imgIdx)}
									>
										<img src={imgUrl} alt={`评价配图 ${imgIdx + 1}`} loading="lazy" />
										{#if imgIdx === 5 && images.length > 6}
											<span class="dynamic-gallery-more">
												+{images.length - 6}
											</span>
										{/if}
									</button>
								{/each}
							</div>
						{:else}
							<!-- 2. 大图展示与展开查看器模式 -->
							<div class="dynamic-gallery-viewer">
								<div class="dynamic-gallery-toolbar">
									<button
										type="button"
										class="btn-plain dynamic-gallery-action"
										onclick={() => collapseViewer(item.id)}
									>
										<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0v6m0-6l7 7M4 10h6m0 0V4m0 6L3 3m17 7h-6m0 0V4m0 6l7-7" />
										</svg>
										<span>收起</span>
									</button>
									<button
										type="button"
										class="btn-plain dynamic-gallery-action"
										onclick={() => openLightbox(activeImg)}
									>
										<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
										</svg>
										<span>查看大图</span>
									</button>
									<span class="dynamic-gallery-counter">
										{state.activeIndex + 1} / {images.length}
									</span>
								</div>

								<!-- 舞台主图区与左右切换按钮 -->
								<div class="dynamic-gallery-stage">
									{#if images.length > 1}
										<button
											type="button"
											class="btn-plain dynamic-gallery-nav dynamic-gallery-prev"
											aria-label="上一张图片"
											onclick={() => setViewerIndex(item.id, state.activeIndex - 1, images.length)}
										>
											<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
												<polyline points="15 18 9 12 15 6" />
											</svg>
										</button>
									{/if}

									<img
										class="dynamic-gallery-main-image"
										src={activeImg}
										alt={`当前展示图片 ${state.activeIndex + 1}`}
									/>

									{#if images.length > 1}
										<button
											type="button"
											class="btn-plain dynamic-gallery-nav dynamic-gallery-next"
											aria-label="下一张图片"
											onclick={() => setViewerIndex(item.id, state.activeIndex + 1, images.length)}
										>
											<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
												<polyline points="9 18 15 12 9 6" />
											</svg>
										</button>
									{/if}
								</div>

								<!-- 底部缩略图排 -->
								{#if images.length > 1}
									<div class="dynamic-gallery-thumbnails">
										{#each images as thumbUrl, thumbIdx}
											<button
												type="button"
												class="dynamic-gallery-thumbnail"
												data-active={thumbIdx === state.activeIndex ? "true" : "false"}
												aria-label={`选择第 ${thumbIdx + 1} 张`}
												onclick={() => setViewerIndex(item.id, thumbIdx, images.length)}
											>
												<img src={thumbUrl} alt="" loading="lazy" />
											</button>
										{/each}
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/if}
			</article>
		{/each}
	{:else}
		<!-- 暂无该点位专属图文评价时的提示 -->
		<div class="p-8 text-center rounded-xl bg-[var(--btn-regular-bg)] border border-dashed border-[var(--line-color)] text-[var(--content-meta)]">
			<div class="w-12 h-12 mx-auto mb-3 rounded-full bg-[var(--card-bg)] flex items-center justify-center text-[var(--primary)] border border-[var(--line-color)]">
				<svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
					<path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
			</div>
			<p class="text-sm font-semibold mb-1 text-[var(--deep-text)]">
				{activeSpotName ? `${activeSpotName} 暂无图文评价` : "暂无图文评价"}
			</p>
			<p class="text-xs max-w-sm mx-auto leading-relaxed mb-4">
				成为第一个为该点位留下真实口碑和实景打卡照片的同学吧！
			</p>
			{#if onRequestContact}
				<button
					type="button"
					class="text-xs px-3.5 py-1.5 rounded-lg bg-[var(--primary)] text-white font-medium hover:opacity-90 transition-opacity"
					onclick={onRequestContact}
				>
					投稿打卡实景或评价
				</button>
			{/if}
		</div>
	{/if}
</div>

<style>
.dynamic-entry {
	margin-bottom: 1rem;
	border: 1px solid var(--line-color);
	border-radius: var(--radius-large, 12px);
	background: var(--card-bg);
}

.dynamic-entry:hover {
	border-color: color-mix(in srgb, var(--primary) 35%, var(--line-color));
}

.dynamic-gallery {
	margin: 0.75rem 0 0 0;
	width: 100%;
}
</style>
