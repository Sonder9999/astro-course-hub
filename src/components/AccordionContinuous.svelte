<script lang="ts">
import { getSubjectMeta } from "@/config/subjectConfig";
import type { TreeNode } from "@/types/course";

let {
	subjects = [],
	onSelectSubject,
}: {
	subjects: TreeNode[];
	onSelectSubject: (subject: TreeNode) => void;
} = $props();

function countMdFiles(node: TreeNode): number {
	let count = 0;
	if (!node.isDirectory && node.name.endsWith(".md")) {
		return 1;
	}
	if (node.children) {
		for (const child of node.children) {
			count += countMdFiles(child);
		}
	}
	return count;
}
</script>

<div class="continuous-wrapper">
  <!-- 参考：手风琴_连续.html 中的 .accordion-container -->
  <div class="accordion-container">
    {#each subjects as subject}
      {@const meta = getSubjectMeta(subject.name)}
      {@const mdCount = countMdFiles(subject)}
      <div
        class="accordion-item"
        role="button"
        tabindex="0"
        onclick={() => onSelectSubject(subject)}
        onkeydown={(e) => { if (e.key === 'Enter') onSelectSubject(subject); }}
      >
        <!-- 背景底色 + 图片 -->
        <div class="bg-layer" style="background: {meta.gradient};">
          <img
            src={meta.image}
            alt={meta.name}
            loading="lazy"
            onerror={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>

        <!-- 遮罩及标题文字 (参考：手风琴_连续.html 中的 .overlay) -->
        <div class="overlay">
          <div class="top-tag">
            {#if meta.icon}
              <span class="icon">{meta.icon}</span>
            {/if}
            <span class="tag-name">{meta.category}</span>
          </div>

          <div class="bottom-content">
            <h3>{meta.name}</h3>
            <p class="desc">{meta.description}</p>
            <div class="stats">{mdCount} 篇笔记与资料 · 点击查看 →</div>
          </div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .continuous-wrapper {
    width: 100%;
    padding: 30px 20px 40px;
    display: flex;
    justify-content: center;
    box-sizing: border-box;
    overflow-x: auto;
  }

  /* 参考：手风琴_连续.html 中的 .accordion-container */
  .accordion-container {
    display: flex;
    width: 95%;
    max-width: 1400px;
    min-width: 800px;
    height: 500px;
    overflow: hidden;
    border-radius: 16px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.45);
    background: #0f172a;
  }

  /* 参考：手风琴_连续.html 中的 .accordion-item */
  .accordion-item {
    position: relative;
    flex: 1; /* 默认均分宽度 */
    min-width: 60px;
    overflow: hidden;
    cursor: pointer;
    transition: flex 0.55s cubic-bezier(0.25, 1, 0.5, 1);
    user-select: none;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }

  .accordion-item:last-child {
    border-right: none;
  }

  .bg-layer {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  .bg-layer img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.05);
    transition: transform 0.6s ease;
  }

  /* 参考：手风琴_连续.html 中的 .overlay */
  .overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.4) 50%, rgba(0, 0, 0, 0.1) 100%);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 20px;
    color: #fff;
    box-sizing: border-box;
  }

  .top-tag {
    align-self: flex-start;
    background: rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }

  .bottom-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .overlay h3 {
    font-size: 18px;
    white-space: nowrap;
    transform: translateY(8px);
    opacity: 0.9;
    transition: all 0.4s ease;
    margin: 0;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6);
  }

  .desc {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.75);
    margin: 0;
    line-height: 1.4;
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition: all 0.4s ease;
  }

  .stats {
    font-size: 11px;
    color: #38bdf8;
    margin-top: 4px;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  /* 核心悬浮效果：鼠标悬浮时展开，其它项自动挤压 (与手风琴_连续.html完全一致) */
  .accordion-container:hover .accordion-item {
    flex: 0.4;
  }

  .accordion-container .accordion-item:hover {
    flex: 4.5;
  }

  .accordion-container .accordion-item:hover img {
    transform: scale(1);
  }

  .accordion-container .accordion-item:hover .overlay h3 {
    transform: translateY(0);
    opacity: 1;
    font-size: 24px;
    color: #60a5fa;
  }

  .accordion-container .accordion-item:hover .desc {
    max-height: 60px;
    opacity: 1;
  }

  .accordion-container .accordion-item:hover .stats {
    opacity: 1;
  }
</style>
