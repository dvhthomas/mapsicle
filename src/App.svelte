<script>
  import { onMount } from 'svelte';
  import L from 'leaflet';
  import { marked } from 'marked';
  import yaml from 'js-yaml';

  let map;
  let locations = [];
  let filteredLocations = [];
  let allTags = [];
  let selectedTags = new Set();
  let selectedLocation = null;
  let markers = [];
  let isLoading = true;
  let error = null;

  // Geocoding cache to avoid repeated API calls
  const geocodeCache = new Map();

  // Geocode a place name using Nominatim (OpenStreetMap)
  async function geocodePlace(place) {
    if (geocodeCache.has(place)) {
      return geocodeCache.get(place);
    }

    try {
      // Add a small delay to respect API rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1`,
        {
          headers: {
            'User-Agent': 'Interactive Travel Map'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const coords = {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon)
        };
        geocodeCache.set(place, coords);
        return coords;
      }

      throw new Error(`Could not geocode: ${place}`);
    } catch (err) {
      console.error(`Error geocoding ${place}:`, err);
      return null;
    }
  }

  // Load and parse YAML file
  async function loadLocations() {
    try {
      const response = await fetch('/locations.yaml');
      if (!response.ok) {
        throw new Error('Failed to load locations.yaml');
      }

      const text = await response.text();
      const data = yaml.load(text);

      if (!data || !data.locations) {
        throw new Error('Invalid YAML structure: missing locations array');
      }

      // Extract all unique tags
      const tagsSet = new Set();
      data.locations.forEach(loc => {
        if (loc.tags) {
          loc.tags.forEach(tag => tagsSet.add(tag));
        }
      });
      allTags = Array.from(tagsSet).sort();

      // Geocode all locations (skip if coords already exist)
      const locationsWithCoords = [];
      for (const location of data.locations) {
        let coords = location.coords; // Check if coords already exist in YAML

        // Only geocode if coords don't exist
        if (!coords || !coords.lat || !coords.lon) {
          coords = await geocodePlace(location.place);
        }

        if (coords) {
          locationsWithCoords.push({
            ...location,
            coords
          });
        }
      }

      locations = locationsWithCoords;
      filteredLocations = locations;
      isLoading = false;

      // Add markers to map
      updateMarkers();

      // Fit map to show all markers
      if (markers.length > 0) {
        const bounds = L.latLngBounds(markers.map(m => m.getLatLng()));
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (err) {
      console.error('Error loading locations:', err);
      error = err.message;
      isLoading = false;
    }
  }

  // Create popup content from location data
  function createPopupContent(location) {
    const html = marked.parse(location.description || '');
    const tagsHtml = location.tags
      ? location.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
      : '';

    return `
      <div class="popup-content">
        <h3>${location.name}</h3>
        <div class="place">${location.place}</div>
        <div class="description">${html}</div>
        ${tagsHtml ? `<div class="tags">${tagsHtml}</div>` : ''}
      </div>
    `;
  }

  // Update markers on the map
  function updateMarkers() {
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];

    // Add new markers
    filteredLocations.forEach(location => {
      const marker = L.marker([location.coords.lat, location.coords.lon])
        .addTo(map)
        .bindPopup(createPopupContent(location), {
          maxWidth: 300,
          minWidth: 250
        });

      marker.on('click', () => {
        selectedLocation = location;
      });

      markers.push(marker);
    });
  }

  // Toggle tag filter
  function toggleTag(tag) {
    if (selectedTags.has(tag)) {
      selectedTags.delete(tag);
    } else {
      selectedTags.add(tag);
    }
    selectedTags = selectedTags; // Trigger reactivity
    filterLocations();
  }

  // Filter locations based on selected tags
  function filterLocations() {
    if (selectedTags.size === 0) {
      filteredLocations = locations;
    } else {
      filteredLocations = locations.filter(location =>
        location.tags && location.tags.some(tag => selectedTags.has(tag))
      );
    }
    updateMarkers();

    // Fit map to filtered markers
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => m.getLatLng()));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  // Select a location from the sidebar
  function selectLocation(location) {
    selectedLocation = location;
    const marker = markers.find(m =>
      m.getLatLng().lat === location.coords.lat &&
      m.getLatLng().lng === location.coords.lon
    );
    if (marker) {
      map.setView([location.coords.lat, location.coords.lon], 12);
      marker.openPopup();
    }
  }

  onMount(() => {
    // Initialize the map
    map = L.map('map').setView([40, -100], 4);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    // Load locations
    loadLocations();

    return () => {
      if (map) {
        map.remove();
      }
    };
  });
</script>

<main>
  <div class="sidebar">
    <div class="sidebar-header">
      <h1>Travel Map</h1>
      <p>Explore places by tags</p>
    </div>

    {#if !isLoading && allTags.length > 0}
      <div class="filter-section">
        <h3>Filter by Tags</h3>
        <div class="tag-filters">
          {#each allTags as tag}
            <button
              class="tag-filter"
              class:active={selectedTags.has(tag)}
              on:click={() => toggleTag(tag)}
            >
              {tag}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <div class="locations-list">
      {#if isLoading}
        <p>Loading locations...</p>
      {:else if error}
        <p style="color: red;">Error: {error}</p>
      {:else if filteredLocations.length === 0}
        <p>No locations match the selected filters.</p>
      {:else}
        {#each filteredLocations as location}
          <div
            class="location-item"
            class:selected={selectedLocation === location}
            on:click={() => selectLocation(location)}
            on:keydown={(e) => e.key === 'Enter' && selectLocation(location)}
            role="button"
            tabindex="0"
          >
            <h4>{location.name}</h4>
            <div class="location-place">{location.place}</div>
            {#if location.tags && location.tags.length > 0}
              <div class="tags">
                {#each location.tags as tag}
                  <span class="tag">{tag}</span>
                {/each}
              </div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </div>

  <div class="map-container">
    <div id="map" style="width: 100%; height: 100%;"></div>
  </div>
</main>
