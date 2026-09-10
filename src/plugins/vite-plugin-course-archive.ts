import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import katex from "katex";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/contrib/mhchem.mjs";
import rehypeCallouts from "rehype-callouts";
import rehypeSlug from "rehype-slug";
import { courseArchiveConfig } from "../config/archiveConfig";
import type { TreeNode } from "../types/course";

export type { TreeNode } from "../types/course";

export interface CourseArchiveVitePlugin {
	name: string;
	configureServer(server: {
		middlewares: { use: (...args: unknown[]) => unknown };
	}): void;
}

export interface CourseArchivePluginOptions {
	targetDir?: string;
	remoteCacheDir?: string;
	assetsPrefix?: string;
	apiPrefix?: string;
}

const MIME_TYPES: Record<string, string> = {
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".svg": "image/svg+xml",
	".webp": "image/webp",
	".ico": "image/x-icon",
	".bmp": "image/bmp",
	".pdf": "application/pdf",
	".mp4": "video/mp4",
	".webm": "video/webm",
	".mp3": "audio/mpeg",
	".wav": "audio/wav",
	".txt": "text/plain; charset=utf-8",
	".md": "text/markdown; charset=utf-8",
};

/**
 * 递归扫描目标目录，输出树状数据结构
 */
export function scanDirectory(
	dirPath: string,
	baseRelativePath = "",
): TreeNode[] {
	if (!dirPath || !fs.existsSync(dirPath)) return [];

	const entries = fs.readdirSync(dirPath, { withFileTypes: true });
	const result: TreeNode[] = [];

	for (const entry of entries) {
		if (
			entry.name.startsWith(".") ||
			entry.name === "node_modules" ||
			entry.name === "dist"
		) {
			continue;
		}

		const relPath = baseRelativePath
			? `${baseRelativePath}/${entry.name}`
			: entry.name;
		const fullPath = path.join(dirPath, entry.name);

		if (entry.isDirectory()) {
			result.push({
				name: entry.name,
				path: relPath.replace(/\\/g, "/"),
				isDirectory: true,
				children: scanDirectory(fullPath, relPath),
			});
		} else {
			let size: number | undefined;
			let mtime: string | undefined;
			try {
				const stat = fs.statSync(fullPath);
				size = stat.size;
				mtime = stat.mtime.toISOString();
			} catch {}
			const ext = path.extname(entry.name).toLowerCase();
			result.push({
				name: entry.name,
				path: relPath.replace(/\\/g, "/"),
				isDirectory: false,
				size,
				mtime,
				ext,
			});
		}
	}

	result.sort((a, b) => {
		if (a.isDirectory === b.isDirectory) {
			return a.name.localeCompare(b.name, "zh-CN");
		}
		return a.isDirectory ? -1 : 1;
	});

	return result;
}

/**
 * 合并两个 TreeNode 数组, 本地优先:
 * - 同名文件: 保留本地版本
 * - 同名目录: 递归合并子节点
 * - 仅远程存在: 直接添加
 */
function mergeTreeNodes(local: TreeNode[], remote: TreeNode[]): TreeNode[] {
	const localMap = new Map(local.map((n) => [n.name, n]));
	const merged = [...local];

	for (const remoteNode of remote) {
		const localNode = localMap.get(remoteNode.name);
		if (!localNode) {
			// 本地不存在, 直接添加远程节点
			merged.push(remoteNode);
		} else if (localNode.isDirectory && remoteNode.isDirectory) {
			// 同名目录: 递归合并子节点
			localNode.children = mergeTreeNodes(
				localNode.children || [],
				remoteNode.children || [],
			);
		}
		// 同名文件: 本地优先, 跳过远程
	}

	// 排序: 目录在前, 同类按中文排序
	merged.sort((a, b) => {
		if (a.isDirectory === b.isDirectory) {
			return a.name.localeCompare(b.name, "zh-CN");
		}
		return a.isDirectory ? -1 : 1;
	});

	return merged;
}

/**
 * 合并扫描本地目录和远程缓存目录
 * 本地优先: 同路径文件本地存在则跳过远程
 */
export function scanMergedDirectory(
	localDir: string,
	remoteDir: string,
): TreeNode[] {
	const localTree = scanDirectory(localDir);
	const remoteTree = scanDirectory(remoteDir);

	return mergeTreeNodes(localTree, remoteTree);
}

function isSafePath(baseDir: string, targetPath: string): boolean {
	const resolvedBase = path.resolve(baseDir);
	const resolvedTarget = path.resolve(targetPath);
	return (
		resolvedTarget.startsWith(resolvedBase + path.sep) ||
		resolvedTarget === resolvedBase
	);
}

/**
 * 规范化图片相对路径至资源前缀
 */
function resolveAssetUrl(
	currentDocPath: string,
	src: string,
	assetsPrefix: string,
): string {
	if (!src) return "";
	if (src.startsWith(assetsPrefix) || /^(https?:|\/\/|data:)/i.test(src)) {
		return src;
	}

	const docDir = currentDocPath.includes("/")
		? currentDocPath.substring(0, currentDocPath.lastIndexOf("/"))
		: "";

	let combined = "";
	if (src.startsWith("/")) {
		combined = src.slice(1);
	} else {
		combined = docDir ? `${docDir}/${src}` : src;
	}

	const parts = combined.split("/");
	const stack: string[] = [];
	for (const part of parts) {
		if (part === "" || part === ".") continue;
		if (part === "..") {
			stack.pop();
		} else {
			stack.push(part);
		}
	}

	return `${assetsPrefix}/${encodeURI(stack.join("/"))}`;
}

/**
 * 创建与课程中心完全一致的 Markdown 与 KaTeX 处理处理器
 */
let cachedProcessor: Awaited<
	ReturnType<typeof createMarkdownProcessor>
> | null = null;
async function getMarkdownProcessor() {
	if (cachedProcessor) return cachedProcessor;

	cachedProcessor = await createMarkdownProcessor({
		remarkPlugins: [remarkMath],
		rehypePlugins: [
			[
				rehypeKatex,
				{
					katex,
					throwOnError: false, // 捕获公式语法错误，生成错误节点以便诊断
					errorColor: "#e11d48",
					strict: "warn",
				},
			],
			rehypeSlug,
			rehypeCallouts,
		],
	});

	return cachedProcessor;
}

export function courseArchivePlugin(
	options: CourseArchivePluginOptions = {},
): CourseArchiveVitePlugin {
	const targetDir = path.resolve(
		options.targetDir || courseArchiveConfig.contentDir,
	);
	const remoteCacheDir = path.resolve(
		options.remoteCacheDir || courseArchiveConfig.remoteCacheDir,
	);
	const assetsPrefix = options.assetsPrefix || courseArchiveConfig.assetsPrefix;
	const apiPrefix = options.apiPrefix || courseArchiveConfig.apiPrefix;

	return {
		name: "vite-plugin-course-archive",
		configureServer(server: {
			middlewares: { use: (...args: unknown[]) => unknown };
		}) {
			server.middlewares.use(
				async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
					if (!req.url) return next();

					const parsedUrl = new URL(req.url, "http://localhost");
					const pathname = parsedUrl.pathname;

					// 1. 目录扫描接口: GET /api/course/tree
					const isTreeEndpoint =
						pathname === `${apiPrefix}/tree` ||
						pathname.endsWith(`${apiPrefix}/tree`);

					if (isTreeEndpoint && req.method === "GET") {
						try {
							const tree = scanMergedDirectory(targetDir, remoteCacheDir);
							res.setHeader("Content-Type", "application/json; charset=utf-8");
							res.end(JSON.stringify({ success: true, targetDir, data: tree }));
						} catch (err: unknown) {
							res.statusCode = 500;
							res.setHeader("Content-Type", "application/json; charset=utf-8");
							res.end(
								JSON.stringify({
									success: false,
									error: (err as Error)?.message,
								}),
							);
						}
						return;
					}

					// 2. 文档读取与流水线渲染接口: GET /api/course/content
					const isContentEndpoint =
						pathname === `${apiPrefix}/content` ||
						pathname.endsWith(`${apiPrefix}/content`);

					if (isContentEndpoint && req.method === "GET") {
						const reqPath = parsedUrl.searchParams.get("path");
						if (!reqPath) {
							res.statusCode = 400;
							res.setHeader("Content-Type", "application/json; charset=utf-8");
							res.end(
								JSON.stringify({
									success: false,
									error: "Missing path parameter",
								}),
							);
							return;
						}

						// 解析文件路径: 本地优先, 回退到远程缓存
						let absolutePath = path.isAbsolute(reqPath)
							? reqPath
							: path.join(targetDir, reqPath);
						let resolvedBaseDir = targetDir;

						// 如果本地目录找不到, 尝试远程缓存目录
						if (
							!path.isAbsolute(reqPath) &&
							(!fs.existsSync(absolutePath) ||
								!fs.statSync(absolutePath).isFile())
						) {
							const remotePath = path.join(remoteCacheDir, reqPath);
							if (
								fs.existsSync(remotePath) &&
								fs.statSync(remotePath).isFile()
							) {
								absolutePath = remotePath;
								resolvedBaseDir = remoteCacheDir;
							}
						}

						if (!isSafePath(resolvedBaseDir, absolutePath)) {
							res.statusCode = 403;
							res.setHeader("Content-Type", "application/json; charset=utf-8");
							res.end(
								JSON.stringify({ success: false, error: "Access denied" }),
							);
							return;
						}

						if (
							!fs.existsSync(absolutePath) ||
							!fs.statSync(absolutePath).isFile()
						) {
							res.statusCode = 404;
							res.setHeader("Content-Type", "application/json; charset=utf-8");
							res.end(
								JSON.stringify({ success: false, error: "File not found" }),
							);
							return;
						}

						try {
							const rawContent = fs.readFileSync(absolutePath, "utf-8");
							const normalizedRelPath = reqPath.replace(/\\/g, "/");

							// 使用官方渲染管线编译 Markdown 与公式
							const processor = await getMarkdownProcessor();
							const renderResult = await processor.render(rawContent);
							let html = renderResult.code;

							// 重写图片相对路径至本地静态资产映射
							html = html.replace(
								/<img\s+([^>]*?)src=["']([^"']+)["']/gi,
								(_match: string, before: string, src: string) => {
									const resolved = resolveAssetUrl(
										normalizedRelPath,
										src,
										assetsPrefix,
									);
									return `<img ${before}src="${resolved}"`;
								},
							);

							// 诊断与问题定位：分析 KaTeX 公式解析情况
							const katexErrors: Array<{ error: string; snippet: string }> = [];
							const errRegex =
								/<span class="katex-error"[^>]*title="([^"]+)"[^>]*>([\s\S]*?)<\/span>/g;
							let match: RegExpExecArray | null = errRegex.exec(html);
							while (match !== null) {
								katexErrors.push({
									error: match[1],
									snippet: match[2],
								});
								match = errRegex.exec(html);
							}

							// 统计公式总数
							const inlineMathCount = (html.match(/class="katex"/g) || [])
								.length;
							const displayMathCount = (
								html.match(/class="katex-display"/g) || []
							).length;

							res.setHeader("Content-Type", "application/json; charset=utf-8");
							res.end(
								JSON.stringify({
									success: true,
									path: normalizedRelPath,
									absolutePath,
									rawContent,
									renderedHtml: html,
									diagnostics: {
										totalFormulas: inlineMathCount + displayMathCount,
										inlineMathCount,
										displayMathCount,
										hasErrors: katexErrors.length > 0,
										errorCount: katexErrors.length,
										errors: katexErrors,
									},
								}),
							);
						} catch (err: unknown) {
							res.statusCode = 500;
							res.setHeader("Content-Type", "application/json; charset=utf-8");
							res.end(
								JSON.stringify({
									success: false,
									error: (err as Error)?.message,
								}),
							);
						}
						return;
					}

					// 3. 静态资源映射服务: GET /course-assets/...
					if (
						pathname.startsWith(assetsPrefix) ||
						pathname.includes(assetsPrefix)
					) {
						const assetsIdx = pathname.indexOf(assetsPrefix);
						const relativeAssetPath = decodeURIComponent(
							pathname
								.slice(assetsIdx + assetsPrefix.length)
								.replace(/^\/+/, ""),
						);

						// 本地优先, 回退到远程缓存
						let absoluteAssetPath = path.join(targetDir, relativeAssetPath);

						if (
							!isSafePath(targetDir, absoluteAssetPath) ||
							!fs.existsSync(absoluteAssetPath)
						) {
							const remoteAssetPath = path.join(
								remoteCacheDir,
								relativeAssetPath,
							);
							if (
								isSafePath(remoteCacheDir, remoteAssetPath) &&
								fs.existsSync(remoteAssetPath)
							) {
								absoluteAssetPath = remoteAssetPath;
							} else {
								res.statusCode = 404;
								res.end("Asset Not Found");
								return;
							}
						}

						const ext = path.extname(absoluteAssetPath).toLowerCase();
						const contentType = MIME_TYPES[ext] || "application/octet-stream";

						res.setHeader("Content-Type", contentType);
						res.setHeader("Cache-Control", "no-cache");
						fs.createReadStream(absoluteAssetPath).pipe(res);
						return;
					}

					next();
				},
			);
		},
	};
}
