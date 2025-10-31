/**
 * Application State Machine
 *
 * STATE MODES:
 * 1. HOME - Default browsing (no filters, shows locations in current map viewport)
 * 2. SEARCH - Text search active (shows all matching results regardless of viewport)
 * 3. FILTER - Tag filtering active (shows all matching results regardless of viewport)
 * 4. DISCOVER - Browse recently updated (shows all locations sorted by update date)
 * 5. VIEWING - Location detail panel open (preserves search/filter context)
 *
 * STATE TRANSITIONS:
 * - HOME → SEARCH: User types in search bar
 * - HOME → FILTER: User selects tag(s)
 * - HOME → DISCOVER: User clicks Discover button
 * - SEARCH/FILTER → VIEWING: User selects location (search/filter preserved!)
 * - ANY → HOME: User clicks reset (X button or View All)
 *
 * URL STATE SYNCHRONIZATION:
 * - /?s=query           - Search mode
 * - /?loc=slug          - Viewing mode (no search)
 * - /?s=query&loc=slug  - Viewing mode (search preserved)
 * - /?discover          - Discover mode
 * - /                   - Home mode
 *
 * FILTER PRESERVATION RULES:
 * - selectLocation() → PRESERVES search/tags (prevents list reordering under mouse)
 * - selectLocation() from Discover list → Calls clearFilters() first (changes context)
 * - search() → CLEARS tags (text search replaces tag filter)
 * - filterByTags() → CLEARS search (tag filter replaces text search)
 * - clearFilters() → CLEARS search/tags only (preserves location/discover mode)
 * - reset() → CLEARS everything (explicit user action)
 * - discover() → CLEARS everything (explicit mode switch)
 */

import { writable, derived, get } from 'svelte/store';
import { goto } from '$app/navigation';
import Fuse from 'fuse.js';

// ============================================
// CORE STATE STORES
// ============================================

export const allLocations = writable([]);
export const searchQuery = writable('');
export const selectedTags = writable(new Set());
export const selectedLocation = writable(null);
export const mapBounds = writable(null);
export const discoverMode = writable(false);
export const isPreviewingLocation = writable(false); // Temporary state during hover

// ============================================
// DERIVED STATE (AUTO-COMPUTED)
// ============================================

/**
 * filteredLocations - Locations matching search and/or tag filters
 * Applied BEFORE viewport filtering
 * Uses Fuse.js for fuzzy text search
 */
export const filteredLocations = derived(
  [allLocations, searchQuery, selectedTags],
  ([$allLocations, $searchQuery, $selectedTags]) => {
    let results = $allLocations;

    // Apply text search if active (fuzzy search across multiple fields)
    if ($searchQuery.trim()) {
      const fuse = new Fuse($allLocations, {
        keys: [
          { name: 'name', weight: 2 },        // Highest priority
          { name: 'place', weight: 1.5 },
          { name: 'tags', weight: 1 },
          { name: 'description', weight: 0.5 } // Lowest priority
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

/**
 * visibleLocations - Final location list shown in sidebar
 *
 * FILTERING LOGIC:
 * 1. If SEARCH or FILTER active → Show ALL matching results (ignore map bounds)
 * 2. If DISCOVER active → Show ALL locations sorted by most recent
 * 3. Otherwise (HOME mode) → Show only locations in current map viewport
 *
 * This ensures that when user searches for "oxford", they see ALL Oxford results,
 * not just those currently visible on the map. Critical for preventing list
 * reordering when selecting a location that causes map to zoom/pan.
 */
export const visibleLocations = derived(
  [filteredLocations, searchQuery, selectedTags, mapBounds, discoverMode],
  ([$filteredLocations, $searchQuery, $selectedTags, $mapBounds, $discoverMode]) => {
    // SEARCH/FILTER MODE: Show all matching results (ignore viewport)
    if ($searchQuery.trim() || $selectedTags.size > 0) {
      return $filteredLocations;
    }

    // DISCOVER MODE: Show all locations sorted by most recent update
    if ($discoverMode) {
      return [...$filteredLocations].sort((a, b) => (b.updated || 0) - (a.updated || 0));
    }

    // HOME MODE: Filter by map viewport bounds
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

/**
 * galleryLocations - Recent updates for Discover modal
 * Always shows 6 most recently updated locations with hero images
 */
export const galleryLocations = derived(
  [allLocations],
  ([$allLocations]) => {
    return $allLocations
      .filter(loc => loc.hero)
      .sort((a, b) => (b.updated || 0) - (a.updated || 0))
      .slice(0, 6);
  }
);

/**
 * allTags - Unique tags from all locations
 * Used to populate tag filter UI
 */
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

/**
 * locationListTitle - Sidebar section header text
 * Changes based on current mode:
 * - "DISCOVER" → Discover mode active
 * - "RESULTS" → Search or filter active
 * - "CURRENT MAP" → Default browsing (viewport-based)
 */
export const locationListTitle = derived(
  [discoverMode, searchQuery, selectedTags],
  ([$discoverMode, $searchQuery, $selectedTags]) => {
    if ($discoverMode) {
      return 'DISCOVER';
    }
    if ($searchQuery.trim() || $selectedTags.size > 0) {
      return 'RESULTS';
    }
    return 'CURRENT MAP';
  }
);

// ============================================
// STATE MACHINE ACTIONS
// ============================================
export const actions = {
  /**
   * ACTION: reset()
   * TRANSITION: ANY → HOME
   * TRIGGER: User clicks X button or "View All" button
   *
   * STATE CHANGES:
   * - Clears search query
   * - Clears tag filters
   * - Clears selected location
   * - Exits discover mode
   *
   * URL: / (all params cleared)
   * SIDE EFFECTS: Triggers map to zoom to show all locations
   */
  reset() {
    searchQuery.set('');
    selectedTags.set(new Set());
    selectedLocation.set(null);
    discoverMode.set(false);

    // Clear URL completely
    const url = new URL(window.location.href);
    url.searchParams.delete('s');
    url.searchParams.delete('loc');
    url.searchParams.delete('discover');
    url.searchParams.delete('tags');
    window.history.pushState({}, '', url);

    // Trigger map to fit all locations
    window.dispatchEvent(new CustomEvent('resetview'));
  },

  /**
   * ACTION: clearFilters()
   * TRANSITION: Clears search/tag filters without changing other state
   * TRIGGER: Used when switching contexts (e.g., from search to discover browsing)
   *
   * STATE CHANGES:
   * - Clears search query
   * - Clears tag filters
   * - PRESERVES selected location
   * - PRESERVES discover mode
   *
   * URL: Updates to remove 's' parameter
   *
   * USE CASE: When user selects location from Discover modal, we want to clear
   * the search context (since they're no longer searching) but keep the location
   * selection and let selectLocation() handle the URL update.
   */
  clearFilters() {
    searchQuery.set('');
    selectedTags.set(new Set());

    // Update URL to remove search parameter
    const url = new URL(window.location.href);
    url.searchParams.delete('s');
    goto(url, { replaceState: true, noScroll: true, keepFocus: true });
  },

  /**
   * ACTION: search(query)
   * TRANSITION: ANY → SEARCH (or HOME if query is empty)
   * TRIGGER: User types in search bar
   *
   * STATE CHANGES:
   * - Sets search query
   * - CLEARS tag filters (search replaces tag filter)
   * - CLEARS selected location
   * - Exits discover mode
   *
   * URL: /?s=query (or / if query empty)
   * LIST BEHAVIOR: Shows ALL matching results regardless of map viewport
   */
  search(query) {
    searchQuery.set(query);
    selectedTags.set(new Set()); // Clear tag filters (search replaces them)
    discoverMode.set(false);

    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.delete('discover');
    url.searchParams.delete('loc');
    if (query) {
      url.searchParams.set('s', query);
    } else {
      url.searchParams.delete('s');
    }
    goto(url, { replaceState: true, noScroll: true, keepFocus: true });
  },

  /**
   * ACTION: filterByTags(tags)
   * TRANSITION: ANY → FILTER (or HOME if no tags)
   * TRIGGER: User selects/deselects tags
   *
   * STATE CHANGES:
   * - Sets selected tags
   * - CLEARS search query (tag filter replaces search)
   * - CLEARS selected location
   * - Exits discover mode
   *
   * URL: /?tags=tag1,tag2 (or / if no tags)
   * LIST BEHAVIOR: Shows ALL matching results regardless of map viewport
   */
  filterByTags(tags) {
    selectedTags.set(tags);
    discoverMode.set(false);
    if (tags.size > 0) {
      searchQuery.set(''); // Clear search (tag filter replaces it)
    }

    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.delete('discover');
    url.searchParams.delete('s');
    url.searchParams.delete('loc');

    // Add tags to URL as comma-separated list
    if (tags.size > 0) {
      url.searchParams.set('tags', Array.from(tags).sort().join(','));
    } else {
      url.searchParams.delete('tags');
    }

    goto(url, { replaceState: true, noScroll: true, keepFocus: true });
  },

  /**
   * ACTION: selectLocation(location)
   * TRANSITION: SEARCH/FILTER/HOME → VIEWING
   * TRIGGER: User clicks location card or map marker
   *
   * STATE CHANGES:
   * - Sets selected location (opens detail panel)
   * - PRESERVES search query (prevents list reordering!)
   * - PRESERVES tag filters (prevents list reordering!)
   * - Exits discover mode
   *
   * URL: /?loc=slug (or /?s=query&loc=slug if searching)
   * LIST BEHAVIOR: Maintains current list - prevents card shifting under mouse
   *
   * CRITICAL: We preserve search/filter context here to prevent the list
   * from reordering when map zooms to location. Without this, clicking a
   * card would cause bounds change → different cards under mouse cursor.
   */
  selectLocation(location) {
    selectedLocation.set(location);
    discoverMode.set(false);
    // IMPORTANT: Keep searchQuery and selectedTags unchanged!

    // Update URL with location slug for deep linking
    const url = new URL(window.location.href);
    url.searchParams.delete('discover');
    if (location?.slug) {
      url.searchParams.set('loc', location.slug);
    }
    goto(url, { replaceState: true, noScroll: true, keepFocus: true });
  },

  /**
   * ACTION: discover()
   * TRANSITION: ANY → DISCOVER
   * TRIGGER: User clicks "Discover" button
   *
   * STATE CHANGES:
   * - Selects most recently updated location
   * - CLEARS search query
   * - CLEARS tag filters
   * - Enters discover mode
   *
   * URL: /?discover
   * LIST BEHAVIOR: Shows ALL locations sorted by update date
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
   * ACTION: hoverLocation(location)
   * TRANSITION: Temporary preview (no state change)
   * TRIGGER: Mouse enters location card
   *
   * STATE CHANGES: None (temporary visual preview only)
   * SIDE EFFECTS:
   * - Pans map to location without changing zoom
   * - Opens location popup on map
   * - Sets isPreviewingLocation flag (prevents bounds update from filtering list)
   *
   * This is NOT a state transition - it's a temporary preview that
   * doesn't affect filters or URL. Auto-clears after 150ms.
   *
   * NOTE: Disabled when a location is selected (handled in +page.svelte).
   * This prevents the map from panning away from the selected location when
   * user scrolls through cards to reach map controls.
   */
  hoverLocation(location) {
    isPreviewingLocation.set(true);
    window.dispatchEvent(new CustomEvent('locationhover', { detail: location }));

    // Auto-clear preview flag after brief delay
    setTimeout(() => {
      isPreviewingLocation.set(false);
    }, 150);
  },

  /**
   * ACTION: clearPreview()
   * Internal - exits hover preview state
   */
  clearPreview() {
    isPreviewingLocation.set(false);
  },

  /**
   * ACTION: updateMapBounds(bounds)
   * TRANSITION: None (updates viewport-based filtering)
   * TRIGGER: User pans/zooms map
   *
   * STATE CHANGES:
   * - Updates map bounds (used for HOME mode filtering)
   * - Clears preview state
   *
   * LIST BEHAVIOR: Only affects list when in HOME mode (no search/filter active)
   */
  updateMapBounds(bounds) {
    isPreviewingLocation.set(false);
    mapBounds.set(bounds);
  },

  /**
   * ACTION: initializeFromURL(params)
   * TRANSITION: Restores state from URL on page load
   * TRIGGER: App startup
   *
   * Handles deep linking by parsing URL parameters:
   * - /?s=query → Restores search
   * - /?tags=tag1,tag2 → Restores tag filters
   * - /?loc=slug → Selects and zooms to location
   * - /?s=query&loc=slug → Restores search AND selects location
   * - /?discover → Enters discover mode
   */
  initializeFromURL(params) {
    const query = params.get('s');
    if (query) {
      searchQuery.set(query);
    }

    // Check for tag filters
    const tagsParam = params.get('tags');
    if (tagsParam) {
      const tags = new Set(tagsParam.split(',').filter(t => t.trim()));
      if (tags.size > 0) {
        selectedTags.set(tags);
      }
    }

    // Check for location deep link
    const locationSlug = params.get('loc');
    if (locationSlug) {
      const locations = get(allLocations);
      const location = locations.find(loc => loc.slug === locationSlug);
      if (location) {
        // Delay to ensure map is ready
        setTimeout(() => this.selectLocation(location), 500);
        return;
      }
    }

    if (params.has('discover')) {
      // Delay to ensure map is ready
      setTimeout(() => this.discover(), 500);
    }
  }
};
