<script>
  /**
   * TagFilter Component
   *
   * Collapsible tag filter section with multi-select functionality.
   * Uses AND logic - locations must have ALL selected tags to appear.
   *
   * Features:
   * - Collapsible section to save sidebar space
   * - Shows count of active filters in header
   * - Visual indication of selected tags
   * - Triggers state machine filter action on change
   *
   * @prop {Array<string>} tags - All available tags (sorted, deduplicated)
   * @prop {Set<string>} selectedTags - Currently active tag filters
   *
   * @fires change - Emitted when tag selection changes, passes new Set of tags
   */

  import { createEventDispatcher } from 'svelte';

  export let tags = [];
  export let selectedTags = new Set();

  const dispatch = createEventDispatcher();
  let isExpanded = false;

  /**
   * Toggle a tag's selection state
   * Creates new Set to ensure reactivity
   * @param {string} tag - Tag to toggle on/off
   */
  function toggleTagSelection(tag) {
    const newSelectedTags = new Set(selectedTags);

    if (newSelectedTags.has(tag)) {
      newSelectedTags.delete(tag);
    } else {
      newSelectedTags.add(tag);
    }

    dispatch('change', newSelectedTags);
  }

  /**
   * Toggle collapse/expand state of filter section
   */
  function toggleExpanded() {
    isExpanded = !isExpanded;
  }
</script>

{#if tags.length > 0}
  <div class="filter-section">
    <button class="filter-header" on:click={toggleExpanded}>
      <h3>Filter by Tags {#if selectedTags.size > 0}({selectedTags.size}){/if}</h3>
      <span class="expand-icon" class:expanded={isExpanded}>▼</span>
    </button>
    {#if isExpanded}
      <div class="tag-filters" class:expanded={isExpanded}>
        {#each tags as tag}
          <button
            class="tag-filter"
            class:active={selectedTags.has(tag)}
            on:click={() => toggleTagSelection(tag)}
          >
            {tag}
          </button>
        {/each}
      </div>
    {/if}
  </div>
{/if}
