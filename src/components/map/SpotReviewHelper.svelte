<script lang="ts">
import type { Spot } from "@/types/spot";

interface Props {
	spot: Spot;
	repo?: string;
	category?: string;
}

const { spot, repo = "", category = "General" }: Props = $props();

let rating = $state(5);
let userText = $state("在此输入您的体验评价...");
let copySuccess = $state(false);
let copyTimer: ReturnType<typeof setTimeout> | null = null;

// 根据当前评分与正文响应式组装模板
const formattedTemplate = $derived(
	`> 评分: ${rating}/5\n\n${userText.trim() ? userText.trim() : "在此输入您的体验评价..."}`,
);

function setRating(val: number) {
	rating = val;
}

// 复制到剪贴板并提示用户在下方 Giscus 中粘贴
async function handleCopy() {
	try {
		if (navigator.clipboard) {
			await navigator.clipboard.writeText(formattedTemplate);
		} else {
			const textarea = document.createElement("textarea");
			textarea.value = formattedTemplate;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand("copy");
			document.body.removeChild(textarea);
		}

		copySuccess = true;
		if (copyTimer) clearTimeout(copyTimer);
		copyTimer = setTimeout(() => {
			copySuccess = false;
		}, 3000);

		// 滚动引导到下方评论框
		const giscusWidget = document.querySelector("#comments");
		if (giscusWidget) {
			giscusWidget.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	} catch {
		// 忽略剪贴板写入受限异常
	}
}

// 构造直接在 GitHub Discussions 中以预填正文打开的链接
const githubNewDiscussionUrl = $derived.by(() => {
	if (!repo) return "#";
	const title = encodeURIComponent(`[点位评价] ${spot.name}`);
	const body = encodeURIComponent(formattedTemplate);
	const cat = encodeURIComponent(category);
	return `https://github.com/${repo}/discussions/new?category=${cat}&title=${title}&body=${body}`;
});
</script>

<div class="spot-review-helper rounded-xl p-3.5 sm:p-4 mb-4 border border-(--line-divider) bg-(--btn-regular-bg)/40">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
		<div class="flex items-center gap-2">
			<span class="text-xs font-semibold text-(--deep-text)">打分与评价模板助手:</span>
			<!-- 1-5 星级选择器 -->
			<div class="inline-flex items-center gap-1" role="radiogroup" aria-label="点位评分选择">
				{#each [1, 2, 3, 4, 5] as star}
					<button
						type="button"
						role="radio"
						aria-checked={rating === star}
						aria-label={`评分 ${star} 星`}
						class="star-btn cursor-pointer p-0.5 rounded transition-transform hover:scale-110 active:scale-95 focus:outline-hidden"
						onclick={() => setRating(star)}
					>
						<svg
							class="w-5 h-5 {star <= rating ? 'text-(--primary)' : 'text-(--line-divider)'}"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
							/>
						</svg>
					</button>
				{/each}
				<span class="text-xs font-bold text-(--primary) ml-1">{rating}.00 / 5.00</span>
			</div>
		</div>

		<span class="text-[11px] text-(--content-meta) opacity-80">
			可在此编辑或清空模板，发布时保留评分格式即可入选口碑
		</span>
	</div>

	<!-- 可编辑模板框 -->
	<div class="relative mb-3">
		<textarea
			bind:value={userText}
			rows="3"
			aria-label="评价正文编辑"
			placeholder="在此输入您的体验评价（可自由修改或删除）..."
			class="w-full text-xs font-mono p-2.5 rounded-lg bg-(--card-bg) border border-(--line-divider) text-(--btn-content) placeholder:text-(--content-meta)/60 focus:outline-hidden focus:border-(--primary) transition-colors resize-y leading-relaxed"
		></textarea>
	</div>

	<!-- 操作按钮栏 -->
	<div class="flex items-center justify-between gap-2 flex-wrap">
		<div class="flex items-center gap-2">
			<button
				type="button"
				onclick={handleCopy}
				class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-(--primary) text-white hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-xs"
			>
				<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
					<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
				</svg>
				<span>{copySuccess ? "已复制模板！请在下方粘贴" : "一键复制评价模板"}</span>
			</button>

			{#if repo}
				<a
					href={githubNewDiscussionUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-(--btn-regular-bg) text-(--content-meta) hover:text-(--primary) border border-(--line-divider) transition-colors"
					title="在 GitHub Discussions 页面直接带格式发表"
				>
					<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
						<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
					</svg>
					<span>在 GitHub 原生发表</span>
				</a>
			{/if}
		</div>

		<span class="text-[11px] text-(--content-meta) opacity-70">
			提示：在下方 Giscus 输入框按 Ctrl+V 粘贴即可
		</span>
	</div>
</div>
