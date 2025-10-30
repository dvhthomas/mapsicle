import { writable, derived, get } from 'svelte/store';
import { goto } from '$app/navigation';
import Fuse from 'fuse.js';

// Core state
export const allLocations = writable([]);
export const searchQuery = writable('');
export const selectedTags = writable(new Set());
export const selectedLocation = writable(null);
export const mapBounds = writable(null);
export const discoverMode = writable(false);

// Derived state - filtered locations based on search and tags
export const filteredLocations = derived(
  [allLocations, searchQuery, selectedTags],
  ([$allLocations, $searchQuery, $selectedTags]) => {
    let results = $allLocations;

    // Apply text search if active
    if ($searchQuery.trim()) {
      const fuse = new Fuse($allLocations, {
        keys: [
          { name: 'name', weight: 2 },
          { name: 'place', weight: 1.5 },
          { name: 'tags', weight: 1 },
          { name: 'description', weight: 0.5 }
        ],
        threshold: 0.3
      });
      results = fuse.search($searchQuery).map(result => result.item);
    }

    // Apply tag filters (AND logic - must have ALL selected tags)
    if ($selectedTags.size > 0) {
      results = results.filter(location =>
        location.tags && Array.from($selectedTags).every(tag => location.tags.includes(tag))
      );
    }

    return results;
  }
);

// Derived state - visible locations (filtered by map bounds or all if searching/filtering)
export const visibleLocations = derived(
  [filteredLocations, searchQuery, selectedTags, mapBounds, discoverMode],
  ([$filteredLocations, $searchQuery, $selectedTags, $mapBounds, $discoverMode]) => {
    // If searching or filtering, show all matching results
    if ($searchQuery.trim() || $selectedTags.size > 0) {
      return $filteredLocations;
    }

    // If in discover mode, show all locations sorted by most recent
    if ($discoverMode) {
      return [...$filteredLocations].sort((a, b) => (b.updated || 0) - (a.updated || 0));
    }

    // Otherwise filter by map bounds
    if (!$mapBounds) return $filteredLocations;

    const filtered = $filteredLocations.filter(location => {
      if (!location.coords) return false;
      const { lat, lon } = location.coords;
      return (
        lat >= $mapBounds.south &&
        lat <= $mapBounds.north &&
        lon >= $mapBounds.west &&
        lon <= $mapBounds.east
      );
    });

    // Sort by most recent update
    return [...filtered].sort((a, b) => (b.updated || 0) - (a.updated || 0));
  }
);

// Derived state - gallery locations (most recent 6)
export const galleryLocations = derived(
  [allLocations],
  ([$allLocations]) => {
    return $allLocations
      .filter(loc => loc.hero)
      .sort((a, b) => (b.updated || 0) - (a.updated || 0))
      .slice(0, 6);
  }
);

// Derived state - all unique tags
export const allTags = derived(
  [allLocations],
  ([$allLocations]) => {
    const tagsSet = new Set();
    $allLocations.forEach(loc => {
      if (loc.tags) {
        loc.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }
);

// State machine actions
export const actions = {
  /**
   * RESET - Return to home state
   * Clears all filters, selections, and URL params
   */
  reset() {
    searchQuery.set('');
    selectedTags.set(new Set());
    selectedLocation.set(null);
    discoverMode.set(false);

    // Clear URL
    const url = new URL(window.location.href);
    url.search = '';
    window.history.pushState({}, '', url);

    // Trigger map reset
    window.dispatchEvent(new CustomEvent('resetview'));
  },

  /**
   * SEARCH - Enter search state
   * @param {string} query - Search text
   */
  search(query) {
    searchQuery.set(query);
    selectedTags.set(new Set()); // Clear tag filters when searching
    discoverMode.set(false);

    // Update URL
    const url = new URL(window.location.href);
    if (query) {
      url.searchParams.set('q', query);
    } else {
      url.searchParams.delete('q');
    }
    goto(url, { replaceState: true, noScroll: true, keepFocus: true });
  },

  /**
   * FILTER BY TAGS - Enter filtering state
   * @param {Set<string>} tags - Selected tags
   */
  filterByTags(tags) {
    selectedTags.set(tags);
    discoverMode.set(false);
    if (tags.size > 0) {
      searchQuery.set(''); // Clear search when filtering by tags
    }
  },

  /**
   * SELECT LOCATION - Enter viewing state
   * @param {Object} location - Location to view
   */
  selectLocation(location) {
    selectedLocation.set(location);
    discoverMode.set(false);
  },

  /**
   * DISCOVER - Enter discover state
   * Shows most recently updated location
   */
  discover() {
    const locations = get(allLocations);
    if (locations.length === 0) return;

    const latest = locations.reduce((prev, current) =>
      (current.updated || 0) > (prev.updated || 0) ? current : prev
    );

    selectedLocation.set(latest);
    searchQuery.set('');
    selectedTags.set(new Set());
    discoverMode.set(true);

    // Update URL
    const url = new URL(window.location.href);
    url.search = '?discover';
    window.history.pushState({}, '', url);
  },

  /**
   * HOVER - Temporary preview state
   * @param {Object} location - Location to preview
   */
  hoverLocation(location) {
    window.dispatchEvent(new CustomEvent('locationhover', { detail: location }));
  },

  /**
   * UPDATE MAP BOUNDS
   * @param {Object} bounds - New map bounds
   */
  updateMapBounds(bounds) {
    mapBounds.set(bounds);
  },

  /**
   * INITIALIZE from URL
   * @param {URLSearchParams} params - URL search params
   */
  initializeFromURL(params) {
    const query = params.get('q');
    if (query) {
      searchQuery.set(query);
    }

    if (params.has('discover')) {
      // Delay to ensure map is ready
      setTimeout(() => this.discover(), 500);
    }
  }
};
