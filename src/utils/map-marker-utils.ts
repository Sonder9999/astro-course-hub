import {
	type CategoryMeta,
	type MarkerIconPreset,
	markerIconPresets,
} from "@/config/mapConfig";
import type { Spot } from "@/types/spot";
import { url } from "@/utils/url-utils";

/** 解析后的标记图标属性 */
export interface ResolvedMarkerIcon {
	url: string;
	width: number;
	height: number;
	anchor: [number, number];
}

/** 地图标记基准高度（像素，对应 100% 缩放） */
export const BASE_MARKER_HEIGHT = 38;

/**
 * 解析百分比参数为倍率浮点数
 * 支持 "80%" -> 0.8, 80 -> 0.8, 0.8 -> 0.8
 */
export function parseScalePercent(
	scale?: string | number,
	fallback: number = 1.0,
): number {
	if (scale === undefined || scale === null) return fallback;
	if (typeof scale === "number") {
		if (isNaN(scale) || scale <= 0) return fallback;
		return scale > 2.0 ? scale / 100 : scale;
	}
	const trimmed = String(scale).trim();
	if (!trimmed) return fallback;
	const num = parseFloat(trimmed);
	if (isNaN(num) || num <= 0) return fallback;
	if (trimmed.endsWith("%") || num > 2.0) {
		return num / 100;
	}
	return num;
}

/**
 * 解析点位图标配置，根据百分比 scale 与 BASE_URL 自动计算最终呈现尺寸与锚点
 */
export function resolveMarkerIcon(
	iconKeyOrPath?: string,
	globalScale: string | number = 1.0,
): ResolvedMarkerIcon | null {
	if (!iconKeyOrPath) return null;

	const trimmed = iconKeyOrPath.trim();
	if (!trimmed) return null;

	const globalRatio = parseScalePercent(globalScale, 1.0);

	const calculateDimensions = (
		presetScale: string | number | undefined,
		aspectRatio: number = 1.0,
		customW?: number,
		customH?: number,
		rawAnchor?: [number, number],
	): { width: number; height: number; anchor: [number, number] } => {
		// 如果显式指定了固定 px（向下兼容）
		if (customW && customH) {
			const width = Math.max(14, Math.round(customW * globalRatio));
			const height = Math.max(14, Math.round(customH * globalRatio));
			const anchor: [number, number] = rawAnchor
				? [
						Math.round(rawAnchor[0] * globalRatio),
						Math.round(rawAnchor[1] * globalRatio),
					]
				: [Math.round(width / 2), height];
			return { width, height, anchor };
		}

		// 基于百分比与基准高度计算
		const itemRatio = parseScalePercent(presetScale, 0.85);
		const totalRatio = Math.max(0.2, Math.min(3.0, itemRatio * globalRatio));
		const height = Math.max(14, Math.round(BASE_MARKER_HEIGHT * totalRatio));
		const width = Math.max(14, Math.round(height * aspectRatio));
		const anchor: [number, number] = rawAnchor
			? [
					Math.round(rawAnchor[0] * totalRatio),
					Math.round(rawAnchor[1] * totalRatio),
				]
			: [Math.round(width / 2), height];
		return { width, height, anchor };
	};

	// 1. 匹配内置预设（按键名，如 "genshin_statue"）
	if (trimmed in markerIconPresets) {
		const preset: MarkerIconPreset = markerIconPresets[trimmed];
		const iconUrl = preset.src.startsWith("http") ? preset.src : url(preset.src);
		const { width, height, anchor } = calculateDimensions(
			preset.scale,
			preset.aspectRatio ?? 1.0,
			preset.width,
			preset.height,
			preset.anchor,
		);
		return { url: iconUrl, width, height, anchor };
	}

	// 2. 尝试根据预设路径或文件名逆向匹配预设（例如传入 "/assets/images/map/mansion.png" 或 "mansion.png"）
	for (const preset of Object.values(markerIconPresets)) {
		if (
			preset.src === trimmed ||
			preset.src.endsWith(`/${trimmed}`) ||
			trimmed.endsWith(preset.src)
		) {
			const iconUrl = preset.src.startsWith("http") ? preset.src : url(preset.src);
			const { width, height, anchor } = calculateDimensions(
				preset.scale,
				preset.aspectRatio ?? 1.0,
				preset.width,
				preset.height,
				preset.anchor,
			);
			return { url: iconUrl, width, height, anchor };
		}
	}

	// 3. 网络完整 URL 或站内自定义路径（默认按正方形 1:1，80% 基准高度）
	const isWebUrl =
		trimmed.startsWith("http://") || trimmed.startsWith("https://");
	const iconUrl = isWebUrl
		? trimmed
		: url(trimmed.startsWith("/") ? trimmed : `/${trimmed}`);
	const { width, height, anchor } = calculateDimensions("80%", 1.0);
	return {
		url: iconUrl,
		width,
		height,
		anchor,
	};
}

/**
 * 创建高德地图 Marker 的自定义 DOM 元素和对应的像素偏移量
 */
export function createMarkerElement(
	spot: Spot,
	category: CategoryMeta,
	globalScale: string | number = 1.0,
): { dom: HTMLElement; offset: [number, number] } {
	// 优先读取单点图标配置，其次读取分类默认图标
	const iconKey = spot.icon || category.defaultIcon;
	const resolvedIcon = resolveMarkerIcon(iconKey, globalScale);

	if (resolvedIcon) {
		const container = document.createElement("div");
		container.className = "spot-marker-custom";
		container.style.width = `${resolvedIcon.width}px`;
		container.style.height = `${resolvedIcon.height}px`;

		const img = document.createElement("img");
		img.src = resolvedIcon.url;
		img.alt = spot.name;
		img.className = "spot-marker-img";
		img.draggable = false;

		container.appendChild(img);

		return {
			dom: container,
			offset: [-resolvedIcon.anchor[0], -resolvedIcon.anchor[1]],
		};
	}

	// 默认彩色水滴形点位标点（也随百分比微调）
	const ratio = parseScalePercent(globalScale, 1.0);
	const pinSize = Math.max(16, Math.round(24 * ratio));
	const pin = document.createElement("div");
	pin.className = "spot-marker-pin";
	pin.style.width = `${pinSize}px`;
	pin.style.height = `${pinSize}px`;
	pin.style.background = category.color;

	const dot = document.createElement("div");
	dot.className = "spot-marker-dot";
	pin.appendChild(dot);

	return {
		dom: pin,
		offset: [-Math.round(pinSize / 2), -pinSize],
	};
}

/**
 * 创建点位聚合时的自定义大图标与右上角红圈数字角标 DOM（百分比控制大小）
 */
export function createClusterMarkerElement(
	count: number,
	iconKeyOrPath: string = "/assets/images/map/firefly_elf.png",
	clusterScale: string | number = "125%",
	globalScale: string | number = 1.0,
): { dom: HTMLElement; offset: [number, number] } {
	const resolvedIcon = resolveMarkerIcon(iconKeyOrPath, globalScale);
	const clusterRatio = parseScalePercent(clusterScale, 1.25);
	const globalRatio = parseScalePercent(globalScale, 1.0);
	const totalRatio = clusterRatio * globalRatio;

	const height = Math.max(20, Math.round(BASE_MARKER_HEIGHT * totalRatio));
	const width = Math.max(18, Math.round(height * (560 / 679)));
	const imgUrl =
		resolvedIcon?.url || url("/assets/images/map/firefly_elf.png");

	const container = document.createElement("div");
	container.className = "spot-cluster-container";
	container.style.width = `${width}px`;
	container.style.height = `${height}px`;

	// 1. 聚合大图标图片
	const img = document.createElement("img");
	img.src = imgUrl;
	img.alt = "点位聚合";
	img.className = "spot-cluster-img";
	img.draggable = false;
	container.appendChild(img);

	// 2. 右上角红圈数字角标
	const badge = document.createElement("span");
	badge.className = "spot-cluster-count-badge";
	badge.textContent = String(count);
	container.appendChild(badge);

	return {
		dom: container,
		offset: [-Math.round(width / 2), -height],
	};
}

/**
 * 生成高德地图 URI API 步行导航地址
 */
export function buildNavUrl(spot: Spot): string {
	const name = encodeURIComponent(spot.name);
	return `https://uri.amap.com/navigation?to=${spot.lon},${spot.lat},${name}&mode=walk&coordinate=gaode`;
}

/**
 * 渲染评分 HTML 结构（支持预留字段）
 */
export function renderRatingHtml(rating?: number): string {
	if (rating === undefined || rating === null || rating <= 0) {
		return '<span class="spot-rating-empty">暂无评分</span>';
	}
	const full = Math.floor(rating);
	const half = rating - full >= 0.5 ? 1 : 0;
	const empty = Math.max(0, 5 - full - half);
	let html = '<span class="spot-rating">';
	for (let i = 0; i < full; i++) {
		html += '<span class="star-full">&#9733;</span>';
	}
	if (half) {
		html += '<span class="star-half">&#9733;</span>';
	}
	for (let i = 0; i < empty; i++) {
		html += '<span class="star-empty">&#9734;</span>';
	}
	html += ` <span class="rating-num">${rating.toFixed(1)}</span></span>`;
	return html;
}

/**
 * 构建信息窗口 InfoWindow 的 HTML 模板字符串
 */
export function buildInfoWindowHtml(
	spot: Spot,
	category: CategoryMeta,
): string {
	const navUrl = buildNavUrl(spot);
	const floorInfo = spot.floor ? ` / ${spot.floor}` : "";
	const commentCount = spot.comments?.length ?? 0;
	const commentText = commentCount > 0 ? `${commentCount} 条评论` : "暂无评论";

	return `
		<div class="spot-info-window">
			<div class="spot-info-header">
				<span class="spot-category-badge" style="background:${category.color}">${category.label}</span>
				<h3 class="spot-name">${spot.name}</h3>
			</div>
			<div class="spot-info-body">
				<a class="spot-address-link" href="${navUrl}" target="_blank" rel="noopener noreferrer">
					<svg class="spot-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
					</svg>
					<span>${spot.address}${floorInfo}</span>
					<svg class="spot-nav-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M9 18l6-6-6-6"/>
					</svg>
				</a>
				<div class="spot-meta-row">
					<span class="spot-meta-item">${renderRatingHtml(spot.rating)}</span>
					<span class="spot-meta-divider">|</span>
					<span class="spot-meta-item">${commentText}</span>
				</div>
			</div>
		</div>
	`;
}
