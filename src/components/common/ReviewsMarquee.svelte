<script lang="ts">
import { onDestroy, onMount } from "svelte";
import type { ReviewItem } from "@/types/review";

interface Props {
	/** 评价数据列表 */
	reviews: ReviewItem[];
	/** 滚动速度（像素/秒），默认 45 */
	speed?: number;
	/** 是否开启双排双向滚动（第一排向左，第二排向右），默认 true */
	twoWay?: boolean;
	/** 鼠标悬浮时是否暂停滚动，默认 true */
	pauseOnHover?: boolean;
	/** 点击卡片时的回调（如联动地图高亮或切换评论） */
	onSelectReview?: (item: ReviewItem) => void;
	/** 组件外层附加样式类名 */
	class?: string;
}

const {
	reviews = [],
	speed = 45,
	twoWay = true,
	pauseOnHover = true,
	onSelectReview,
	class: className = "",
}: Props = $props();

// 辅助：确保单行至少有充足的卡片数量以实现平滑无缝回环
function prepareRowItems(items: ReviewItem[]): ReviewItem[] {
	if (items.length === 0) return [];
	let result = [...items];
	while (result.length < 5) {
		result = result.concat(items);
	}
	return result;
}

const row1Items = $derived.by(() => {
	if (reviews.length === 0) return [];
	if (!twoWay) return prepareRowItems(reviews);
	const row = reviews.filter((_, idx) => idx % 2 === 0);
	return prepareRowItems(row.length > 0 ? row : reviews);
});

const row2Items = $derived.by(() => {
	if (reviews.length === 0 || !twoWay) return [];
	const row = reviews.filter((_, idx) => idx % 2 !== 0);
	return prepareRowItems(row.length > 0 ? row : reviews);
});

// 轨道管理状态结构
interface TrackState {
	container: HTMLDivElement;
	content: HTMLDivElement;
	direction: number; // -1: 向左, 1: 向右
	offset: number;
	halfWidth: number;
	isPaused: boolean;
	isDragging: boolean;
	startX: number;
	startOffset: number;
	lastTime: number;
}

let container1: HTMLDivElement | undefined = $state(undefined);
let content1: HTMLDivElement | undefined = $state(undefined);
let container2: HTMLDivElement | undefined = $state(undefined);
let content2: HTMLDivElement | undefined = $state(undefined);

let tracks: TrackState[] = [];
let animFrameId: number | null = null;
let resizeObserver: ResizeObserver | null = null;

function setupTrack(
	container: HTMLDivElement,
	content: HTMLDivElement,
	direction: number,
): TrackState {
	// 计算原始一半宽度
	const halfWidth = content.scrollWidth / 2;
	const initialOffset = direction === -1 ? 0 : -halfWidth;
	content.style.transform = `translateX(${initialOffset}px)`;

	const track: TrackState = {
		container,
		content,
		direction,
		offset: initialOffset,
		halfWidth,
		isPaused: false,
		isDragging: false,
		startX: 0,
		startOffset: initialOffset,
		lastTime: performance.now(),
	};

	// 鼠标悬停暂停
	if (pauseOnHover) {
		container.addEventListener("mouseenter", () => {
			if (!track.isDragging) track.isPaused = true;
		});
		container.addEventListener("mouseleave", () => {
			if (!track.isDragging) {
				track.isPaused = false;
				track.lastTime = performance.now();
			}
		});
	}

	// 拖拽手势
	const onDragStart = (clientX: number) => {
		track.isDragging = true;
		track.isPaused = true;
		track.startX = clientX;
		track.startOffset = track.offset;
		container.classList.add("is-dragging");
	};

	const onDragMove = (clientX: number) => {
		if (!track.isDragging) return;
		const deltaX = clientX - track.startX;
		let nextOffset = track.startOffset + deltaX;

		if (nextOffset <= -track.halfWidth) {
			nextOffset += track.halfWidth;
			track.startOffset += track.halfWidth;
		} else if (nextOffset > 0) {
			nextOffset -= track.halfWidth;
			track.startOffset -= track.halfWidth;
		}

		track.offset = nextOffset;
		content.style.transform = `translateX(${track.offset}px)`;
	};

	const onDragEnd = () => {
		if (!track.isDragging) return;
		track.isDragging = false;
		if (pauseOnHover) {
			track.isPaused = container.matches(":hover");
		} else {
			track.isPaused = false;
		}
		track.lastTime = performance.now();
		container.classList.remove("is-dragging");
	};

	// 鼠标事件
	container.addEventListener("mousedown", (e) => {
		if (e.button !== 0) return;
		onDragStart(e.clientX);
	});

	window.addEventListener("mousemove", (e) => {
		if (track.isDragging) onDragMove(e.clientX);
	});

	window.addEventListener("mouseup", () => {
		if (track.isDragging) onDragEnd();
	});

	// 触摸事件
	container.addEventListener(
		"touchstart",
		(e) => {
			if (e.touches.length === 1) onDragStart(e.touches[0].clientX);
		},
		{ passive: true },
	);

	container.addEventListener(
		"touchmove",
		(e) => {
			if (track.isDragging && e.touches.length === 1) {
				onDragMove(e.touches[0].clientX);
			}
		},
		{ passive: true },
	);

	container.addEventListener("touchend", onDragEnd);
	container.addEventListener("touchcancel", onDragEnd);

	return track;
}

function updateMeasurements() {
	for (const track of tracks) {
		track.halfWidth = track.content.scrollWidth / 2;
	}
}

function startAnimation() {
	function step(now: number) {
		for (const track of tracks) {
			if (track.isPaused) {
				track.lastTime = now;
				continue;
			}

			const elapsed = Math.min((now - track.lastTime) / 1000, 0.1);
			track.lastTime = now;

			track.offset += speed * track.direction * elapsed;

			if (track.offset <= -track.halfWidth) {
				track.offset += track.halfWidth;
			} else if (track.offset >= 0) {
				track.offset -= track.halfWidth;
			}

			track.content.style.transform = `translateX(${track.offset}px)`;
		}
		animFrameId = requestAnimationFrame(step);
	}

	const now = performance.now();
	for (const t of tracks) t.lastTime = now;
	animFrameId = requestAnimationFrame(step);
}

onMount(() => {
	tracks = [];
	if (container1 && content1) {
		tracks.push(setupTrack(container1, content1, -1));
	}
	if (twoWay && container2 && content2) {
		tracks.push(setupTrack(container2, content2, 1));
	}

	updateMeasurements();
	startAnimation();

	if (typeof ResizeObserver !== "undefined") {
		resizeObserver = new ResizeObserver(() => {
			updateMeasurements();
		});
		if (container1) resizeObserver.observe(container1);
		if (container2) resizeObserver.observe(container2);
	}
});

onDestroy(() => {
	if (animFrameId !== null) cancelAnimationFrame(animFrameId);
	if (resizeObserver) resizeObserver.disconnect();
});
</script>

<div class="reviews-marquee-wrapper {className}">
	<!-- 第一排：向左滚动 -->
	{#if row1Items.length > 0}
		<div class="marquee-container" bind:this={container1}>
			<div class="marquee-content" bind:this={content1}>
				<!-- 正本与镜像副本并排以数学方式无限循环 -->
				{#each [...row1Items, ...row1Items] as item, i (item.id + '-' + i)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="review-card"
						role="button"
						tabindex="0"
						onclick={() => onSelectReview?.(item)}
					>
						<div class="review-header">
							{#if item.avatar}
								<img src={item.avatar} alt={item.author} class="review-avatar" />
							{:else}
								<div class="review-avatar-placeholder">
									{item.author.slice(0, 1)}
								</div>
							{/if}
							<div class="review-meta">
								<div class="review-author-line">
									<span class="review-author">{item.author}</span>
									{#if item.tag}
										<span class="review-tag">{item.tag}</span>
									{/if}
								</div>
								<div class="review-stars" aria-label={`评分 ${item.rating} 星`}>
									{#each Array(5) as _, starIdx}
										<svg
											class="star-svg {starIdx < item.rating ? 'is-filled' : 'is-empty'}"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
											/>
										</svg>
									{/each}
								</div>
							</div>
						</div>
						<p class="review-body">{item.content}</p>
						{#if item.spotName}
							<div class="review-spot-footer">
								<span class="spot-icon">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
										<circle cx="12" cy="9" r="2.5" />
									</svg>
								</span>
								<span class="spot-name-text">{item.spotName}</span>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- 第二排：向右滚动 -->
	{#if twoWay && row2Items.length > 0}
		<div class="marquee-container mt-3" bind:this={container2}>
			<div class="marquee-content" bind:this={content2}>
				{#each [...row2Items, ...row2Items] as item, i (item.id + '-r2-' + i)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<div
						class="review-card"
						role="button"
						tabindex="0"
						onclick={() => onSelectReview?.(item)}
					>
						<div class="review-header">
							{#if item.avatar}
								<img src={item.avatar} alt={item.author} class="review-avatar" />
							{:else}
								<div class="review-avatar-placeholder">
									{item.author.slice(0, 1)}
								</div>
							{/if}
							<div class="review-meta">
								<div class="review-author-line">
									<span class="review-author">{item.author}</span>
									{#if item.tag}
										<span class="review-tag">{item.tag}</span>
									{/if}
								</div>
								<div class="review-stars" aria-label={`评分 ${item.rating} 星`}>
									{#each Array(5) as _, starIdx}
										<svg
											class="star-svg {starIdx < item.rating ? 'is-filled' : 'is-empty'}"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
											/>
										</svg>
									{/each}
								</div>
							</div>
						</div>
						<p class="review-body">{item.content}</p>
						{#if item.spotName}
							<div class="review-spot-footer">
								<span class="spot-icon">
									<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
										<circle cx="12" cy="9" r="2.5" />
									</svg>
								</span>
								<span class="spot-name-text">{item.spotName}</span>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
.reviews-marquee-wrapper {
	width: 100%;
	position: relative;
	overflow: hidden;
	padding: 8px 0;
}

.marquee-container {
	width: 100%;
	overflow: hidden;
	position: relative;
	cursor: grab;
	user-select: none;
	-webkit-mask-image: linear-gradient(
		to right,
		transparent 0%,
		black 5%,
		black 95%,
		transparent 100%
	);
	mask-image: linear-gradient(
		to right,
		transparent 0%,
		black 5%,
		black 95%,
		transparent 100%
	);
}

:global(.marquee-container.is-dragging) {
	cursor: grabbing;
}

.marquee-content {
	display: flex;
	width: max-content;
	white-space: nowrap;
	will-change: transform;
	align-items: stretch;
}

.review-card {
	width: 340px;
	min-height: 155px;
	padding: 18px 20px;
	margin: 0 10px;
	flex-shrink: 0;
	background-color: var(--card-bg);
	border: 1px solid var(--line-color);
	border-radius: var(--radius-large, 12px);
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
	transition:
		transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1),
		box-shadow 0.25s cubic-bezier(0.2, 0.8, 0.2, 1),
		border-color 0.25s ease;
	text-align: left;
}

.review-card:hover {
	transform: translateY(-3px);
	box-shadow: 0 10px 24px rgba(0, 0, 0, 0.07);
	border-color: var(--primary);
}

.review-header {
	display: flex;
	align-items: center;
	margin-bottom: 10px;
}

.review-avatar {
	width: 38px;
	height: 38px;
	border-radius: 50%;
	object-fit: cover;
	margin-right: 12px;
	flex-shrink: 0;
	border: 1px solid var(--line-color);
}

.review-avatar-placeholder {
	width: 38px;
	height: 38px;
	border-radius: 50%;
	background: var(--btn-regular-bg);
	color: var(--primary);
	font-weight: bold;
	font-size: 15px;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 12px;
	flex-shrink: 0;
	border: 1px solid var(--line-color);
}

.review-meta {
	display: flex;
	flex-direction: column;
	justify-content: center;
}

.review-author-line {
	display: flex;
	align-items: center;
	gap: 6px;
	margin-bottom: 2px;
}

.review-author {
	font-size: 14.5px;
	font-weight: 600;
	color: var(--deep-text);
	line-height: 1.2;
}

.review-tag {
	font-size: 11px;
	padding: 1px 6px;
	border-radius: 9999px;
	background: var(--btn-regular-bg);
	color: var(--btn-content);
	line-height: 1.2;
}

.review-stars {
	display: flex;
	align-items: center;
	gap: 2px;
}

.star-svg {
	width: 13px;
	height: 13px;
}

.star-svg.is-filled {
	color: var(--primary);
}

.star-svg.is-empty {
	color: var(--line-color);
}

.review-body {
	font-size: 13.5px;
	line-height: 1.6;
	color: var(--content-meta);
	white-space: normal;
	word-break: break-word;
	margin: 0;
	flex-grow: 1;
	display: -webkit-box;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

.review-spot-footer {
	display: flex;
	align-items: center;
	gap: 4px;
	margin-top: 10px;
	font-size: 12px;
	color: var(--btn-content);
}

.spot-icon svg {
	width: 13px;
	height: 13px;
}

.spot-name-text {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

@media (max-width: 768px) {
	.review-card {
		width: 270px;
		min-height: 140px;
		padding: 14px 16px;
		margin: 0 6px;
	}
	.review-avatar,
	.review-avatar-placeholder {
		width: 32px;
		height: 32px;
		font-size: 13px;
		margin-right: 8px;
	}
	.review-author {
		font-size: 13.5px;
	}
	.review-body {
		font-size: 12.5px;
		-webkit-line-clamp: 2;
	}
	.marquee-container {
		-webkit-mask-image: linear-gradient(
			to right,
			transparent 0%,
			black 3%,
			black 97%,
			transparent 100%
		);
		mask-image: linear-gradient(
			to right,
			transparent 0%,
			black 3%,
			black 97%,
			transparent 100%
		);
	}
}
</style>
