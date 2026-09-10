<script lang="ts">
import type { TreeNode as TreeNodeType } from "@/types/course";
import TreeNode from "./TreeNode.svelte";

let {
	node,
	selectedPath = "",
	onSelect,
}: {
	node: TreeNodeType;
	selectedPath?: string;
	onSelect: (path: string) => void;
} = $props();

const isSelected = $derived(node.path === selectedPath);
const isMd = $derived(node.name.toLowerCase().endsWith(".md"));
</script>

{#if node.isDirectory}
  <details style="margin: 2px 0;">
    <summary style="cursor: pointer; user-select: none; padding: 2px 4px;">
      📁 <span>{node.name}</span>
    </summary>
    <div style="padding-left: 14px; border-left: 1px dotted #ccc; margin-left: 6px;">
      {#if node.children && node.children.length > 0}
        {#each node.children as child}
          <TreeNode node={child} {selectedPath} {onSelect} />
        {/each}
      {:else}
        <div style="color: #888; font-size: 12px; padding: 2px 4px;">(空目录)</div>
      {/if}
    </div>
  </details>
{:else}
  <div
    role="button"
    tabindex="0"
    style="
      cursor: pointer;
      user-select: none;
      padding: 2px 6px;
      margin: 1px 0;
      border-radius: 3px;
      background-color: {isSelected ? '#e0e7ff' : 'transparent'};
      color: {isSelected ? '#1d4ed8' : isMd ? '#111' : '#666'};
      font-weight: {isSelected ? 'bold' : 'normal'};
    "
    onclick={() => onSelect(node.path)}
    onkeydown={(e) => { if (e.key === 'Enter') onSelect(node.path); }}
  >
    <span>{isMd ? "📄" : "📎"}</span>
    <span style="margin-left: 4px;">{node.name}</span>
  </div>
{/if}
