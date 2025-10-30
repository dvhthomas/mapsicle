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
  import Collapsible from './Collapsible.svelte';

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
</script>

{#if tags.length > 0}
  <Collapsible
    title="Filter by Tags"
    count={selectedTags.size}
    bind:isExpanded
    tooltip="Click on one or more tags to do an 'AND' search"
  >
    <div class="tag-filters">
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
  </Collapsible>
{/if}

<style>
  .tag-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
    padding: var(--spacing-xs) var(--spacing-lg) var(--spacing-lg) var(--spacing-lg);
    max-height: 5.5rem;
    overflow-y: auto;
  }

  .tag-filter {
    padding: 0.375rem 0.75rem;
    background: var(--color-surface);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    cursor: pointer;
    transition: none;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-normal);
    box-shadow: var(--shadow-sm);
    text-transform: uppercase;
  }

  .tag-filter:hover {
    background: var(--color-complement);
    transform: translate(-1px, -1px);
    box-shadow: var(--shadow-md);
  }

  .tag-filter.active {
    background: var(--color-secondary);
    color: var(--color-text-primary);
    border-color: var(--color-border);
    box-shadow: var(--shadow-md);
    transform: translate(-2px, -2px);
  }

  /* Responsive: Hide tags on mobile */
  @media (max-width: 1024px) {
    .tag-filters {
      display: none;
    }
  }

  /* Tablet: More compact styling */
  @media (max-width: 1024px) {
    .tag-filters {
      padding: var(--spacing-sm) var(--spacing-md);
    }

    .tag-filter {
      font-size: 0.75rem;
      padding: 4px 8px;
    }
  }
</style>
