<script>
  /**
   * Main page component for the Interactive Travel Map
   *
   * This is the orchestration layer that:
   * 1. Loads location data from server
   * 2. Initializes centralized state management
   * 3. Coordinates communication between UI components
   * 4. Manages URL state synchronization
   *
   * State management is handled via Svelte stores in appState.js
   * See STATE_MACHINE.md for detailed state flow documentation
   */

  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  // UI Components
  import Header from '$lib/Header.svelte';
  import Tools from '$lib/Tools.svelte';
  import SearchBar from '$lib/SearchBar.svelte';
  import DiscoverList from '$lib/DiscoverList.svelte';
  import Map from '$lib/Map.svelte';
  import DetailPanel from '$lib/DetailPanel.svelte';
  import VerticalCollapsible from '$lib/VerticalCollapsible.svelte';

  // Centralized state management (see STATE_MACHINE.md)
  import {
    allLocations,
    searchQuery,
    selectedTags,
    selectedLocation,
    filteredLocations,
    visibleLocations,
    galleryLocations,
    allTags,
    actions
  } from '$lib/stores/appState';

  // Application configuration
  import { config } from '$lib/config';

  /** @type {import('./$types').PageData} */
  export let data;

  let showDiscoverList = false;
  let searchBarComponent;
  let isSidebarOpen = false;

  /**
   * Initialize application state on mount
   * - Loads location data into store
   * - Syncs with URL parameters (for deep linking)
   */
  onMount(() => {
    allLocations.set(data.locations);
    actions.initializeFromURL($page.url.searchParams);

    // Global keyboard shortcuts
    const handleGlobalKeydown = (event) => {
      // '/' to focus search bar
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        // Don't trigger if user is typing in an input/textarea
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
          return;
        }
        event.preventDefault();
        if (searchBarComponent) {
          searchBarComponent.focusAndSelect();
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeydown);

    return () => window.removeEventListener('keydown', handleGlobalKeydown);
  });

  // ==========================================
  // Event Handlers
  // ==========================================
  // These are thin wrappers that translate component events
  // into state machine actions. See appState.js for implementation.

  /** Handle search input changes */
  function handleSearchResults(event) {
    actions.search(event.detail.query);
  }

  /** Handle clicking a tag in location card or detail panel */
  function handleTagClick(event) {
    actions.search(event.detail);
  }

  /** Handle tag filter selection changes */
  function handleTagFilterChange(event) {
    actions.filterByTags(event.detail);
  }

  /** Handle Tools component events */
  function handleToolsTagFilter(event) {
    actions.filterByTags(event.detail);
  }

  /** Handle location selection (opens detail panel) */
  function handleLocationSelect(event) {
    actions.selectLocation(event.detail);
    // Close mobile sidebar when location is selected
    isSidebarOpen = false;
  }

  /** Handle location hover (preview on map) */
  function handleLocationHover(event) {
    // Don't preview if a location is already selected - prevents map from
    // panning away when user scrolls past cards to reach map controls
    if ($selectedLocation) return;

    actions.hoverLocation(event.detail);
  }

  /** Handle map viewport changes (filters visible locations) */
  function handleMapBoundsChange(event) {
    actions.updateMapBounds(event.detail);
  }

  /** Handle discover button click */
  function handleDiscoverClick() {
    showDiscoverList = true;
  }

  /** Handle discover list close */
  function handleDiscoverClose() {
    showDiscoverList = false;
  }

  /** Handle location selection from discover list */
  function handleDiscoverSelect(event) {
    // Clear search context - user is browsing recent updates, not search results
    actions.clearFilters();

    handleLocationSelect(event);
    showDiscoverList = false;
  }
</script>

<svelte:head>
  <title>{config.pageTitle}</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<main class:searching={$searchQuery.trim() || $selectedTags.size > 0}>
  <Header />

  <div class="content-grid">
    <div class="sidebar">
      <Tools
        allTags={$allTags}
        selectedTags={$selectedTags}
        visibleLocations={$visibleLocations}
        selectedLocation={$selectedLocation}
        searchQuery={$searchQuery}
        on:discover={handleDiscoverClick}
        on:tagfilter={handleToolsTagFilter}
        on:select={handleLocationSelect}
        on:hover={handleLocationHover}
        on:tagclick={handleTagClick}
      />
    </div>

    <!-- Mobile: Sidebar as slide-in panel -->
    <VerticalCollapsible bind:isOpen={isSidebarOpen}>
      <Tools
        allTags={$allTags}
        selectedTags={$selectedTags}
        visibleLocations={$visibleLocations}
        selectedLocation={$selectedLocation}
        searchQuery={$searchQuery}
        on:discover={handleDiscoverClick}
        on:tagfilter={handleToolsTagFilter}
        on:select={handleLocationSelect}
        on:hover={handleLocationHover}
        on:tagclick={handleTagClick}
      />
    </VerticalCollapsible>

  <!-- Discover List Modal -->
  <DiscoverList
    locations={$galleryLocations}
    isOpen={showDiscoverList}
    on:select={handleDiscoverSelect}
    on:close={handleDiscoverClose}
  />

  <div class="map-and-detail">
    <div class="map-wrapper">
      <div class="map-search-overlay">
        <SearchBar
          bind:this={searchBarComponent}
          bind:searchQuery={$searchQuery}
          on:search={handleSearchResults}
        />
      </div>

      <Map
        locations={$filteredLocations}
        allLocations={$allLocations}
        selectedLocation={$selectedLocation}
        on:select={handleLocationSelect}
        on:boundschange={handleMapBoundsChange}
      />
    </div>

    {#if $selectedLocation}
      <DetailPanel
        bind:location={$selectedLocation}
        on:tagclick={handleTagClick}
      />
    {/if}
  </div>
  </div>
</main>
