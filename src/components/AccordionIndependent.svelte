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

// 统计每个学科下的 Markdown 文件数
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

<div class="independent-wrapper">
  <div class="shell">
    {#each subjects as subject}
      {@const meta = getSubjectMeta(subject.name)}
      {@const mdCount = countMdFiles(subject)}
      <div
        class="box"
        role="button"
        tabindex="0"
        onclick={() => onSelectSubject(subject)}
        onkeydown={(e) => { if (e.key === 'Enter') onSelectSubject(subject); }}
      >
        <div class="img-wrapper" style="background: {meta.gradient};">
          <img
            src={meta.image}
            alt={meta.name}
            loading="lazy"
            onerror={(e) => {
              // 图片加载失败时隐藏 img，保留优雅渐变背景
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <div class="card-badge">
            {#if meta.icon}
              <span class="icon">{meta.icon}</span>
            {/if}
            <span class="category">{meta.category}</span>
          </div>
          <div class="stats-badge">
            {mdCount} 篇笔记
          </div>
        </div>

        <div class="title-container">
          <div class="title-text">{meta.name}</div>
          <div class="sub-text">{subject.name}</div>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .independent-wrapper {
    width: 100%;
    padding: 30px 20px 40px;
    display: flex;
    justify-content: center;
    box-sizing: border-box;
    overflow-x: auto;
  }

  /* 参考：手风琴_独立.html 中的 .shell */
  .shell {
    width: 95%;
    max-width: 1400px;
    min-width: 800px;
    height: 520px;
    display: flex;
    align-items: stretch;
    padding: 10px 0;
  }

  /* 参考：手风琴_独立.html 中的 .box */
  .box {
    flex: 1;
    min-width: 90px;
    overflow: hidden;
    transition: flex 0.5s cubic-bezier(0.25, 1, 0.5, 1), flex-basis 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.4s ease;
    margin: 0 10px;
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25);
    border-radius: 20px;
    border: 6px solid #ffffff;
    background-color: #ffffff;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    position: relative;
    user-select: none;
  }

  .img-wrapper {
    width: 100%;
    height: 82%;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* 仿独立版原版效果：初始图片局部放大200%，悬停恢复100% */
  .box img {
    width: 200%;
    height: 100%;
    object-fit: cover;
    transition: 0.5s ease;
  }

  .card-badge {
    position: absolute;
    top: 14px;
    left: 14px;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    color: #fff;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .stats-badge {
    position: absolute;
    bottom: 12px;
    right: 12px;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(6px);
    color: #fff;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 11px;
    white-space: nowrap;
  }

  /* 参考：手风琴_独立.html 中的标题 span */
  .title-container {
    height: 18%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 0 8px;
    text-align: center;
    background: #fff;
  }

  .title-text {
    font-size: 17px;
    font-weight: 700;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    transition: 0.3s;
  }

  .sub-text {
    font-size: 11px;
    color: #9ca3af;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
  }

  /* 悬浮展开效果 */
  .box:hover {
    flex-basis: 28%;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
  }

  .box:hover img {
    width: 100%;
  }

  .box:hover .title-text {
    color: #2563eb;
    font-size: 19px;
  }
</style>
