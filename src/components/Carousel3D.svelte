<script lang="ts">
import { onDestroy, onMount } from "svelte";
import { getSubjectMeta, semesterGroups } from "@/config/subjectConfig";
import type { SemesterGroup, TreeNode } from "@/types/course";

let {
	tree = [],
	accordionMode = "continuous", // "continuous" | "independent"
	onSelectSubject,
}: {
	tree: TreeNode[];
	accordionMode: "continuous" | "independent";
	onSelectSubject: (subject: TreeNode) => void;
} = $props();

function getSubjectNode(id: string): TreeNode | undefined {
	return tree.find((n) => n.name === id);
}

const semesters: SemesterGroup[] = semesterGroups;
const count = semesters.length;
const angleStep = 360 / count;

// 舞台宽度与元素引用
let stageWidth = $state(740);
let stageEl: HTMLDivElement | null = $state(null);
let resizeObserver: ResizeObserver | null = null;

// 动态响应式尺寸：适配手机、Pad与桌面大屏
let isMobile = $derived(stageWidth <= 520);
let isTablet = $derived(stageWidth > 520 && stageWidth <= 768);

let cardWidth = $derived(
	isMobile
		? Math.max(280, stageWidth - 28) // 手机端：全宽留白 28px
		: isTablet
			? Math.max(360, Math.min(stageWidth - 40, 620)) // 平板端
			: 740, // 桌面端
);

let cardHeight = $derived(
	isMobile
		? Math.round(cardWidth * 0.72) // 手机端高宽比微调，保证文字可见
		: isTablet
			? Math.round(cardWidth * 0.6)
			: 420,
);

const rad = Math.PI / count; // 30 deg
let ringRadius = $derived(
	Math.round(cardWidth / 2 / Math.tan(rad)) + (isMobile ? 16 : 25),
);

let stageHeight = $derived(isMobile ? cardHeight + 60 : 540);

let perspectivePx = $derived(isMobile ? Math.round(cardWidth * 2.2) : 1400);

// 3D 旋转物理状态
let activeIndex = $state(0);
let isAutoRotate = $state(false);
let isDragging = false;
let hasDragged = false;
let startX = 0;
let startY = 0;
let startRotY = 0;
let startRotX = 0;
let currentRotY = 0;
let targetRotY = 0;
let currentRotX = -3;
let targetRotX = -3;
let dragVelocityY = 0;
let lastMoveTime = 0;
let lastMoveX = 0;
let isHovered = false;
let touchIsHorizontal: boolean | null = null;

// 触屏端交互：记录当前展开的学科 ID（无 Hover 环境下的点发展开）
let activeTouchSubject = $state<string | null>(null);

let ringEl: HTMLDivElement | null = null;
let animFrameId: number | null = null;

export function rotateToSemester(idx: number) {
	let targetAngle = -idx * angleStep;
	let diff = (targetAngle - targetRotY) % 360;
	if (diff > 180) diff -= 360;
	if (diff < -180) diff += 360;
	targetRotY += diff;
	activeTouchSubject = null;
	updateActiveIndex();
}

function step(direction: number) {
	targetRotY += direction * angleStep;
	activeTouchSubject = null;
	updateActiveIndex();
}

function updateActiveIndex() {
	let normalized = ((-targetRotY % 360) + 360) % 360;
	activeIndex = Math.round(normalized / angleStep) % count;
}

function snapToNearest() {
	let normalized = ((-targetRotY % 360) + 360) % 360;
	let nearestIdx = Math.round(normalized / angleStep) % count;
	rotateToSemester(nearestIdx);
}

function onPointerDown(e: MouseEvent | TouchEvent) {
	const target = e.target as HTMLElement;
	// 如果点击的是控制条按钮或指示点，不劫持拖拽
	if (
		target.closest(".control-bar") ||
		target.closest(".dot") ||
		target.closest(".ctrl-btn")
	) {
		return;
	}
	isDragging = true;
	hasDragged = false;
	touchIsHorizontal = null;
	startX = "clientX" in e ? e.clientX : e.touches[0].clientX;
	startY = "clientY" in e ? e.clientY : e.touches[0].clientY;
	lastMoveX = startX;
	lastMoveTime = performance.now();
	startRotY = targetRotY;
	startRotX = targetRotX;
	dragVelocityY = 0;
}

function onPointerMove(e: MouseEvent | TouchEvent) {
	if (!isDragging) return;
	const x = "clientX" in e ? e.clientX : e.touches[0].clientX;
	const y = "clientY" in e ? e.clientY : e.touches[0].clientY;
	const dx = x - startX;
	const dy = y - startY;

	if (touchIsHorizontal === null && "touches" in e) {
		if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
			touchIsHorizontal = Math.abs(dx) > Math.abs(dy);
		}
	}

	if (touchIsHorizontal === false) {
		return; // 纵向手势让渡给网页原生滚动
	}

	if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
		hasDragged = true;
	}

	const now = performance.now();
	const dt = now - lastMoveTime;
	if (dt > 0) {
		dragVelocityY = (x - lastMoveX) / dt;
	}
	lastMoveX = x;
	lastMoveTime = now;

	const dragSensitivity = isMobile ? 0.42 : 0.35;
	targetRotY = startRotY + dx * dragSensitivity;
	targetRotX = Math.max(-14, Math.min(14, startRotX - dy * 0.12));
}

function onPointerUp() {
	if (!isDragging) return;
	isDragging = false;
	touchIsHorizontal = null;
	if (Math.abs(dragVelocityY) > 0.12) {
		targetRotY += dragVelocityY * (isMobile ? 70 : 100);
	}
	snapToNearest();
	// 延迟重置 hasDragged，确保紧随其后的 click 事件能感知到拖拽状态并拦截误触
	setTimeout(() => {
		hasDragged = false;
	}, 90);
}

function onWheel(e: WheelEvent) {
	const target = e.target as HTMLElement;
	if (!target.closest(".accordion-body")) {
		e.preventDefault();
		targetRotY += e.deltaY * -0.12;
		updateActiveIndex();
	}
}

function onKeyDown(e: KeyboardEvent) {
	if (e.key === "ArrowLeft") step(1);
	if (e.key === "ArrowRight") step(-1);
	if (e.key === " ") isAutoRotate = !isAutoRotate;
}

function animate() {
	if (isAutoRotate && !isHovered && !isDragging) {
		targetRotY -= 0.12;
		updateActiveIndex();
	}

	currentRotY += (targetRotY - currentRotY) * 0.085;
	currentRotX += (targetRotX - currentRotX) * 0.085;

	if (ringEl) {
		// 核心数学变换：将旋转中心置于 Z 轴深处 -ringRadius
		// 使得当前处于正前方的卡片实际 Z 坐标为 0，完全保持 1:1 像素真实尺寸，绝不畸形放大！
		ringEl.style.transform = `translateZ(-${ringRadius}px) rotateX(${currentRotX}deg) rotateY(${currentRotY}deg)`;
	}

	animFrameId = requestAnimationFrame(animate);
}

onMount(() => {
	if (stageEl) {
		stageWidth = stageEl.clientWidth || 740;
		resizeObserver = new ResizeObserver((entries) => {
			for (const entry of entries) {
				if (entry.contentRect.width > 0) {
					stageWidth = Math.round(entry.contentRect.width);
				}
			}
		});
		resizeObserver.observe(stageEl);
	}

	window.addEventListener("mousemove", onPointerMove);
	window.addEventListener("mouseup", onPointerUp);
	window.addEventListener("touchmove", onPointerMove, { passive: true });
	window.addEventListener("touchend", onPointerUp);
	window.addEventListener("keydown", onKeyDown);

	animate();
});

onDestroy(() => {
	if (animFrameId) cancelAnimationFrame(animFrameId);
	if (resizeObserver) resizeObserver.disconnect();
	if (typeof window !== "undefined") {
		window.removeEventListener("mousemove", onPointerMove);
		window.removeEventListener("mouseup", onPointerUp);
		window.removeEventListener("touchmove", onPointerMove);
		window.removeEventListener("touchend", onPointerUp);
		window.removeEventListener("keydown", onKeyDown);
	}
});
</script>

<div class="carousel-3d-root">
  <!-- 3D 舞台：纯粹的 3D 环形展示区，视距与高度随屏幕动态自适应 -->
  <div
    class="stage-container"
    bind:this={stageEl}
    style="--stage-height: {stageHeight}px; height: {stageHeight}px; min-height: {stageHeight}px; perspective: {perspectivePx}px;"
    onmousedown={onPointerDown}
    ontouchstart={onPointerDown}
    onwheel={onWheel}
    role="region"
    aria-label="3D 课程轮播舞台"
  >
    <!-- 3D 环形容器 -->
    <div
      class="carousel-ring"
      bind:this={ringEl}
      style="--ring-radius: {ringRadius}px; --card-width: {cardWidth}px; --card-height: {cardHeight}px;"
    >
      {#each semesters as sem, semIdx}
        {@const isActive = activeIndex === semIdx}
        {@const angle = semIdx * angleStep}

        <div
          class="semester-card-item {accordionMode} {isActive ? 'active' : 'inactive'}"
          style="transform: rotateY({angle}deg) translateZ({ringRadius}px);"
          onclick={() => {
            if (hasDragged) return;
            if (!isActive) rotateToSemester(semIdx);
          }}
          role="group"
          aria-label={sem.name}
        >
          <!-- 学期内嵌手风琴展示区 -->
          <div class="accordion-body {accordionMode}">
            {#each sem.subjectIds as subId, subIdx}
              {@const subNode = getSubjectNode(subId)}
              {@const meta = getSubjectMeta(subId)}
              {@const isTouchExpanded = isMobile && (activeTouchSubject === subId || (!activeTouchSubject && subIdx === 0))}
              {@const targetSubjectNode = subNode || {
                name: subId,
                path: subId,
                isDirectory: true,
                children: [],
              }}

              {#if accordionMode === 'independent'}
                <!-- ================= 风格 1：独立卡片手风琴 (手风琴_独立.html) ================= -->
                <div
                  class="accordion-card independent-box {isTouchExpanded ? 'touch-expanded' : ''}"
                  role="button"
                  tabindex="0"
                  onclick={(e) => {
                    e.stopPropagation();
                    if (hasDragged) return;
                    if (isMobile) {
                      if (!isTouchExpanded) {
                        activeTouchSubject = subId;
                        return;
                      }
                    }
                    onSelectSubject(targetSubjectNode);
                  }}
                  onkeydown={(e) => {
                    if (e.key === 'Enter') onSelectSubject(targetSubjectNode);
                  }}
                >
                  <div class="independent-img-box" style="background: {meta.gradient};">
                    <img
                      src={meta.image}
                      alt={meta.name}
                      loading="lazy"
                      onerror={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>

                  <!-- 独立版底部标题区 -->
                  <div class="independent-caption">
                    <div class="ind-title">{meta.name}</div>
                    {#if meta.description}
                      <div class="ind-desc">{meta.description}</div>
                    {/if}
                  </div>
                </div>
              {:else}
                <!-- ================= 风格 2：连续无缝手风琴 (手风琴_连续.html) ================= -->
                <div
                  class="accordion-card continuous-item {isTouchExpanded ? 'touch-expanded' : ''}"
                  role="button"
                  tabindex="0"
                  onclick={(e) => {
                    e.stopPropagation();
                    if (hasDragged) return;
                    if (isMobile) {
                      if (!isTouchExpanded) {
                        activeTouchSubject = subId;
                        return;
                      }
                    }
                    onSelectSubject(targetSubjectNode);
                  }}
                  onkeydown={(e) => {
                    if (e.key === 'Enter') onSelectSubject(targetSubjectNode);
                  }}
                >
                  <div class="continuous-bg" style="background: {meta.gradient};">
                    <img
                      src={meta.image}
                      alt={meta.name}
                      loading="lazy"
                      onerror={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>

                  <!-- 连续版遮罩及文字层 -->
                  <div class="continuous-overlay">
                    <div class="overlay-bottom">
                      <h3 class="subject-name">{meta.name}</h3>
                      {#if meta.description}
                        <p class="subject-desc">{meta.description}</p>
                      {/if}
                      <div class="enter-btn">点击进入阅读 →</div>
                    </div>
                  </div>
                </div>
              {/if}
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- 底部控制器 (独立位于 3D 舞台下方，与卡片物理分离，适配 Firefly 主题色) -->
  <div class="control-bar-wrapper">
    <div class="control-bar">
      <button class="ctrl-btn" onclick={() => step(1)} title="上一学期 (←)" aria-label="上一学期">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>

      <button
        class="ctrl-btn play-btn {isAutoRotate ? 'active' : ''}"
        onclick={() => (isAutoRotate = !isAutoRotate)}
        title={isAutoRotate ? "暂停自动漫游 (空格)" : "开启自动漫游 (空格)"}
        aria-label="自动漫游开关"
      >
        {#if isAutoRotate}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1.5"></rect>
            <rect x="14" y="4" width="4" height="16" rx="1.5"></rect>
          </svg>
        {:else}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        {/if}
      </button>

      <!-- 6个学期指示胶囊 -->
      <div class="dots-container">
        {#each semesters as sem, idx}
          <div
            class="dot {activeIndex === idx ? 'active' : ''}"
            onclick={() => rotateToSemester(idx)}
            role="button"
            tabindex="0"
            onkeydown={(e) => { if (e.key === 'Enter') rotateToSemester(idx); }}
          >
            <span class="dot-text">{sem.name.split("·")[0].trim()}</span>
          </div>
        {/each}
      </div>

      <button class="ctrl-btn" onclick={() => step(-1)} title="下一学期 (→)" aria-label="下一学期">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    </div>
  </div>
</div>

<style>
  .carousel-3d-root {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
  }

  /* 3D 舞台：视距与高度随屏幕动态自适应，启用 touch-action: pan-y 保证纵向页面滚动不被截断 */
  .stage-container {
    position: relative;
    width: 100%;
    height: var(--stage-height, 540px);
    min-height: var(--stage-height, 540px);
    display: flex;
    align-items: center;
    justify-content: center;
    perspective: 1400px;
    user-select: none;
    cursor: grab;
    overflow: hidden;
    touch-action: pan-y;
  }

  .stage-container:active {
    cursor: grabbing;
  }

  /* 3D 环形容器 */
  .carousel-ring {
    position: absolute;
    width: var(--card-width);
    height: var(--card-height);
    transform-style: preserve-3d;
    transform-origin: center center;
    will-change: transform;
  }

  /* 学期外框卡片：宽 880px，高 480px */
  .semester-card-item {
    position: absolute;
    width: var(--card-width);
    height: var(--card-height);
    left: 0;
    top: 0;
    border-radius: 20px;
    background: #0f172a;
    border: 1px solid rgba(255, 255, 255, 0.16);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
    overflow: hidden;
    transition: opacity 0.4s ease, filter 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease;
  }

  .semester-card-item.continuous {
    padding: 0;
  }

  .semester-card-item.independent {
    padding: 16px;
    background: rgba(15, 23, 42, 0.85);
    backdrop-filter: blur(12px);
  }

  /* 处于正前方的激活学期：边框与光影随 Firefly 主题色动态变色 */
  .semester-card-item.active {
    opacity: 1;
    filter: none;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6), 0 0 0 2px var(--primary);
    border-color: color-mix(in srgb, var(--primary) 70%, transparent);
    z-index: 10;
    pointer-events: auto;
  }

  /* 侧面与背面的未激活学期：半透明、景深虚化、点击可直接转正 */
  .semester-card-item.inactive {
    opacity: 0.35;
    filter: brightness(0.6) blur(1.5px);
    cursor: pointer;
    pointer-events: auto;
  }

  .semester-card-item.inactive:hover {
    opacity: 0.6;
    filter: brightness(0.8) blur(0.5px);
  }

  /* ================= 内嵌手风琴主体 ================= */
  .accordion-body {
    width: 100%;
    height: 100%;
    display: flex;
    position: relative;
  }

  /* ================= 模式 1：独立卡片版 (手风琴_独立.html) ================= */
  .accordion-body.independent {
    gap: 12px;
    background: transparent;
  }

  .independent-box {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    border-radius: 16px;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    border: 3px solid #ffffff;
    cursor: pointer;
    transition: flex 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.35s ease, border-color 0.35s ease;
  }

  .independent-img-box {
    width: 100%;
    height: 72%;
    position: relative;
    overflow: hidden;
  }

  /* 独立版原版：初始局部放大，hover 变为 100% 全景 */
  .independent-img-box img {
    width: 180%;
    height: 100%;
    object-fit: cover;
    transition: width 0.5s ease;
    pointer-events: none;
    -webkit-user-drag: none;
    user-select: none;
  }

  .independent-caption {
    height: 28%;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    background: #ffffff;
    color: #0f172a;
  }

  .ind-title {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.3s;
  }

  .ind-desc {
    font-size: 11px;
    color: #64748b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 3px;
  }

  /* 独立版 Hover 展开效果 */
  .semester-card-item.active .accordion-body.independent:hover .independent-box {
    flex: 0.7;
  }

  .semester-card-item.active .accordion-body.independent .independent-box:hover {
    flex: 3.5;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.55);
    border-color: var(--primary);
  }

  .semester-card-item.active .accordion-body.independent .independent-box:hover img {
    width: 100%;
  }

  .semester-card-item.active .accordion-body.independent .independent-box:hover .ind-title {
    color: var(--primary);
    font-size: 17px;
  }

  /* ================= 模式 2：连续无缝版 (手风琴_连续.html) ================= */
  .accordion-body.continuous {
    width: 100%;
    height: 100%;
    border-radius: 20px;
    overflow: hidden;
    background: #020617;
  }

  .continuous-item {
    position: relative;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    cursor: pointer;
    transition: flex 0.55s cubic-bezier(0.25, 1, 0.5, 1);
    border-right: 1px solid rgba(255, 255, 255, 0.12);
  }

  .continuous-item:last-child {
    border-right: none;
  }

  .continuous-bg {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .continuous-bg img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transform: scale(1.06);
    transition: transform 0.6s ease;
    pointer-events: none;
    -webkit-user-drag: none;
    user-select: none;
  }

  /* 连续版渐变遮罩 */
  .continuous-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to top,
      rgba(2, 6, 23, 0.95) 0%,
      rgba(2, 6, 23, 0.5) 45%,
      rgba(2, 6, 23, 0.1) 75%,
      transparent 100%
    );
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 24px 20px;
    box-sizing: border-box;
    color: #ffffff;
  }

  .overlay-bottom {
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
  }

  /* 重点：默认状态下学科名称就必须清晰可见！ */
  .subject-name {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #f8fafc;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);
    transition: all 0.35s ease;
  }

  .subject-desc {
    margin: 4px 0 0;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1.5;
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    transition: all 0.35s ease;
  }

  .enter-btn {
    margin-top: 8px;
    font-size: 12px;
    font-weight: 600;
    color: var(--primary);
    opacity: 0;
    transform: translateY(6px);
    transition: all 0.35s ease;
    white-space: nowrap;
  }

  /* 连续版 Hover 核心展开：未悬停项挤压至 0.6，悬停项展开至 3.8 */
  .semester-card-item.active .accordion-body.continuous:hover .continuous-item {
    flex: 0.6;
  }

  .semester-card-item.active .accordion-body.continuous .continuous-item:hover {
    flex: 3.8;
  }

  .semester-card-item.active .accordion-body.continuous .continuous-item:hover img {
    transform: scale(1);
  }

  .semester-card-item.active .accordion-body.continuous .continuous-item:hover .subject-name {
    font-size: 24px;
    color: color-mix(in srgb, var(--primary) 80%, #ffffff);
  }

  .semester-card-item.active .accordion-body.continuous .continuous-item:hover .subject-desc {
    max-height: 48px;
    opacity: 1;
  }

  .semester-card-item.active .accordion-body.continuous .continuous-item:hover .enter-btn {
    opacity: 1;
    transform: translateY(0);
  }

  /* ================= 底部控制器 (独立于 3D 舞台下方，无任何重叠遮挡，适配 Firefly 主题色) ================= */
  .control-bar-wrapper {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding-top: 14px;
    padding-bottom: 4px;
    position: relative;
    z-index: 20;
  }

  .control-bar {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: color-mix(in srgb, var(--card-bg) 85%, transparent);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    padding: 6px 14px;
    border-radius: 9999px;
    border: 1px solid color-mix(in srgb, var(--btn-content) 12%, transparent);
    box-shadow: 0 4px 18px -2px rgba(0, 0, 0, 0.08), 0 2px 8px -2px color-mix(in srgb, var(--primary) 10%, transparent);
    user-select: none;
    transition: all 0.3s ease;
  }

  .ctrl-btn {
    background: transparent;
    border: none;
    color: var(--btn-content);
    opacity: 0.7;
    cursor: pointer;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .ctrl-btn:hover {
    opacity: 1;
    color: var(--primary);
    background: color-mix(in srgb, var(--primary) 12%, transparent);
    transform: scale(1.08);
  }

  .ctrl-btn:active {
    transform: scale(0.92);
  }

  .ctrl-btn.play-btn.active {
    opacity: 1;
    color: var(--primary);
    background: color-mix(in srgb, var(--primary) 16%, transparent);
  }

  .dots-container {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 4px;
  }

  .dot {
    height: 28px;
    padding: 0 13px;
    border-radius: 9999px;
    border: 1px solid color-mix(in srgb, var(--btn-content) 12%, transparent);
    color: var(--btn-content);
    background: color-mix(in srgb, var(--btn-content) 6%, transparent);
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
  }

  .dot:hover {
    color: var(--primary);
    background: color-mix(in srgb, var(--primary) 12%, transparent);
    border-color: color-mix(in srgb, var(--primary) 25%, transparent);
    transform: translateY(-1px);
  }

  .dot.active {
    background: var(--primary);
    color: #ffffff;
    border-color: transparent;
    box-shadow: 0 3px 12px color-mix(in srgb, var(--primary) 40%, transparent);
    transform: translateY(-1px);
    font-weight: 600;
  }

  .dot-text {
    font-size: 12px;
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;
  }

  .dot.active .dot-text {
    color: #ffffff;
    font-weight: 600;
  }

  /* 移动端/触屏端主动展开支持 */
  .semester-card-item.active .accordion-body.continuous .continuous-item.touch-expanded {
    flex: 3.8;
  }
  .semester-card-item.active .accordion-body.continuous .continuous-item.touch-expanded img {
    transform: scale(1);
  }
  .semester-card-item.active .accordion-body.continuous .continuous-item.touch-expanded .subject-name {
    font-size: 19px;
    color: color-mix(in srgb, var(--primary) 80%, #ffffff);
  }
  .semester-card-item.active .accordion-body.continuous .continuous-item.touch-expanded .subject-desc {
    max-height: 48px;
    opacity: 1;
  }
  .semester-card-item.active .accordion-body.continuous .continuous-item.touch-expanded .enter-btn {
    opacity: 1;
    transform: translateY(0);
  }

  .semester-card-item.active .accordion-body.independent .independent-box.touch-expanded {
    flex: 3.5;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.55);
    border-color: var(--primary);
  }
  .semester-card-item.active .accordion-body.independent .independent-box.touch-expanded img {
    width: 100%;
  }
  .semester-card-item.active .accordion-body.independent .independent-box.touch-expanded .ind-title {
    color: var(--primary);
    font-size: 15px;
  }

  @media (max-width: 640px) {
    .control-bar-wrapper {
      padding-top: 10px;
    }
    .control-bar {
      gap: 5px;
      padding: 4px 10px;
      max-width: calc(100vw - 20px);
      overflow-x: auto;
      scrollbar-width: none;
    }
    .control-bar::-webkit-scrollbar {
      display: none;
    }
    .dots-container {
      gap: 4px;
      margin: 0 2px;
      overflow-x: auto;
      scrollbar-width: none;
    }
    .dots-container::-webkit-scrollbar {
      display: none;
    }
    .dot {
      height: 24px;
      padding: 0 8px;
    }
    .dot-text {
      font-size: 11px;
    }
    .ctrl-btn {
      width: 26px;
      height: 26px;
    }
    .continuous-overlay {
      padding: 14px 12px;
    }
    .subject-name {
      font-size: 15px;
    }
    .semester-card-item {
      border-radius: 16px;
    }
    .accordion-body.continuous {
      border-radius: 16px;
    }
  }
</style>
