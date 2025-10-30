<script>
  /**
   * Interactive Map Component using Leaflet.js
   *
   * Features:
   * - Displays locations as markers on a map
   * - Supports filtering and search (via locations prop)
   * - Click markers to select locations
   * - Hover integration with other components
   * - Two action buttons: Discover (latest) and View All (reset)
   *
   * Props:
   * @prop {Array} locations - Filtered locations to display as markers
   * @prop {Array} allLocations - All locations (for Discover/Reset features)
   * @prop {Object|null} selectedLocation - Currently selected location
   *
   * Events:
   * @fires select - When a location is selected (marker click)
   * @fires boundschange - When map viewport changes
   */

  import { onMount, createEventDispatcher } from 'svelte';
  import { marked } from 'marked';
  import { get } from 'svelte/store';
  import { isPreviewingLocation, actions, galleryLocations } from './stores/appState';
  import DiscoverList from './DiscoverList.svelte';

  export let locations = [];           // Filtered locations (what's currently shown)
  export let allLocations = [];        // All locations (for Discover/Reset)
  export let selectedLocation = null;  // Currently selected location

  const dispatch = createEventDispatcher();
  let showDiscoverList = false;

  // Leaflet map instance and related state
  let L;                    // Leaflet library (loaded dynamically)
  let map;                  // Leaflet map instance
  let markers = [];         // Array of current marker objects
  let mapContainer;         // DOM element reference

  /**
   * Create HTML for map marker popup
   * Shows location name and place in a compact format
   */
  function createMarkerPopupHTML(location) {
    return `
      <div class="popup-content popup-compact">
        <h3>${location.name}</h3>
        <div class="place">${location.place}</div>
      </div>
    `;
  }

  /**
   * Emit current map bounds to parent component
   * Used to filter visible locations in sidebar
   * Skips updates during hover previews to prevent list reordering
   */
  function notifyBoundsChanged() {
    if (!map || get(isPreviewingLocation)) return;

    const bounds = map.getBounds();
    dispatch('boundschange', {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    });
  }

  /**
   * Update map markers based on current locations prop
   * - Removes all existing markers
   * - Creates new markers for each location
   * - Fits map to show all markers
   */
  function refreshMapMarkers() {
    if (!map || !L) return;

    // Clear existing markers from map
    markers.forEach(marker => marker.remove());
    markers = [];

    // Create new markers for each location
    locations.forEach(location => {
      if (!location.coords) return;

      const marker = L.marker([location.coords.lat, location.coords.lon])
        .addTo(map)
        .bindPopup(createMarkerPopupHTML(location), {
          maxWidth: 300,
          minWidth: 250,
          autoPanPadding: [80, 80], // Extra padding to prevent cutoff (especially on mobile)
          autoPanPaddingTopLeft: [80, 100] // Extra top padding for mobile header/search
        });

      // Clicking a marker selects the location (opens detail panel)
      marker.on('click', () => {
        dispatch('select', location);
      });

      markers.push(marker);
    });

    // Auto-fit map to show all markers with minimal padding for tighter zoom
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => m.getLatLng()));
      // Delay to ensure map container has correct dimensions
      setTimeout(() => {
        if (map) {
          map.invalidateSize();  // Recalculate map size
          map.fitBounds(bounds, { padding: [20, 20], maxZoom: 10 });
        }
      }, 100);
    }
  }

  /**
   * Handle changes to selectedLocation prop
   * Centers map on location and opens its popup
   * If map is at minimum zoom (world view), zooms in a few levels
   */
  function focusOnSelectedLocation() {
    if (!map || !selectedLocation || !selectedLocation.coords) return;

    // Recalculate map container size BEFORE centering
    // This ensures Leaflet knows the correct dimensions after detail panel opens
    map.invalidateSize();

    // Determine appropriate zoom level
    const currentZoom = map.getZoom();
    let targetZoom = 12; // Default close-up zoom

    // If map is at world view (zoom <= 4), zoom in just a few levels to show region
    // Otherwise use close-up zoom (12)
    if (currentZoom <= 4) {
      targetZoom = 8; // Regional view
    }

    // Center the map on the location with appropriate zoom
    // Works even if marker doesn't exist yet (timing issue with marker refresh)
    setTimeout(() => {
      map.setView([selectedLocation.coords.lat, selectedLocation.coords.lon], targetZoom);

      // Try to open popup if marker exists
      const marker = markers.find(m =>
        m.getLatLng().lat === selectedLocation.coords.lat &&
        m.getLatLng().lng === selectedLocation.coords.lon
      );
      if (marker) {
        marker.openPopup();
      }
    }, 100);
  }

  // Reactive statements - automatically run when dependencies change
  $: if (locations && map) {
    refreshMapMarkers();
  }

  $: if (selectedLocation) {
    focusOnSelectedLocation();
  }

  /**
   * Reactive: Recalculate map size when detail panel opens/closes
   * Leaflet needs to know when its container changes dimensions
   */
  $: {
    const isDetailPanelOpen = !!selectedLocation;
    if (map) {
      // Delay to ensure DOM has updated
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }

  /**
   * Handle hover event from gallery/location cards
   * Centers map on location and shows popup without selecting
   * Preview flag managed by state store to prevent list reordering
   * @param {CustomEvent} event - Contains location to preview
   */
  function previewLocationOnMap(event) {
    const location = event.detail;
    if (!map || !location || !location.coords) return;

    // Find the marker for this location
    const marker = markers.find(m =>
      m.getLatLng().lat === location.coords.lat &&
      m.getLatLng().lng === location.coords.lon
    );

    if (marker) {
      // Center the location in the map canvas (keep current zoom level)
      const currentZoom = map.getZoom();

      // Force immediate centering to avoid interference from other map events
      map.stop(); // Stop any ongoing animations
      map.setView([location.coords.lat, location.coords.lon], currentZoom, {
        animate: false // Use immediate centering for hover preview
      });

      marker.openPopup();

      // Force tile update after pan
      setTimeout(() => {
        map.invalidateSize();
      }, 50);
    }
  }

  /**
   * "View All" button handler
   * Resets all filters and zooms to show all locations
   * Triggers state machine reset action
   */
  function handleViewAllButtonClick() {
    if (!map) return;

    // Trigger full application reset via state machine
    actions.reset();

    // Calculate bounds for all locations
    const allLocationCoords = allLocations
      .filter(loc => loc.coords)
      .map(loc => [loc.coords.lat, loc.coords.lon]);

    if (allLocationCoords.length > 0) {
      const bounds = L.latLngBounds(allLocationCoords);
      map.fitBounds(bounds, { padding: [20, 20], maxZoom: 10, animate: true });
    }
  }

  /**
   * "Discover" button handler
   * Opens modal showing all recent updates
   */
  function handleDiscoverButtonClick() {
    if (!map || allLocations.length === 0) return;

    // Show discover list modal
    showDiscoverList = true;
  }

  /**
   * Handle location selection from discover list
   */
  function handleDiscoverSelect(event) {
    dispatch('select', event.detail);
    showDiscoverList = false;
  }

  /**
   * Handle discover list close
   */
  function handleDiscoverClose() {
    showDiscoverList = false;
  }

  /**
   * Handle window resize events
   * Debounced to wait for resize to finish, then update map appropriately
   */
  let resizeTimeout;
  function handleWindowResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (!map) return;

      // Recalculate map size after resize
      map.invalidateSize();

      // If there's a selected location, recenter on it
      if (selectedLocation && selectedLocation.coords) {
        const currentZoom = map.getZoom();
        map.setView([selectedLocation.coords.lat, selectedLocation.coords.lon], currentZoom);
      }
    }, 250); // 250ms debounce
  }

  onMount(async () => {
    // Import Leaflet and MapTiler SDK only in the browser
    L = (await import('leaflet')).default;
    const { MaptilerLayer } = await import('@maptiler/leaflet-maptilersdk');

    // Initialize the map with zoom controls positioned at bottom left
    map = L.map(mapContainer, {
      zoomControl: false
    }).setView([40, -100], 4);

    // Add zoom control to bottom left
    L.control.zoom({
      position: 'bottomleft'
    }).addTo(map);

    // Get MapTiler API key from environment variable
    const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;

    // Add MapTiler vector tiles layer
    if (apiKey) {
      new MaptilerLayer({
        apiKey: apiKey,
        style: 'outdoors-v2' // Outdoor/topographic style with terrain details
      }).addTo(map);
    } else {
      console.warn('MapTiler API key not found. Using OpenStreetMap raster tiles.');
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);
    }

    // Add initial markers
    refreshMapMarkers();

    // Listen for map movement and zoom to emit bounds
    map.on('moveend', notifyBoundsChanged);
    map.on('zoomend', notifyBoundsChanged);

    // Listen for hover events from store action (triggered by hovering cards/gallery)
    window.addEventListener('locationhover', previewLocationOnMap);

    // Listen for reset view event from store
    const handleResetViewTrigger = () => {
      if (!map || allLocations.length === 0) return;

      const allMarkers = allLocations
        .filter(loc => loc.coords)
        .map(loc => [loc.coords.lat, loc.coords.lon]);

      if (allMarkers.length > 0) {
        const bounds = L.latLngBounds(allMarkers);
        map.fitBounds(bounds, { padding: [20, 20], maxZoom: 10, animate: true });
      }
    };
    window.addEventListener('resetview', handleResetViewTrigger);

    // Listen for window resize events
    window.addEventListener('resize', handleWindowResize);

    // Emit initial bounds after map is fully initialized
    setTimeout(notifyBoundsChanged, 100);

    // Cleanup on component unmount
    return () => {
      clearTimeout(resizeTimeout);
      if (map) {
        map.off('moveend', notifyBoundsChanged);
        map.off('zoomend', notifyBoundsChanged);
        map.remove();
      }
      window.removeEventListener('locationhover', previewLocationOnMap);
      window.removeEventListener('resetview', handleResetViewTrigger);
      window.removeEventListener('resize', handleWindowResize);
    };
  });
</script>

<div class="map-container">
  <!-- Leaflet map container -->
  <div bind:this={mapContainer} style="width: 100%; height: 100%;"></div>

  <!-- Map control buttons (bottom-right corner) -->
  <div class="map-controls">
    <button
      class="map-control-btn"
      on:click={handleDiscoverButtonClick}
      title="Zoom to most recent location"
    >
      ✨ Discover
    </button>
    <button
      class="map-control-btn"
      on:click={handleViewAllButtonClick}
      title="Zoom to show all locations"
    >
      🌍 View All
    </button>
  </div>

  <!-- Discover list modal -->
  <DiscoverList
    locations={$galleryLocations}
    isOpen={showDiscoverList}
    on:select={handleDiscoverSelect}
    on:close={handleDiscoverClose}
  />
</div>

<style>
  .map-container {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .map-controls {
    position: absolute;
    bottom: var(--spacing-md);
    right: var(--spacing-md);
    display: flex;
    gap: var(--spacing-sm);
    z-index: 1000;
    pointer-events: none;
  }

  .map-control-btn {
    pointer-events: all;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-surface);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-lg);
    color: var(--color-text-primary);
    font-size: 0.875rem;
    font-weight: var(--font-weight-bold);
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    white-space: nowrap;
    font-family: var(--font-family);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .map-control-btn:hover {
    background: var(--color-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  .map-control-btn:active {
    transform: translateY(0);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  }

  /* Leaflet zoom controls - Neobrutalism style */
  :global(.leaflet-control-zoom) {
    border: var(--border-width-thick) solid var(--color-border) !important;
    border-radius: var(--radius-md) !important;
    box-shadow: var(--shadow-lg) !important;
    overflow: hidden !important;
  }

  :global(.leaflet-control-zoom a) {
    background: var(--color-surface) !important;
    color: var(--color-text-primary) !important;
    border: none !important;
    border-radius: 0 !important;
    font-weight: var(--font-weight-bold) !important;
    width: 40px !important;
    height: 40px !important;
    line-height: 40px !important;
    font-size: 1.5rem !important;
    border-bottom: var(--border-width) solid var(--color-border) !important;
  }

  :global(.leaflet-control-zoom a:last-child) {
    border-bottom: none !important;
  }

  :global(.leaflet-control-zoom a:hover) {
    background: var(--color-primary) !important;
    color: var(--color-text-primary) !important;
  }

  /* Leaflet popup customization */
  :global(.leaflet-popup-content-wrapper) {
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    padding: 0;
    overflow: hidden;
    border: var(--border-width-thick) solid var(--color-border);
  }

  :global(.leaflet-popup-content) {
    margin: 0;
    min-width: 280px;
    max-width: 350px;
    font-family: var(--font-family);
  }

  :global(.leaflet-popup-tip) {
    box-shadow: var(--shadow-lg);
    border: var(--border-width) solid var(--color-border);
  }

  :global(.popup-content) {
    padding: var(--spacing-lg);
  }

  :global(.popup-content h3) {
    margin: 0 0 var(--spacing-xs) 0;
    color: var(--color-text-primary);
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.3;
  }

  :global(.popup-content .place) {
    color: var(--color-text-secondary);
    font-size: 0.8125rem;
    margin-bottom: var(--spacing-md);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  :global(.popup-content .place::before) {
    content: "📍";
    font-size: 0.875rem;
  }

  :global(.popup-content .description) {
    line-height: 1.65;
    color: var(--color-text-primary);
  }

  :global(.popup-content .description h1) {
    font-size: 1rem;
    font-weight: 600;
    margin: var(--spacing-md) 0 var(--spacing-sm) 0;
    color: var(--color-text-primary);
  }

  :global(.popup-content .description h2) {
    font-size: 0.9375rem;
    font-weight: 600;
    margin: var(--spacing-sm) 0 var(--spacing-xs) 0;
    color: var(--color-text-primary);
  }

  :global(.popup-content .description p) {
    margin: var(--spacing-sm) 0;
    font-size: 0.875rem;
    color: var(--color-text-primary);
  }

  :global(.popup-content .description ul),
  :global(.popup-content .description ol) {
    margin: var(--spacing-sm) 0;
    padding-left: var(--spacing-lg);
  }

  :global(.popup-content .description li) {
    margin: var(--spacing-xs) 0;
    font-size: 0.875rem;
    color: var(--color-text-primary);
  }

  :global(.popup-content .description strong) {
    font-weight: 600;
    color: var(--color-text-primary);
  }

  :global(.popup-content .description em) {
    color: var(--color-text-secondary);
  }

  :global(.popup-content .tags) {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-md);
    border-top: 1px solid var(--color-border);
  }

  :global(.popup-content .tag) {
    padding: 0.25rem 0.625rem;
    background: var(--color-background);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 0.75rem;
    color: var(--color-text-secondary);
    font-weight: 500;
  }

  /* Compact popup for simplified map tips */
  :global(.popup-compact) {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  :global(.popup-compact h3) {
    margin: 0;
    font-size: 1rem;
  }

  :global(.popup-compact .place) {
    margin: 0.25rem 0 0 0;
  }
</style>
