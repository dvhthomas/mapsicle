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
  import MiniTagList from './MiniTagList.svelte';

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
   * Forward tag clicks from MiniTagList to parent
   */
  function handleTagClick(event) {
    dispatch('tagclick', event.detail);
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
  <MiniTagList tags={location.tags} on:tagclick={handleTagClick} />
</div>

<style>
  .location-item {
    padding: var(--spacing-md) var(--spacing-lg);
    margin: var(--spacing-md);
    background: var(--color-surface);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: none;
    box-shadow: var(--shadow-md);
  }

  .location-item:hover {
    background: var(--color-complement);
    box-shadow: var(--shadow-lg);
    transform: translate(-2px, -2px);
  }

  .location-item.selected {
    border-width: var(--border-width-thick);
    border-color: var(--color-border);
    background: var(--color-primary);
    box-shadow: var(--shadow-xl);
    transform: translate(-3px, -3px);
  }

  .location-item h4 {
    font-size: 1.125rem;
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--spacing-xs);
    color: var(--color-text-primary);
    text-transform: uppercase;
    letter-spacing: -0.01em;
  }

  .location-place {
    font-size: 0.8125rem;
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-sm);
  }

  /* Responsive: Compact location cards on mobile/tablet */
  @media (max-width: 1024px) {
    .location-item {
      margin: var(--spacing-xs) var(--spacing-sm);
      padding: var(--spacing-sm);
    }

    .location-item h4 {
      font-size: 0.95rem;
    }
  }
</style>
