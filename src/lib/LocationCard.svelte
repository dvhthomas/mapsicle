<script>
  /**
   * LocationCard Component
   *
   * Individual location card displayed in the LocationList.
   * Compact card showing name, place, and tags.
   *
   * Features:
   * - Click to select location (opens detail panel)
   * - Hover to preview location on map
   * - Click tags to search for that tag
   * - Keyboard accessible with Enter key
   * - Visual indicator when selected
   * - Search term highlighting (applied by parent)
   *
   * @prop {Object} location - Location data to display
   * @prop {boolean} selected - Whether this location is currently selected
   *
   * @fires select - When card is clicked
   * @fires hover - When mouse enters card
   * @fires tagclick - When a tag is clicked
   */

  import { createEventDispatcher, onDestroy } from 'svelte';

  export let location;
  export let selected = false;

  const dispatch = createEventDispatcher();
  let hoverTimeout;

  // Cleanup timeout on component destruction
  onDestroy(() => {
    clearTimeout(hoverTimeout);
  });

  /**
   * Debounced hover handler to prevent rapid-fire map updates
   */
  function debouncedHover() {
    clearTimeout(hoverTimeout);
    hoverTimeout = setTimeout(() => {
      dispatch('hover', location);
    }, 150); // 150ms delay
  }

  /**
   * Handle card click - selects location and opens detail panel
   */
  function handleCardClick() {
    dispatch('select', location);
  }

  /**
   * Handle keyboard navigation - Enter key selects location
   * @param {KeyboardEvent} event - Keyboard event
   */
  function handleKeydown(event) {
    if (event.key === 'Enter') {
      handleCardClick();
    }
  }

  /**
   * Handle tag click - triggers search for that tag
   * Stops event propagation to prevent card selection
   * @param {MouseEvent} event - Click event
   * @param {string} tag - Tag that was clicked
   */
  function handleTagClick(event, tag) {
    event.stopPropagation();
    dispatch('tagclick', tag);
  }
</script>

<div
  class="location-item"
  class:selected
  on:click={handleCardClick}
  on:mouseenter={debouncedHover}
  on:keydown={handleKeydown}
  role="button"
  tabindex="0"
>
  <h4>{location.name}</h4>
  <div class="location-place">{location.place}</div>
  {#if location.tags && location.tags.length > 0}
    <div class="tags">
      {#each location.tags as tag}
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
</div>
