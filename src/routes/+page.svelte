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
  import SearchBar from '$lib/SearchBar.svelte';
  import TagFilter from '$lib/TagFilter.svelte';
  import LocationList from '$lib/LocationList.svelte';
  import ImageGallery from '$lib/ImageGallery.svelte';
  import Map from '$lib/Map.svelte';
  import DetailPanel from '$lib/DetailPanel.svelte';

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

  /** @type {import('./$types').PageData} */
  export let data;

  /**
   * Initialize application state on mount
   * - Loads location data into store
   * - Syncs with URL parameters (for deep linking)
   */
  onMount(() => {
    allLocations.set(data.locations);
    actions.initializeFromURL($page.url.searchParams);
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

  /** Handle location selection (opens detail panel) */
  function handleLocationSelect(event) {
    actions.selectLocation(event.detail);
  }

  /** Handle location hover (preview on map) */
  function handleLocationHover(event) {
    actions.hoverLocation(event.detail);
  }

  /** Handle map viewport changes (filters visible locations) */
  function handleMapBoundsChange(event) {
    actions.updateMapBounds(event.detail);
  }
</script>

<svelte:head>
  <title>Interactive Travel Map</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
</svelte:head>

<main>
  <div class="sidebar">
    <div class="sidebar-header">
      <h1>Travel Map</h1>
      <p>Explore places by tags</p>
    </div>

    <ImageGallery
      locations={$galleryLocations}
      selectedLocation={$selectedLocation}
      on:select={handleLocationSelect}
      on:hover={handleLocationHover}
    />

    <TagFilter
      tags={$allTags}
      selectedTags={$selectedTags}
      on:change={handleTagFilterChange}
    />

    <LocationList
      locations={$visibleLocations}
      selectedLocation={$selectedLocation}
      searchQuery={$searchQuery}
      on:select={handleLocationSelect}
      on:hover={handleLocationHover}
      on:tagclick={handleTagClick}
    />
  </div>

  <div class="map-and-detail">
    <div class="map-wrapper">
      <div class="map-search-overlay">
        <SearchBar
          locations={$allLocations}
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
</main>
