/**
 * 远程课程仓库同步脚本
 *
 * 在 build / dev 前执行, 将 subjectConfig 中配置了 remoteRepo 的学科
 * 浅克隆或增量同步到 .cache/remote-courses/<subject-id>/ 缓存目录。
 *
 * 特性：
 * 1. 保留 .git 目录，支持基于 commit hash 的秒级增量跳过（无需重复下载）。
 * 2. 支持多线程并发拉取（默认 6 并发），大幅缩短总体同步时间。
 * 3. 失败自愈：当增量同步失败时，自动重置重克隆。
 *
 * 用法: npx tsx scripts/sync-remote-courses.ts
 */

import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { subjectMetas } from "../src/config/subjectConfig";
import type { SubjectMeta } from "../src/types/course";

const execAsync = promisify(exec);

const CACHE_DIR = path.resolve(".cache/remote-courses");
const CONCURRENCY_LIMIT = 6;

interface SyncResult {
	subjectId: string;
	status: "cloned" | "updated" | "cached" | "error";
	fileCount?: number;
	error?: string;
}

/**
 * 递归统计目录下的文件数量 (忽略以 . 开头的隐藏文件)
 */
function countFiles(dir: string): number {
	if (!fs.existsSync(dir)) return 0;
	let count = 0;
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.name.startsWith(".")) continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			count += countFiles(full);
		} else {
			count++;
		}
	}
	return count;
}

/**
 * 删除指定名称列表对应的文件或目录
 */
function removeByPatterns(dir: string, patterns: string[]): void {
	for (const pattern of patterns) {
		const target = path.join(dir, pattern);
		if (fs.existsSync(target)) {
			fs.rmSync(target, { recursive: true, force: true });
		}
	}
}

/**
 * 通用轻量异步并发池
 */
async function runWithConcurrency<T, R>(
	items: T[],
	limit: number,
	worker: (item: T) => Promise<R>,
): Promise<R[]> {
	const results: R[] = new Array(items.length);
	let currentIndex = 0;

	async function runWorker(): Promise<void> {
		while (currentIndex < items.length) {
			const index = currentIndex++;
			results[index] = await worker(items[index]);
		}
	}

	const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
		runWorker(),
	);
	await Promise.all(workers);
	return results;
}

/**
 * 同步单个远程学科仓库
 */
async function syncSingleSubject(
	id: string,
	meta: SubjectMeta,
): Promise<SyncResult> {
	if (!meta.remoteRepo) {
		return { subjectId: id, status: "cached", fileCount: 0 };
	}

	const cloneDir = path.join(CACHE_DIR, id);
	const branch = meta.remoteBranch || "main";
	const gitDir = path.join(cloneDir, ".git");

	// 鉴权 Token 拼接
	const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
	let authRepoUrl = meta.remoteRepo;
	if (token && authRepoUrl.startsWith("https://github.com/")) {
		authRepoUrl = authRepoUrl.replace(
			"https://github.com/",
			`https://x-access-token:${token}@github.com/`,
		);
	}

	try {
		// 1. 如果已存在有效 Git 仓库，尝试增量更新与检测
		if (fs.existsSync(gitDir)) {
			try {
				await execAsync(`git remote set-url origin "${authRepoUrl}"`, {
					cwd: cloneDir,
				});

				await execAsync(`git fetch --depth 1 origin ${branch} --quiet`, {
					cwd: cloneDir,
					timeout: 60000,
				});

				const { stdout: localCommit } = await execAsync("git rev-parse HEAD", {
					cwd: cloneDir,
				});

				const { stdout: remoteCommit } = await execAsync(
					"git rev-parse FETCH_HEAD",
					{
						cwd: cloneDir,
					},
				);

				if (localCommit.trim() === remoteCommit.trim()) {
					const fileCount = countFiles(cloneDir);
					console.log(
						`  [cached] ${meta.name} (${id}) is already up to date (${fileCount} files)`,
					);
					return { subjectId: id, status: "cached", fileCount };
				}

				// 远端存在新提交，快进重置并应用清理
				await execAsync("git reset --hard FETCH_HEAD", {
					cwd: cloneDir,
				});
				await execAsync("git clean -fd", {
					cwd: cloneDir,
				});

				if (meta.remoteExclude && meta.remoteExclude.length > 0) {
					removeByPatterns(cloneDir, meta.remoteExclude);
				}

				const fileCount = countFiles(cloneDir);
				console.log(
					`  [updated] ${meta.name} (${id}): ${fileCount} file(s) updated`,
				);
				return { subjectId: id, status: "updated", fileCount };
			} catch (_err) {
				console.log(
					`  [retry] ${meta.name} (${id}): incremental fetch failed, falling back to clean clone...`,
				);
				fs.rmSync(cloneDir, { recursive: true, force: true });
			}
		}

		// 2. 首次克隆或降级全量克隆
		if (fs.existsSync(cloneDir)) {
			fs.rmSync(cloneDir, { recursive: true, force: true });
		}

		console.log(`  [clone] ${meta.name} (${id}) from ${meta.remoteRepo}`);
		await execAsync(
			`git clone --depth 1 --branch ${branch} --single-branch --quiet "${authRepoUrl}" "${cloneDir}"`,
			{
				timeout: 120000,
			},
		);

		// 注意：保留 .git 目录以支持后续跨构建比对增量更新

		if (meta.remoteExclude && meta.remoteExclude.length > 0) {
			removeByPatterns(cloneDir, meta.remoteExclude);
		}

		if (meta.remoteRootDir) {
			const sourceDir = path.join(cloneDir, meta.remoteRootDir);
			if (fs.existsSync(sourceDir)) {
				const tempDir = `${cloneDir}__temp`;
				fs.renameSync(sourceDir, tempDir);
				fs.rmSync(cloneDir, { recursive: true, force: true });
				fs.renameSync(tempDir, cloneDir);
			}
		}

		const fileCount = countFiles(cloneDir);
		console.log(`  [done] ${meta.name}: ${fileCount} file(s) synced`);
		return { subjectId: id, status: "cloned", fileCount };
	} catch (error) {
		const rawMsg = (error as Error).message || "";
		const safeMsg = rawMsg.replace(
			/x-access-token:[^@]+@/g,
			"x-access-token:***@",
		);
		console.error(`  [error] ${meta.name}: ${safeMsg}`);
		return {
			subjectId: id,
			status: "error",
			error: safeMsg,
		};
	}
}

async function syncRemoteCourses(): Promise<void> {
	const startTime = Date.now();

	// 筛选配置了远程仓库的学科
	const remoteSubjects = Object.entries(subjectMetas).filter(
		([_, meta]) => meta.remoteRepo,
	);

	if (remoteSubjects.length === 0) {
		console.log("[sync] No remote course repos configured, skipping.");
		return;
	}

	console.log(
		`[sync] Found ${remoteSubjects.length} remote course repo(s), starting concurrent sync (concurrency: ${CONCURRENCY_LIMIT})...\n`,
	);

	// 确保缓存根目录存在
	fs.mkdirSync(CACHE_DIR, { recursive: true });

	const results = await runWithConcurrency(
		remoteSubjects,
		CONCURRENCY_LIMIT,
		([id, meta]) => syncSingleSubject(id, meta),
	);

	const duration = ((Date.now() - startTime) / 1000).toFixed(1);

	// 打印同步摘要
	console.log("\n--- Sync Summary ---");
	let cachedCount = 0;
	let updatedCount = 0;
	let clonedCount = 0;
	let errorCount = 0;

	for (const r of results) {
		let tag = "[ok]";
		if (r.status === "error") {
			tag = "[fail]";
			errorCount++;
		} else if (r.status === "cached") {
			cachedCount++;
		} else if (r.status === "updated") {
			updatedCount++;
		} else if (r.status === "cloned") {
			clonedCount++;
		}

		const detail =
			r.fileCount !== undefined ? `${r.fileCount} files` : r.error || "";
		console.log(`  ${tag} ${r.subjectId} [${r.status}]: ${detail}`);
	}

	console.log(
		`\n[sync] Finished in ${duration}s (cached: ${cachedCount}, updated: ${updatedCount}, cloned: ${clonedCount}, error: ${errorCount})\n`,
	);
}

syncRemoteCourses().catch(console.error);
