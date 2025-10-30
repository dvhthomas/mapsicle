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

  export let locations = [];           // Filtered locations (what's currently shown)
  export let allLocations = [];        // All locations (for Discover/Reset)
  export let selectedLocation = null;  // Currently selected location

  const dispatch = createEventDispatcher();

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
   */
  function notifyBoundsChanged() {
    if (!map) return;

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
          minWidth: 250
        });

      // Clicking a marker selects the location (opens detail panel)
      marker.on('click', () => {
        dispatch('select', location);
      });

      markers.push(marker);
    });

    // Auto-fit map to show all markers with some padding
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => m.getLatLng()));
      // Delay to ensure map container has correct dimensions
      setTimeout(() => {
        if (map) {
          map.invalidateSize();  // Recalculate map size
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      }, 100);
    }
  }

  /**
   * Handle changes to selectedLocation prop
   * Centers map on location and opens its popup
   */
  function focusOnSelectedLocation() {
    if (!map || !selectedLocation || !selectedLocation.coords) return;

    // Find the marker for the selected location
    const marker = markers.find(m =>
      m.getLatLng().lat === selectedLocation.coords.lat &&
      m.getLatLng().lng === selectedLocation.coords.lon
    );

    if (marker) {
      // Center the map on the location
      map.setView([selectedLocation.coords.lat, selectedLocation.coords.lon], 12);
      marker.openPopup();
    }
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
    import('./stores/appState').then(({ actions }) => {
      actions.reset();
    });

    // Calculate bounds for all locations
    const allLocationCoords = allLocations
      .filter(loc => loc.coords)
      .map(loc => [loc.coords.lat, loc.coords.lon]);

    if (allLocationCoords.length > 0) {
      const bounds = L.latLngBounds(allLocationCoords);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }

  /**
   * "Discover" button handler
   * Triggers state machine discover action
   * The reactive statement watching selectedLocation will handle zoom and panel
   */
  function handleDiscoverButtonClick() {
    if (!map || allLocations.length === 0) return;

    // Trigger discover state via state machine
    import('./stores/appState').then(({ actions }) => {
      actions.discover();
    });
  }

  onMount(async () => {
    // Import Leaflet only in the browser
    L = (await import('leaflet')).default;

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

    // Add map tiles
    if (apiKey) {
      L.tileLayer(
        `https://api.maptiler.com/maps/dataviz/{z}/{x}/{y}.png?key=${apiKey}`,
        {
          attribution: '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          tileSize: 512,
          zoomOffset: -1
        }
      ).addTo(map);
    } else {
      console.warn('MapTiler API key not found. Using OpenStreetMap tiles.');
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
        map.fitBounds(bounds, { padding: [50, 50], animate: true });
      }
    };
    window.addEventListener('resetview', handleResetViewTrigger);

    // Emit initial bounds after map is fully initialized
    setTimeout(notifyBoundsChanged, 100);

    // Cleanup on component unmount
    return () => {
      if (map) {
        map.off('moveend', notifyBoundsChanged);
        map.off('zoomend', notifyBoundsChanged);
        map.remove();
      }
      window.removeEventListener('locationhover', previewLocationOnMap);
      window.removeEventListener('resetview', handleResetViewTrigger);
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
</div>
