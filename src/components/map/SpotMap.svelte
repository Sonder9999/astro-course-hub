<script lang="ts">
import type {
	CategoryMeta,
	MapClusterConfig,
	MapThemeStyles,
} from "@/config/mapConfig";
import type { Spot, SpotIndustry } from "@/types/spot";
import {
	buildInfoWindowHtml,
	createClusterMarkerElement,
	createMarkerElement,
} from "@/utils/map-marker-utils";

interface Props {
	spots: Spot[];
	amapKey: string;
	amapSecurityKey: string;
	center: [number, number];
	zoom: number;
	iconScale?: string | number;
	themeStyles?: MapThemeStyles;
	cluster?: MapClusterConfig;
	categories: Record<SpotIndustry, CategoryMeta>;
}

const {
	spots,
	amapKey,
	amapSecurityKey,
	center,
	zoom,
	iconScale = "90%",
	themeStyles = { light: "amap://styles/normal", dark: "amap://styles/dark" },
	cluster = { enable: true, gridSize: 60, maxZoom: 16 },
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

// 地图实例与聚合对象状态
let mapContainer: HTMLDivElement | undefined = $state(undefined);
let mapInstance: any = $state(null);
let clusterInstance: any = $state(null);
let rawMarkers: any[] = $state([]);
let infoWindow: any = $state(null);
let mapLoaded: boolean = $state(false);
let isMapLoading = false;
let loadError: string = $state("");

let themeObserver: MutationObserver | null = null;

// 根据当前页面深浅主题动态切换地图底图
function updateMapTheme(): void {
	if (!mapInstance) return;
	const isDark =
		typeof document !== "undefined" &&
		document.documentElement.classList.contains("dark");
	const targetStyle = isDark
		? (themeStyles?.dark ?? "amap://styles/dark")
		: (themeStyles?.light ?? "amap://styles/normal");
	mapInstance.setMapStyle(targetStyle);
}

// 打开信息弹窗
function openSpotInfoWindow(spot: Spot, position: any): void {
	const cat = categories[spot.industry];
	const contentHtml = buildInfoWindowHtml(spot, cat);
	const container = document.createElement("div");
	container.className = "spot-info-container";
	container.innerHTML = `
			<div class="spot-info-bubble">
				<button class="spot-info-close" aria-label="关闭" title="关闭">
					<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
				${contentHtml}
			</div>
			<div class="spot-info-arrow"></div>
		`;
	container.querySelector(".spot-info-close")?.addEventListener("click", () => {
		infoWindow.close();
	});

	infoWindow.setContent(container);
	infoWindow.open(mapInstance, position);
}

// 初始化高德地图与点位聚合
async function loadMap(): Promise<void> {
	if (!mapContainer || !amapKey || isMapLoading || mapLoaded) return;
	isMapLoading = true;

	try {
		if (typeof window !== "undefined" && !(window as any).___onAPILoaded) {
			(window as any).___onAPILoaded = () => {};
		}

		(window as any)._AMapSecurityConfig = {
			securityJsCode: amapSecurityKey,
		};

		const AMapLoader = (await import("@amap/amap-jsapi-loader")).default;
		const AMap = await AMapLoader.load({
			key: amapKey,
			version: "2.0",
			plugins: ["AMap.Scale", "AMap.ToolBar", "AMap.MarkerCluster"],
		});

		const isDark =
			typeof document !== "undefined" &&
			document.documentElement.classList.contains("dark");
		const initialMapStyle = isDark
			? (themeStyles?.dark ?? "amap://styles/dark")
			: (themeStyles?.light ?? "amap://styles/normal");

		mapInstance = new AMap.Map(mapContainer, {
			zoom: zoom,
			center: center,
			viewMode: "2D",
			resizeEnable: true,
			mapStyle: initialMapStyle,
		});

		infoWindow = new AMap.InfoWindow({
			isCustom: true,
			offset: new AMap.Pixel(0, -36),
			autoMove: true,
		});

		mapInstance.addControl(new AMap.Scale());
		mapInstance.addControl(
			new AMap.ToolBar({
				position: { top: "10px", right: "10px" },
			}),
		);

		if (cluster.enable && AMap.MarkerCluster) {
			initCluster(AMap);
		} else {
			initRawMarkers(AMap);
		}

		mapLoaded = true;
	} catch (err: any) {
		loadError = err?.message || "地图加载失败";
	} finally {
		isMapLoading = false;
	}
}

// 聚合模式初始化
function initCluster(AMap: any): void {
	const points = spots.map((s) => ({
		lnglat: [s.lon, s.lat],
		data: s,
	}));

	clusterInstance = new AMap.MarkerCluster(mapInstance, points, {
		gridSize: cluster.gridSize,
		maxZoom: cluster.maxZoom,
		renderClusterMarker: (context: any) => {
			const { dom, offset } = createClusterMarkerElement(
				context.count,
				cluster.icon,
				cluster.scale ?? "125%",
				iconScale,
			);
			context.marker.setContent(dom);
			context.marker.setOffset(new AMap.Pixel(offset[0], offset[1]));
		},
		renderMarker: (context: any) => {
			const spot: Spot = context.data[0].data;
			const cat = categories[spot.industry];
			const { dom, offset } = createMarkerElement(spot, cat, iconScale);
			context.marker.setContent(dom);
			context.marker.setOffset(new AMap.Pixel(offset[0], offset[1]));

			// 为单个点位 DOM 绑定点击事件，确保 100% 触发弹窗
			dom.onclick = (e: MouseEvent) => {
				e.stopPropagation();
				openSpotInfoWindow(spot, context.marker.getPosition());
			};

			// 为单个 AMap.Marker 对象绑定点击监听
			context.marker.setExtData(spot);
			context.marker.off("click");
			context.marker.on("click", () => {
				openSpotInfoWindow(spot, context.marker.getPosition());
			});
		},
	});

	clusterInstance.on("click", (e: any) => {
		if (e.clusterData && e.clusterData.length > 1) {
			mapInstance.setZoomAndCenter(mapInstance.getZoom() + 2, e.lnglat);
		} else if (e.clusterData && e.clusterData.length === 1) {
			const spot: Spot = e.clusterData[0].data;
			openSpotInfoWindow(spot, e.lnglat);
		}
	});
}

// 普通标记模式（聚合关闭时的回退）
function initRawMarkers(AMap: any): void {
	for (const m of rawMarkers) {
		mapInstance.remove(m);
	}
	rawMarkers = [];

	for (const spot of spots) {
		const cat = categories[spot.industry];
		const { dom, offset } = createMarkerElement(spot, cat, iconScale);

		const marker = new AMap.Marker({
			position: new AMap.LngLat(spot.lon, spot.lat),
			content: dom,
			offset: new AMap.Pixel(offset[0], offset[1]),
			extData: spot,
		});

		marker.on("click", () => {
			openSpotInfoWindow(spot, marker.getPosition());
		});

		rawMarkers.push(marker);
	}

	mapInstance.add(rawMarkers);
}

// 响应分类筛选状态变化
$effect(() => {
	if (clusterInstance) {
		const filteredPoints = spots
			.filter((s) => activeFilters.has(s.industry))
			.map((s) => ({
				lnglat: [s.lon, s.lat],
				data: s,
			}));
		clusterInstance.setData(filteredPoints);
	} else if (rawMarkers.length > 0) {
		for (const marker of rawMarkers) {
			const spot: Spot = marker.getExtData();
			if (activeFilters.has(spot.industry)) {
				marker.show();
			} else {
				marker.hide();
			}
		}
	}
});

// 联动全站昼夜主题切换
$effect(() => {
	if (mapLoaded && mapInstance && typeof MutationObserver !== "undefined") {
		updateMapTheme();
		themeObserver = new MutationObserver(() => {
			updateMapTheme();
		});
		themeObserver.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"],
		});
	}
	return () => {
		if (themeObserver) {
			themeObserver.disconnect();
			themeObserver = null;
		}
	};
});

// 生命周期：容器与 Key 准备就绪时挂载与卸载清理
$effect(() => {
	if (mapContainer && amapKey && !mapLoaded && !isMapLoading) {
		loadMap();
	}
	return () => {
		if (themeObserver) {
			themeObserver.disconnect();
			themeObserver = null;
		}
		if (mapInstance) {
			try {
				mapInstance.destroy();
			} catch {}
			mapInstance = null;
			mapLoaded = false;
		}
	};
});
</script>

<!-- 分类筛选栏（自适应换行，确保移动端全部可见可点击） -->
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
	/* ── 筛选栏（移动端友好换行排布） ────────── */
	.spot-filter-bar {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: 10px 0;
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
	}
	.spot-filter-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 13px;
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
		user-select: none;
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
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
		width: 100%;
		min-width: 0;
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

	/* ── 聚合大图标与红圈数字角标 ──────────── */
	:global(.spot-cluster-container) {
		position: relative;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.4));
		transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
		user-select: none;
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
	}
	:global(.spot-cluster-container:hover) {
		transform: scale(1.15);
		filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.55));
		z-index: 100;
	}
	:global(.spot-cluster-img) {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
		pointer-events: none;
	}
	:global(.spot-cluster-count-badge) {
		position: absolute;
		top: -4px;
		right: -8px;
		background: #ef4444;
		color: white;
		font-weight: 700;
		font-size: 0.72rem;
		min-width: 18px;
		height: 18px;
		line-height: 16px;
		padding: 0 4px;
		border-radius: 9999px;
		border: 1.5px solid white;
		box-shadow: 0 2px 5px rgba(239, 68, 68, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		pointer-events: none;
	}

	/* ── 标点与弹窗全局样式 ─────────────────── */
	:global(.spot-marker-custom) {
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.35));
		transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
		user-select: none;
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
	}
	:global(.spot-marker-custom:hover) {
		transform: scale(1.18);
		filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.45));
		z-index: 99;
	}
	:global(.spot-marker-img) {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
	}
	:global(.spot-marker-pin) {
		border-radius: 50% 50% 50% 0;
		border: 2px solid white;
		transform: rotate(-45deg);
		box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
		cursor: pointer;
		position: relative;
		transition: transform 0.2s;
		-webkit-tap-highlight-color: transparent;
	}
	:global(.spot-marker-pin:hover) {
		transform: rotate(-45deg) scale(1.15);
	}
	:global(.spot-marker-dot) {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: white;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
	/* ── 现代高颜值毛玻璃信息弹窗（契合站点动态主题） ────────── */
	:global(.spot-info-container) {
		position: relative;
		animation: spot-bubble-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
	}
	@keyframes spot-bubble-in {
		from {
			opacity: 0;
			transform: scale(0.92) translateY(6px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	:global(.spot-info-bubble) {
		position: relative;
		min-width: 270px;
		max-width: 330px;
		padding: 15px 16px 13px;
		border-radius: var(--radius-large, 16px);
		box-sizing: border-box;

		/* 亮色毛玻璃与主题融合微边框 */
		background: color-mix(in srgb, var(--card-bg, #ffffff) 88%, transparent);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid color-mix(in srgb, var(--primary, #3b82f6) 18%, rgba(0, 0, 0, 0.08));
		box-shadow:
			0 12px 30px -4px rgba(0, 0, 0, 0.12),
			0 4px 12px -2px rgba(0, 0, 0, 0.06),
			0 0 0 1px color-mix(in srgb, var(--primary, #3b82f6) 8%, transparent);
		color: var(--deep-text, #1f2937);
		transition: background-color 0.25s, border-color 0.25s, box-shadow 0.25s;
	}

	:global(.dark .spot-info-bubble) {
		/* 暗色毛玻璃与主题融合微边框 */
		background: color-mix(in srgb, var(--card-bg, #181a20) 84%, transparent);
		border: 1px solid color-mix(in srgb, var(--primary, #3b82f6) 24%, rgba(255, 255, 255, 0.12));
		box-shadow:
			0 16px 36px -4px rgba(0, 0, 0, 0.55),
			0 4px 14px -2px rgba(0, 0, 0, 0.35),
			0 0 16px color-mix(in srgb, var(--primary, #3b82f6) 15%, transparent);
		color: #f3f4f6;
	}

	/* 指向点位标记的下方小三角 */
	:global(.spot-info-arrow) {
		position: relative;
		width: 12px;
		height: 12px;
		margin: -6px auto 0;
		transform: rotate(45deg);
		background: color-mix(in srgb, var(--card-bg, #ffffff) 92%, transparent);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-right: 1px solid color-mix(in srgb, var(--primary, #3b82f6) 18%, rgba(0, 0, 0, 0.08));
		border-bottom: 1px solid color-mix(in srgb, var(--primary, #3b82f6) 18%, rgba(0, 0, 0, 0.08));
		z-index: 1;
		transition: background-color 0.25s, border-color 0.25s;
	}
	:global(.dark .spot-info-arrow) {
		background: color-mix(in srgb, var(--card-bg, #181a20) 88%, transparent);
		border-right: 1px solid color-mix(in srgb, var(--primary, #3b82f6) 24%, rgba(255, 255, 255, 0.12));
		border-bottom: 1px solid color-mix(in srgb, var(--primary, #3b82f6) 24%, rgba(255, 255, 255, 0.12));
	}

	/* 关闭按钮 */
	:global(.spot-info-close) {
		position: absolute;
		top: 12px;
		right: 12px;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		border: 1px solid transparent;
		background: color-mix(in srgb, var(--btn-regular-bg, #f3f4f6) 80%, transparent);
		color: var(--content-meta, #6b7280);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s;
		padding: 0;
		z-index: 2;
	}
	:global(.spot-info-close:hover) {
		background: color-mix(in srgb, var(--primary, #3b82f6) 15%, transparent);
		color: var(--primary, #3b82f6);
		border-color: color-mix(in srgb, var(--primary, #3b82f6) 30%, transparent);
		transform: scale(1.08);
	}
	:global(.dark .spot-info-close) {
		background: color-mix(in srgb, var(--btn-regular-bg, #2a2e39) 70%, transparent);
		color: #9ca3af;
	}
	:global(.dark .spot-info-close:hover) {
		background: color-mix(in srgb, var(--primary, #3b82f6) 25%, transparent);
		color: var(--primary, #3b82f6);
		border-color: color-mix(in srgb, var(--primary, #3b82f6) 40%, transparent);
	}

	/* 卡片头部与标签 */
	:global(.spot-info-header) {
		margin-bottom: 9px;
		padding-right: 28px;
	}
	:global(.spot-badges-row) {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
		margin-bottom: 5px;
	}
	:global(.spot-category-pill) {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 2px 9px;
		border-radius: 9999px;
		font-size: 0.72rem;
		font-weight: 600;
		background: color-mix(in srgb, var(--cat-color, #3b82f6) 12%, transparent);
		color: var(--cat-color, #3b82f6);
		border: 1px solid color-mix(in srgb, var(--cat-color, #3b82f6) 28%, transparent);
		box-shadow: 0 1px 3px color-mix(in srgb, var(--cat-color, #3b82f6) 15%, transparent);
	}
	:global(.spot-category-dot) {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		display: inline-block;
	}
	:global(.spot-floor-badge) {
		font-size: 0.68rem;
		font-weight: 600;
		padding: 2px 7px;
		border-radius: 6px;
		background: color-mix(in srgb, var(--btn-regular-bg, #f3f4f6) 90%, transparent);
		color: var(--content-meta, #6b7280);
		border: 1px solid var(--line-divider, rgba(0, 0, 0, 0.06));
	}
	:global(.dark .spot-floor-badge) {
		background: color-mix(in srgb, var(--btn-regular-bg, #2a2e39) 80%, transparent);
		color: #9ca3af;
		border-color: rgba(255, 255, 255, 0.08);
	}
	:global(.spot-title) {
		font-size: 1.02rem;
		font-weight: 700;
		line-height: 1.35;
		margin: 0;
		color: var(--deep-text, #111827);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	:global(.dark .spot-title) {
		color: #f9fafb;
	}

	/* 地址与导航操作行 */
	:global(.spot-address-row) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 7px 10px;
		margin-bottom: 9px;
		border-radius: 10px;
		background: color-mix(in srgb, var(--btn-regular-bg, #f3f4f6) 65%, transparent);
		border: 1px solid color-mix(in srgb, var(--line-divider, rgba(0,0,0,0.06)) 60%, transparent);
		transition: background-color 0.2s, border-color 0.2s;
	}
	:global(.dark .spot-address-row) {
		background: color-mix(in srgb, var(--btn-regular-bg, #262933) 60%, transparent);
		border-color: rgba(255, 255, 255, 0.06);
	}
	:global(.spot-address-content) {
		display: flex;
		align-items: center;
		gap: 6px;
		min-width: 0;
		flex: 1;
	}
	:global(.spot-pin-svg) {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
		color: var(--primary, #3b82f6);
		filter: drop-shadow(0 1px 2px color-mix(in srgb, var(--primary, #3b82f6) 30%, transparent));
	}
	:global(.spot-address-text) {
		font-size: 0.8rem;
		line-height: 1.3;
		color: var(--deep-text, #374151);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	:global(.dark .spot-address-text) {
		color: #d1d5db;
	}
	:global(.spot-nav-btn) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 5px 11px;
		border-radius: 8px;
		font-size: 0.74rem;
		font-weight: 600;
		line-height: 1;
		white-space: nowrap;
		text-decoration: none;
		background: var(--primary, #3b82f6);
		color: #ffffff !important;
		flex-shrink: 0;
		width: auto !important;
		min-width: max-content !important;
		height: auto !important;
		box-sizing: border-box !important;
		box-shadow: 0 2px 6px color-mix(in srgb, var(--primary, #3b82f6) 40%, transparent);
		transition: all 0.2s;
	}
	:global(.spot-nav-btn span) {
		display: inline-block;
		white-space: nowrap;
		line-height: 1;
	}
	:global(.spot-nav-btn:hover) {
		filter: brightness(1.12);
		transform: translateY(-1px);
		box-shadow: 0 3px 10px color-mix(in srgb, var(--primary, #3b82f6) 55%, transparent);
	}
	:global(.spot-nav-arrow-svg) {
		width: 13px !important;
		height: 13px !important;
		min-width: 13px !important;
		min-height: 13px !important;
		flex-shrink: 0;
		transition: transform 0.2s;
	}
	:global(.spot-nav-btn:hover .spot-nav-arrow-svg) {
		transform: translateX(1.5px) translateY(-1.5px);
	}

	/* 底部预留评分与评论栏 */
	:global(.spot-meta-footer) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding-top: 8px;
		border-top: 1px solid color-mix(in srgb, var(--line-divider, rgba(0,0,0,0.08)) 80%, transparent);
		font-size: 0.76rem;
	}
	:global(.dark .spot-meta-footer) {
		border-top-color: rgba(255, 255, 255, 0.08);
	}
	:global(.spot-meta-sep) {
		width: 1px;
		height: 12px;
		background: var(--line-divider, rgba(0,0,0,0.12));
		opacity: 0.6;
	}
	:global(.dark .spot-meta-sep) {
		background: rgba(255, 255, 255, 0.15);
	}

	/* 预留评分胶囊 */
	:global(.spot-rating-pill) {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}
	:global(.spot-stars-group) {
		display: inline-flex;
		align-items: center;
		gap: 1px;
		font-size: 0.82rem;
		line-height: 1;
	}
	:global(.spot-star-icon.full) {
		color: #f59e0b;
	}
	:global(.spot-star-icon.half) {
		color: #fbbf24;
	}
	:global(.spot-star-icon.empty) {
		color: #cbd5e1;
	}
	:global(.dark .spot-star-icon.empty) {
		color: #4b5563;
	}
	:global(.spot-rating-score) {
		font-weight: 700;
		color: #f59e0b;
		margin-left: 2px;
	}
	:global(.spot-rating-pill.is-empty) {
		color: var(--content-meta, #9ca3af);
		opacity: 0.75;
	}
	:global(.spot-rating-label) {
		font-size: 0.74rem;
	}

	/* 预留独立评论徽章 */
	:global(.spot-comment-pill) {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		color: var(--content-meta, #6b7280);
		transition: color 0.2s;
	}
	:global(.dark .spot-comment-pill) {
		color: #9ca3af;
	}
	:global(.spot-comment-pill.has-comments) {
		color: var(--primary, #3b82f6);
		font-weight: 600;
	}
	:global(.spot-pill-icon) {
		width: 13px;
		height: 13px;
		flex-shrink: 0;
		opacity: 0.8;
	}
	:global(.spot-comment-pill.is-empty) {
		opacity: 0.65;
	}
</style>
