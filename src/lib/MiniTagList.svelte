<script>
  /**
   * MiniTagList Component
   *
   * Displays a list of small clickable tags with consistent styling.
   * Used in LocationCard and DetailPanel.
   *
   * @prop {Array<string>} tags - Array of tag strings to display
   *
   * @fires tagclick - When a tag is clicked (dispatches tag string)
   */

  import { createEventDispatcher } from 'svelte';

  export let tags = [];

  const dispatch = createEventDispatcher();

  /**
   * Handle tag click - triggers search for that tag
   * @param {MouseEvent} event - Click event
   * @param {string} tag - Tag that was clicked
   */
  function handleTagClick(event, tag) {
    event.stopPropagation();
    dispatch('tagclick', tag);
  }
</script>

{#if tags && tags.length > 0}
  <div class="tags">
    {#each tags as tag}
      <button
        class="tag tag-button"
        on:click={(e) => handleTagClick(e, tag)}
        title="Search for {tag}"
      >
        {tag}
      </button>
    {/each}
  </div>
{/if}

<style>
  .tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }

  .tag {
    padding: 0.25rem 0.5rem;
    background: var(--color-surface);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 0.625rem;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-normal);
    text-transform: uppercase;
    box-shadow: var(--shadow-sm);
  }

  .tag-button {
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
    margin: 0;
    line-height: 1;
  }

  .tag-button:hover {
    background: var(--color-accent);
    border-color: var(--color-border);
    color: var(--color-text-primary);
    transform: translate(-1px, -1px);
    box-shadow: var(--shadow-md);
  }

  .tag-button:active {
    transform: translate(0, 0);
    box-shadow: var(--shadow-sm);
  }

  /* Responsive: Slightly larger on mobile for easier tapping */
  @media (max-width: 1024px) {
    .tag {
      font-size: 0.7rem;
      padding: 2px 6px;
    }
  }
</style>
