<script lang="ts">
	import type { Spot, SpotIndustry } from "@/types/spot";
	import type { CategoryMeta } from "@/config/mapConfig";
	import {
		createMarkerElement,
		buildInfoWindowHtml,
	} from "@/utils/map-marker-utils";

	interface Props {
		spots: Spot[];
		amapKey: string;
		amapSecurityKey: string;
		center: [number, number];
		zoom: number;
		categories: Record<SpotIndustry, CategoryMeta>;
	}

	const {
		spots,
		amapKey,
		amapSecurityKey,
		center,
		zoom,
		categories,
	}: Props = $props();

	// 分类筛选列表
	const allIndustries: SpotIndustry[] = [
		"campus",
		"dining",
		"scenic",
		"shopping",
		"enjoy",
		"residential",
		"other",
	];

	let activeFilters: Set<SpotIndustry> = $state(new Set(allIndustries));

	function toggleFilter(industry: SpotIndustry): void {
		const next = new Set(activeFilters);
		if (next.has(industry)) {
			if (next.size > 1) {
				next.delete(industry);
			}
		} else {
			next.add(industry);
		}
		activeFilters = next;
	}

	function selectAll(): void {
		activeFilters = new Set(allIndustries);
	}

	const isAllSelected: boolean = $derived(
		activeFilters.size === allIndustries.length,
	);

	// 统计各分类点位数量
	const categoryCounts: Record<SpotIndustry, number> = $derived(
		allIndustries.reduce(
			(acc, ind) => {
				acc[ind] = spots.filter((s) => s.industry === ind).length;
				return acc;
			},
			{} as Record<SpotIndustry, number>,
		),
	);

	// 地图实例状态
	let mapContainer: HTMLDivElement | undefined = $state(undefined);
	let mapInstance: any = $state(null);
	let markers: any[] = $state([]);
	let infoWindow: any = $state(null);
	let mapLoaded: boolean = $state(false);
	let loadError: string = $state("");

	// 初始化高德地图
	async function loadMap(): Promise<void> {
		if (!mapContainer || !amapKey) return;

		try {
			(window as any)._AMapSecurityConfig = {
				securityJsCode: amapSecurityKey,
			};

			const AMapLoader = (await import("@amap/amap-jsapi-loader")).default;
			const AMap = await AMapLoader.load({
				key: amapKey,
				version: "2.0",
			});

			mapInstance = new AMap.Map(mapContainer, {
				zoom: zoom,
				center: center,
				viewMode: "2D",
				resizeEnable: true,
			});

			infoWindow = new AMap.InfoWindow({
				isCustom: true,
				offset: new AMap.Pixel(0, -36),
				autoMove: true,
			});

			AMap.plugin(["AMap.Scale", "AMap.ToolBar"], () => {
				mapInstance.addControl(new AMap.Scale());
				mapInstance.addControl(
					new AMap.ToolBar({
						position: { top: "10px", right: "10px" },
					}),
				);
			});

			createMarkers(AMap);
			mapLoaded = true;
		} catch (err: any) {
			loadError = err?.message || "地图加载失败";
		}
	}

	// 创建地图标记点
	function createMarkers(AMap: any): void {
		for (const m of markers) {
			mapInstance.remove(m);
		}
		markers = [];

		for (const spot of spots) {
			const cat = categories[spot.industry];
			const { dom, offset } = createMarkerElement(spot, cat);

			const marker = new AMap.Marker({
				position: new AMap.LngLat(spot.lon, spot.lat),
				content: dom,
				offset: new AMap.Pixel(offset[0], offset[1]),
				extData: spot,
			});

			marker.on("click", () => {
				const contentHtml = buildInfoWindowHtml(spot, cat);
				const container = document.createElement("div");
				container.className = "spot-info-container";
				container.innerHTML = `
					<div class="spot-info-bubble">
						${contentHtml}
						<button class="spot-info-close" aria-label="关闭">&times;</button>
					</div>
					<div class="spot-info-arrow"></div>
				`;
				container
					.querySelector(".spot-info-close")
					?.addEventListener("click", () => {
						infoWindow.close();
					});

				infoWindow.setContent(container);
				infoWindow.open(mapInstance, marker.getPosition());
			});

			markers.push(marker);
		}

		mapInstance.add(markers);
	}

	// 响应筛选状态变化
	$effect(() => {
		if (!mapInstance || markers.length === 0) return;
		for (const marker of markers) {
			const spot: Spot = marker.getExtData();
			if (activeFilters.has(spot.industry)) {
				marker.show();
			} else {
				marker.hide();
			}
		}
	});

	// 生命周期：容器与 Key 准备好时挂载
	$effect(() => {
		if (mapContainer && amapKey) {
			loadMap();
		}
	});
</script>

<!-- 分类筛选栏 -->
<div class="spot-filter-bar">
	<button
		class="spot-filter-btn"
		class:active={isAllSelected}
		onclick={selectAll}
	>
		全部
		<span class="spot-filter-count">{spots.length}</span>
	</button>
	{#each allIndustries as industry}
		{@const cat = categories[industry]}
		{@const count = categoryCounts[industry]}
		{#if count > 0}
			<button
				class="spot-filter-btn"
				class:active={activeFilters.has(industry)}
				onclick={() => toggleFilter(industry)}
				style="--cat-color: {cat.color}"
			>
				<span
					class="spot-filter-dot"
					style="background: {cat.color}"
				></span>
				{cat.label}
				<span class="spot-filter-count">{count}</span>
			</button>
		{/if}
	{/each}
</div>

<!-- 地图容器 -->
<div class="spot-map-wrapper">
	{#if loadError}
		<div class="spot-map-error">
			<p>地图加载失败: {loadError}</p>
			<button onclick={loadMap}>重试</button>
		</div>
	{/if}
	{#if !mapLoaded && !loadError}
		<div class="spot-map-loading">
			<div class="spot-loading-spinner"></div>
			<p>地图加载中...</p>
		</div>
	{/if}
	<div bind:this={mapContainer} class="spot-map-container"></div>
</div>

<style>
	/* ── 筛选栏 ────────────────────────────── */
	.spot-filter-bar {
		display: flex;
		gap: 8px;
		padding: 12px 0;
		overflow-x: auto;
		scrollbar-width: none;
		-webkit-overflow-scrolling: touch;
	}
	.spot-filter-bar::-webkit-scrollbar {
		display: none;
	}
	.spot-filter-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 14px;
		border-radius: 20px;
		border: 1.5px solid var(--btn-regular-bg, #e5e7eb);
		background: transparent;
		color: var(--content-text, #374151);
		font-size: 0.85rem;
		font-weight: 500;
		white-space: nowrap;
		cursor: pointer;
		transition: all 0.2s;
		flex-shrink: 0;
	}
	.spot-filter-btn:hover {
		border-color: var(--cat-color, var(--primary, #3b82f6));
		background: color-mix(
			in srgb,
			var(--cat-color, var(--primary, #3b82f6)) 8%,
			transparent
		);
	}
	.spot-filter-btn.active {
		border-color: var(--cat-color, var(--primary, #3b82f6));
		background: color-mix(
			in srgb,
			var(--cat-color, var(--primary, #3b82f6)) 15%,
			transparent
		);
		color: var(--cat-color, var(--primary, #3b82f6));
	}
	.spot-filter-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	.spot-filter-count {
		font-size: 0.75rem;
		opacity: 0.6;
	}

	/* ── 地图容器 ────────────────────────────── */
	.spot-map-wrapper {
		position: relative;
		border-radius: var(--radius-large, 16px);
		overflow: hidden;
	}
	.spot-map-container {
		width: 100%;
		height: 70vh;
	}
	@media (max-width: 768px) {
		.spot-map-container {
			height: 60vh;
		}
	}

	/* ── 加载与错误状态 ──────────────────────── */
	.spot-map-loading,
	.spot-map-error {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: var(--card-bg, #f9fafb);
		z-index: 10;
		gap: 12px;
		color: var(--content-meta, #6b7280);
	}
	.spot-map-error button {
		padding: 8px 20px;
		border-radius: 8px;
		border: none;
		background: var(--primary, #3b82f6);
		color: white;
		cursor: pointer;
	}
	.spot-loading-spinner {
		width: 32px;
		height: 32px;
		border: 3px solid var(--btn-regular-bg, #e5e7eb);
		border-top-color: var(--primary, #3b82f6);
		border-radius: 50%;
		animation: spot-spin 0.8s linear infinite;
	}
	@keyframes spot-spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* ── 标点与弹窗全局样式 ─────────────────── */
	:global(.spot-marker-custom) {
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.35));
		transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
		user-select: none;
	}
	:global(.spot-marker-custom:hover) {
		transform: scale(1.18);
		filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.45));
		z-index: 99;
	}
	:global(.spot-marker-img) {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
	}
	:global(.spot-marker-pin) {
		width: 28px;
		height: 28px;
		border-radius: 50% 50% 50% 0;
		border: 2px solid white;
		transform: rotate(-45deg);
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
		cursor: pointer;
		position: relative;
		transition: transform 0.2s;
	}
	:global(.spot-marker-pin:hover) {
		transform: rotate(-45deg) scale(1.15);
	}
	:global(.spot-marker-dot) {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: white;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
	:global(.spot-info-container) {
		position: relative;
	}
	:global(.spot-info-bubble) {
		position: relative;
		background: white;
		border-radius: 12px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
		padding: 16px;
		min-width: 260px;
		max-width: 320px;
	}
	:global(.dark .spot-info-bubble) {
		background: #1f2937;
		color: #e5e7eb;
	}
	:global(.spot-info-arrow) {
		width: 0;
		height: 0;
		border-left: 8px solid transparent;
		border-right: 8px solid transparent;
		border-top: 8px solid white;
		margin: 0 auto;
	}
	:global(.dark .spot-info-arrow) {
		border-top-color: #1f2937;
	}
	:global(.spot-info-close) {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 24px;
		height: 24px;
		border: none;
		background: transparent;
		font-size: 18px;
		cursor: pointer;
		color: #9ca3af;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		transition: background 0.2s;
	}
	:global(.spot-info-close:hover) {
		background: rgba(0, 0, 0, 0.05);
	}
	:global(.spot-info-header) {
		margin-bottom: 10px;
	}
	:global(.spot-category-badge) {
		display: inline-block;
		padding: 2px 10px;
		border-radius: 12px;
		color: white;
		font-size: 0.7rem;
		font-weight: 600;
		margin-bottom: 6px;
	}
	:global(.spot-name) {
		font-size: 1rem;
		font-weight: 700;
		margin: 0;
		color: #111827;
	}
	:global(.dark .spot-name) {
		color: #f3f4f6;
	}
	:global(.spot-address-link) {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 12px;
		margin: 8px 0;
		background: #f3f4f6;
		border-radius: 10px;
		text-decoration: none;
		color: #374151;
		font-size: 0.85rem;
		transition: background 0.2s;
		cursor: pointer;
	}
	:global(.dark .spot-address-link) {
		background: #374151;
		color: #d1d5db;
	}
	:global(.spot-address-link:hover) {
		background: #e5e7eb;
	}
	:global(.dark .spot-address-link:hover) {
		background: #4b5563;
	}
	:global(.spot-nav-icon) {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
		color: #3b82f6;
	}
	:global(.spot-nav-arrow) {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
		margin-left: auto;
		color: #9ca3af;
	}
	:global(.spot-meta-row) {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.8rem;
		color: #6b7280;
	}
	:global(.dark .spot-meta-row) {
		color: #9ca3af;
	}
	:global(.spot-meta-divider) {
		opacity: 0.3;
	}
	:global(.spot-rating-empty) {
		color: #9ca3af;
		font-size: 0.8rem;
	}
	:global(.spot-rating) {
		display: inline-flex;
		align-items: center;
		gap: 2px;
	}
	:global(.star-full) {
		color: #f59e0b;
	}
	:global(.star-half) {
		color: #fbbf24;
	}
	:global(.star-empty) {
		color: #d1d5db;
	}
	:global(.rating-num) {
		margin-left: 4px;
		font-weight: 600;
		color: #f59e0b;
	}
</style>
