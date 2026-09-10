<script lang="ts">
import { onDestroy, onMount } from "svelte";
import {
	courseCoverConfig,
	getCourseCover,
	getSubjectMeta,
	semesterGroups,
} from "@/config/subjectConfig";
import type { SemesterGroup, TreeNode } from "@/types/course";

const refreshSeed = typeof window !== "undefined" ? Date.now() : "";

function resolveSubjectCover(subId: string, defaultImage: string): string {
	if (defaultImage && !defaultImage.includes("t.alcy.cc")) {
		return defaultImage;
	}
	return getCourseCover(subId, refreshSeed);
}

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
                      src={resolveSubjectCover(subId, meta.image)}
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
                      src={resolveSubjectCover(subId, meta.image)}
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
