/**
 * 链接/同步课程静态资源至构建输出目录 (dist/course-assets/...)
 *
 * 在 astro build 之后执行，将远程缓存 (.cache/remote-courses) 与本地目录 (src/content/courses)
 * 中的非 Markdown 静态资源（图片、PDF、压缩包、代码示例等）以硬链接（Hardlink）形式映射到构建产物目录下。
 *
 * 特性：
 * 1. 0 冗余磁盘开销：优先使用硬链接 (fs.linkSync)，指向同一物理数据块，不占用多余存储空间。
 * 2. 0 破坏缓存机制：完全保留 .cache 原状，不影响 Git 增量比对与 CI actions/cache 复用。
 * 3. 自动降级兜底：跨分区或文件系统不支持硬链接时自动降级为 fs.copyFileSync。
 */

import fs from "node:fs";
import path from "node:path";
import { courseArchiveConfig } from "../src/config/archiveConfig";
import { resolveSiteRoot } from "./site-root";

const DIST_DIR = resolveSiteRoot();
const TARGET_DIR = path.join(
	DIST_DIR,
	courseArchiveConfig.assetsPrefix.replace(/^\/+/, ""),
);

const LOCAL_DIR = path.resolve(courseArchiveConfig.contentDir);
const REMOTE_DIR = path.resolve(courseArchiveConfig.remoteCacheDir);

interface AssetFile {
	relPath: string;
	fullPath: string;
	size: number;
}

function collectAssets(dir: string, baseRel = ""): AssetFile[] {
	if (!fs.existsSync(dir)) return [];
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	const result: AssetFile[] = [];

	for (const entry of entries) {
		if (
			entry.name.startsWith(".") ||
			entry.name === "node_modules" ||
			entry.name === "dist"
		) {
			continue;
		}

		const rel = baseRel ? `${baseRel}/${entry.name}` : entry.name;
		const full = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			result.push(...collectAssets(full, rel));
		} else if (!/\.(md|markdown)$/i.test(entry.name)) {
			try {
				const stat = fs.statSync(full);
				result.push({
					relPath: rel.replace(/\\/g, "/"),
					fullPath: full,
					size: stat.size,
				});
			} catch {}
		}
	}

	return result;
}

function linkOrCopy(src: string, dest: string): "linked" | "copied" {
	try {
		if (fs.existsSync(dest)) {
			fs.unlinkSync(dest);
		}
		fs.linkSync(src, dest);
		return "linked";
	} catch {
		try {
			if (fs.existsSync(dest)) {
				fs.unlinkSync(dest);
			}
		} catch {}
		fs.copyFileSync(src, dest);
		return "copied";
	}
}

async function linkCourseAssets(): Promise<void> {
	const startTime = Date.now();

	const remoteAssets = collectAssets(REMOTE_DIR);
	const localAssets = collectAssets(LOCAL_DIR);

	// 本地优先: 同名相对路径优先取本地版本
	const assetMap = new Map<string, AssetFile>();
	for (const asset of remoteAssets) {
		assetMap.set(asset.relPath, asset);
	}
	for (const asset of localAssets) {
		assetMap.set(asset.relPath, asset);
	}

	const totalCount = assetMap.size;
	if (totalCount === 0) {
		console.log("[course-assets] No course static assets found to link.");
		return;
	}

	let totalBytes = 0;
	let linkedCount = 0;
	let copiedCount = 0;

	for (const [relPath, asset] of assetMap) {
		const destPath = path.join(TARGET_DIR, relPath);
		const destDir = path.dirname(destPath);
		if (!fs.existsSync(destDir)) {
			fs.mkdirSync(destDir, { recursive: true });
		}
		const mode = linkOrCopy(asset.fullPath, destPath);
		if (mode === "linked") {
			linkedCount++;
		} else {
			copiedCount++;
		}
		totalBytes += asset.size;
	}

	const duration = ((Date.now() - startTime) / 1000).toFixed(2);
	const sizeMiB = (totalBytes / 1024 / 1024).toFixed(2);
	const modeDesc =
		copiedCount > 0
			? `${linkedCount} hardlinked, ${copiedCount} copied`
			: `${linkedCount} hardlinked (0 extra disk bytes)`;
	console.log(
		`[course-assets] Processed ${totalCount} asset(s) (${sizeMiB} MiB, ${modeDesc}) to ${path.relative(process.cwd(), TARGET_DIR)} in ${duration}s`,
	);
}

linkCourseAssets().catch((err) => {
	console.error("[course-assets] Failed to link course assets:", err);
	process.exit(1);
});
