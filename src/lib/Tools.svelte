<script>
  /**
   * Tools Component
   *
   * Left sidebar containing:
   * - Discover Recent Updates button
   * - Tag filter
   * - Location list (filtered by current map view or search)
   *
   * Desktop: Fixed left column (320px wide)
   * Mobile: Hidden (search functionality moved to map overlay)
   */

  import { createEventDispatcher } from 'svelte';
  import TagFilter from './TagFilter.svelte';
  import LocationList from './LocationList.svelte';

  export let allTags = [];
  export let selectedTags = new Set();
  export let visibleLocations = [];
  export let selectedLocation = null;
  export let searchQuery = '';

  const dispatch = createEventDispatcher();

  function handleDiscoverClick() {
    dispatch('discover');
  }

  function handleTagFilterChange(event) {
    dispatch('tagfilter', event.detail);
  }

  function handleLocationSelect(event) {
    dispatch('select', event.detail);
  }

  function handleLocationHover(event) {
    dispatch('hover', event.detail);
  }

  function handleTagClick(event) {
    dispatch('tagclick', event.detail);
  }
</script>

<div class="tools">
  <div class="discover-section">
    <button class="discover-btn" on:click={handleDiscoverClick}>
      ✨ Discover Recent Updates
    </button>
  </div>

  <TagFilter
    tags={allTags}
    selectedTags={selectedTags}
    on:change={handleTagFilterChange}
  />

  <LocationList
    locations={visibleLocations}
    selectedLocation={selectedLocation}
    searchQuery={searchQuery}
    on:select={handleLocationSelect}
    on:hover={handleLocationHover}
    on:tagclick={handleTagClick}
  />
</div>

<style>
  .tools {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
    margin: 0;
    padding: 0;
  }

  .discover-section {
    background: var(--color-surface);
    border-bottom: var(--border-width) solid var(--color-border);
    margin: 0;
    padding: var(--spacing-md);
  }

  .discover-btn {
    width: 100%;
    background: var(--color-secondary);
    color: var(--color-text-primary);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 1rem;
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: var(--shadow-md);
    margin: 0;
    padding: var(--spacing-md) var(--spacing-lg);
  }

  .discover-btn:hover {
    background: var(--color-complement);
    transform: translate(-2px, -2px);
    box-shadow: var(--shadow-lg);
  }

  .discover-btn:active {
    transform: translate(-1px, -1px);
    box-shadow: var(--shadow-md);
  }
</style>
