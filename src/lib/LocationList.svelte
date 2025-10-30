<script>
  /**
   * LocationList Component
   *
   * Scrollable list of location cards with search term highlighting.
   * Acts as the primary navigation interface in the sidebar.
   *
   * Features:
   * - Displays filtered/searched locations as cards
   * - Highlights search terms in real-time using Mark.js
   * - Click to select location (opens detail panel)
   * - Hover to preview location on map
   * - Click tags to search for that tag
   * - Visual indicator for selected location
   * - Shows "no results" message when empty
   *
   * @prop {Array} locations - Filtered locations to display
   * @prop {Object|null} selectedLocation - Currently selected location
   * @prop {string} searchQuery - Current search text (for highlighting)
   *
   * @fires select - When a location card is clicked
   * @fires hover - When mouse enters a location card
   * @fires tagclick - When a tag in a card is clicked
   */

  import { afterUpdate } from 'svelte';
  import { browser } from '$app/environment';
  import { createEventDispatcher } from 'svelte';
  import Mark from 'mark.js';
  import LocationCard from './LocationCard.svelte';
  import Collapsible from './Collapsible.svelte';
  import { locationListTitle, discoverMode, selectedTags } from './stores/appState';

  export let locations = [];
  export let selectedLocation = null;
  export let searchQuery = '';

  const dispatch = createEventDispatcher();
  let isExpanded = true; // Expanded by default

  // Reactive tooltip based on current state
  $: tooltipText = $discoverMode
    ? 'Most recently updated locations'
    : searchQuery.trim() || $selectedTags.size > 0
    ? 'Matching locations for your search or filter'
    : 'Locations visible in the current map view';

  /**
   * Forward select event from child LocationCard components
   */
  function handleSelect(event) {
    dispatch('select', event.detail);
  }

  /**
   * Forward hover event from child LocationCard components
   */
  function handleHover(event) {
    dispatch('hover', event.detail);
  }

  /**
   * Forward tag click event from child LocationCard components
   */
  function handleTagClick(event) {
    dispatch('tagclick', event.detail);
  }

  /**
   * Highlight search terms in location cards after each update
   * Uses Mark.js to visually emphasize matching text
   * Runs only in browser context after DOM updates
   */
  afterUpdate(() => {
    if (browser) {
      const listContainer = document.querySelector('.locations-list');
      if (listContainer) {
        const highlighter = new Mark(listContainer);

        // Clear previous highlights
        highlighter.unmark();

        // Apply new highlights if there's a search query
        if (searchQuery.trim()) {
          highlighter.mark(searchQuery, {
            separateWordSearch: false,  // Match entire phrase
            accuracy: 'partially',      // Allow partial word matches
            className: 'search-highlight'
          });
        }
      }
    }
  });
</script>

<Collapsible
  title={$locationListTitle}
  bind:isExpanded
  fill={true}
  tooltip={tooltipText}
>
  <div class="locations-list">
    {#if locations.length === 0}
      <p class="no-results">No locations match the selected filters.</p>
    {:else}
      {#each locations as location (location.slug)}
        <LocationCard
          {location}
          selected={selectedLocation === location}
          on:select={handleSelect}
          on:hover={handleHover}
          on:tagclick={handleTagClick}
        />
      {/each}
    {/if}
  </div>
</Collapsible>

<style>
  .locations-list {
    padding: var(--spacing-sm) 0;
    background: var(--color-surface);
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .no-results {
    padding: var(--spacing-md);
    color: var(--color-text-secondary);
    text-align: center;
    font-size: 0.875rem;
  }

  /* Responsive: More compact list on mobile/tablet */
  @media (max-width: 1024px) {
    .locations-list {
      padding: var(--spacing-xs);
    }
  }
</style>
