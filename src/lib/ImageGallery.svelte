<script>
  /**
   * ImageGallery Component
   *
   * Collapsible gallery showcasing the 6 most recently updated locations
   * that have hero images. Provides visual "Discover" functionality.
   *
   * Features:
   * - Displays thumbnails of latest locations with images
   * - Click to select location (opens detail panel and zooms to location)
   * - Keyboard accessible with Enter/Space selection
   * - Collapsible to save sidebar space
   * - Visual indicator for currently selected location
   * - Expanded by default on app start
   *
   * @prop {Array} locations - All locations (will be filtered internally)
   * @prop {Object|null} selectedLocation - Currently selected location
   *
   * @fires select - When a gallery image is clicked
   */

  import { createEventDispatcher } from 'svelte';

  export let locations = [];
  export let selectedLocation = null;

  const dispatch = createEventDispatcher();
  let isExpanded = true;

  /**
   * Derived gallery locations
   * Only shows locations with hero images, sorted by update time
   * Limited to 6 most recent for performance and visual clarity
   */
  $: recentLocationsWithImages = locations
    .filter(loc => loc.hero)
    .sort((a, b) => (b.updated || 0) - (a.updated || 0))
    .slice(0, 6);

  /**
   * Handle gallery image click - selects location and opens detail panel
   * @param {Object} location - Location to select
   */
  function handleImageClick(location) {
    dispatch('select', location);
  }

  /**
   * Handle keyboard navigation for gallery images
   * @param {KeyboardEvent} event - Keyboard event
   * @param {Object} location - Location associated with the image
   */
  function handleKeydown(event, location) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleImageClick(location);
    }
  }

  /**
   * Toggle collapse/expand state of gallery section
   */
  function toggleExpanded() {
    isExpanded = !isExpanded;
  }
</script>

{#if recentLocationsWithImages.length > 0}
  <div class="image-gallery">
    <button class="gallery-header" on:click={toggleExpanded}>
      <h3>Discover</h3>
      <span class="expand-icon" class:expanded={isExpanded}>▼</span>
    </button>
    {#if isExpanded}
      <div class="gallery-grid">
        {#each recentLocationsWithImages as location (location.slug)}
          <div
            class="gallery-item"
            class:selected={selectedLocation === location}
            on:click={() => handleImageClick(location)}
            on:keydown={(e) => handleKeydown(e, location)}
            role="button"
            tabindex="0"
            title={location.name}
          >
            <img src={location.hero} alt={location.name} loading="lazy" />
            <div class="gallery-item-footer">
              <span class="gallery-item-name">{location.name}</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{/if}
