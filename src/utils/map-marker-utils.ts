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

/**
 * 解析点位图标配置，支持预设别名、绝对路径和网络 URL
 * 并根据 BASE_URL 自动拼接正确的资源地址
 */
export function resolveMarkerIcon(
	iconKeyOrPath?: string,
): ResolvedMarkerIcon | null {
	if (!iconKeyOrPath) return null;

	const trimmed = iconKeyOrPath.trim();
	if (!trimmed) return null;

	// 1. 匹配内置预设（按键名，如 "genshin_statue"）
	if (trimmed in markerIconPresets) {
		const preset: MarkerIconPreset = markerIconPresets[trimmed];
		const iconUrl = preset.src.startsWith("http") ? preset.src : url(preset.src);
		return {
			url: iconUrl,
			width: preset.width,
			height: preset.height,
			anchor: preset.anchor ?? [
				Math.round(preset.width / 2),
				preset.height,
			],
		};
	}

	// 2. 尝试根据预设路径或文件名逆向匹配预设（例如传入 "/assets/images/map/mansion.png" 或 "mansion.png"）
	for (const preset of Object.values(markerIconPresets)) {
		if (
			preset.src === trimmed ||
			preset.src.endsWith(`/${trimmed}`) ||
			trimmed.endsWith(preset.src)
		) {
			const iconUrl = preset.src.startsWith("http") ? preset.src : url(preset.src);
			return {
				url: iconUrl,
				width: preset.width,
				height: preset.height,
				anchor: preset.anchor ?? [
					Math.round(preset.width / 2),
					preset.height,
				],
			};
		}
	}

	// 3. 网络完整 URL
	if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
		return {
			url: trimmed,
			width: 32,
			height: 32,
			anchor: [16, 32],
		};
	}

	// 4. 站内绝对或相对路径
	const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
	return {
		url: url(normalizedPath),
		width: 32,
		height: 32,
		anchor: [16, 32],
	};
}

/**
 * 创建高德地图 Marker 的自定义 DOM 元素和对应的像素偏移量
 */
export function createMarkerElement(
	spot: Spot,
	category: CategoryMeta,
): { dom: HTMLElement; offset: [number, number] } {
	// 优先读取单点图标配置，其次读取分类默认图标
	const iconKey = spot.icon || category.defaultIcon;
	const resolvedIcon = resolveMarkerIcon(iconKey);

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

	// 默认彩色水滴形点位标点
	const pin = document.createElement("div");
	pin.className = "spot-marker-pin";
	pin.style.background = category.color;

	const dot = document.createElement("div");
	dot.className = "spot-marker-dot";
	pin.appendChild(dot);

	return {
		dom: pin,
		offset: [-14, -28],
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
