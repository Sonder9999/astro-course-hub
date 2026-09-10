/**
 * 远程课程仓库同步脚本
 *
 * 在 build / dev 前执行, 将 subjectConfig 中配置了 remoteRepo 的学科
 * 浅克隆到 .cache/remote-courses/<subject-id>/ 缓存目录。
 *
 * 用法: npx tsx scripts/sync-remote-courses.ts
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { subjectMetas } from "../src/config/subjectConfig";

const CACHE_DIR = path.resolve(".cache/remote-courses");

interface SyncResult {
	subjectId: string;
	status: "cloned" | "skipped" | "error";
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

async function syncRemoteCourses(): Promise<void> {
	const results: SyncResult[] = [];

	// 筛选配置了远程仓库的学科
	const remoteSubjects = Object.entries(subjectMetas).filter(
		([_, meta]) => meta.remoteRepo,
	);

	if (remoteSubjects.length === 0) {
		console.log("[sync] No remote course repos configured, skipping.");
		return;
	}

	console.log(
		`[sync] Found ${remoteSubjects.length} remote course repo(s), starting sync...\n`,
	);

	// 确保缓存根目录存在
	fs.mkdirSync(CACHE_DIR, { recursive: true });

	for (const [id, meta] of remoteSubjects) {
		try {
			const cloneDir = path.join(CACHE_DIR, id);
			const branch = meta.remoteBranch || "main";

			// 清理旧缓存
			if (fs.existsSync(cloneDir)) {
				fs.rmSync(cloneDir, { recursive: true, force: true });
			}

			console.log(`  [clone] ${meta.name} (${id}) from ${meta.remoteRepo}`);
			execSync(
				`git clone --depth 1 --branch ${branch} --single-branch "${meta.remoteRepo}" "${cloneDir}"`,
				{ stdio: "pipe" },
			);

			// 清理 .git 目录
			const gitDir = path.join(cloneDir, ".git");
			if (fs.existsSync(gitDir)) {
				fs.rmSync(gitDir, { recursive: true, force: true });
			}

			// 清理 remoteExclude 中指定的文件/目录
			if (meta.remoteExclude && meta.remoteExclude.length > 0) {
				removeByPatterns(cloneDir, meta.remoteExclude);
			}

			// 如果配置了 remoteRootDir, 将子目录内容提升到 cloneDir 根
			if (meta.remoteRootDir) {
				const sourceDir = path.join(cloneDir, meta.remoteRootDir);
				if (fs.existsSync(sourceDir)) {
					const tempDir = `${cloneDir}__temp`;
					fs.renameSync(sourceDir, tempDir);
					fs.rmSync(cloneDir, { recursive: true, force: true });
					fs.renameSync(tempDir, cloneDir);
				} else {
					console.log(
						`  [warn] ${meta.name}: remoteRootDir "${meta.remoteRootDir}" not found in repo`,
					);
				}
			}

			const fileCount = countFiles(cloneDir);
			results.push({ subjectId: id, status: "cloned", fileCount });
			console.log(`  [done] ${meta.name}: ${fileCount} file(s) synced\n`);
		} catch (error) {
			results.push({
				subjectId: id,
				status: "error",
				error: (error as Error).message,
			});
			console.error(`  [error] ${meta.name}: ${(error as Error).message}\n`);
		}
	}

	// 打印同步摘要
	console.log("--- Sync Summary ---");
	for (const r of results) {
		const tag = r.status === "cloned" ? "[ok]" : "[fail]";
		const detail =
			r.fileCount !== undefined ? `${r.fileCount} files` : r.error || "";
		console.log(`  ${tag} ${r.subjectId}: ${detail}`);
	}
	console.log("");
}

syncRemoteCourses().catch(console.error);
