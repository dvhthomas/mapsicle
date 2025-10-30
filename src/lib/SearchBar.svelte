<script>
  /**
   * SearchBar Component
   *
   * Provides fuzzy search functionality using Fuse.js
   * - Searches across location name, place, tags, and description
   * - Updates URL with search query
   * - Clear button triggers full application reset
   *
   * @prop {Array} locations - All locations to search through
   * @prop {string} searchQuery - Current search text (two-way bound)
   *
   * @fires search - Emitted when search results change
   */

  import { createEventDispatcher } from 'svelte';
  import Fuse from 'fuse.js';
  import { actions } from './stores/appState';

  export let locations = [];
  export let searchQuery = '';

  const dispatch = createEventDispatcher();
  let fuseSearchEngine;

  /**
   * Initialize Fuse.js fuzzy search engine
   * Configured to search multiple fields with weighted priorities
   */
  $: {
    if (locations.length > 0) {
      fuseSearchEngine = new Fuse(locations, {
        keys: [
          { name: 'name', weight: 2 },          // Highest priority
          { name: 'place', weight: 1.5 },
          { name: 'tags', weight: 1 },
          { name: 'description', weight: 0.5 }  // Lowest priority
        ],
        threshold: 0.3,        // Lower = more strict matching
        includeScore: true,
        includeMatches: true
      });
    }
  }

  /**
   * Reactive search trigger
   * Automatically searches when searchQuery changes
   */
  $: if (searchQuery !== undefined && fuseSearchEngine) {
    performSearch();
  }

  /**
   * Perform fuzzy search and emit results
   * Empty query returns all locations
   */
  function performSearch() {
    let results = locations;

    if (searchQuery.trim() && fuseSearchEngine) {
      const fuzzyResults = fuseSearchEngine.search(searchQuery);
      results = fuzzyResults.map(result => result.item);
    }

    dispatch('search', { results, query: searchQuery });
  }

  /**
   * Clear button handler
   * Triggers full application reset (clears all filters, selections, URL)
   */
  function handleClearButtonClick() {
    actions.reset();
  }
</script>

<div class="search-section">
  <div class="search-input-wrapper">
    <input
      type="text"
      bind:value={searchQuery}
      on:input={performSearch}
      placeholder="Search locations..."
      class="search-input"
      aria-label="Search locations"
    />
    {#if searchQuery}
      <button
        class="clear-search"
        on:click={handleClearButtonClick}
        aria-label="Clear search and reset filters"
      >
        ×
      </button>
    {/if}
  </div>
</div>
