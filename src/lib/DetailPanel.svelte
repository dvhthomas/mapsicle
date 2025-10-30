<script>
  /**
   * DetailPanel Component
   *
   * Right-side panel displaying full details for a selected location.
   * Shows when a location is selected via map, card, or gallery.
   *
   * Features:
   * - Displays hero image with zoom capability
   * - Renders markdown description content
   * - Shows location tags (clickable to search)
   * - Close button to deselect location
   * - Integrates with ImageViewer for full-screen image viewing
   * - Uses two-way binding so closing can update parent state
   *
   * @prop {Object|null} location - Location to display (null hides panel)
   *
   * @fires tagclick - When a tag is clicked (triggers search)
   */

  import { marked } from 'marked';
  import { createEventDispatcher } from 'svelte';
  import ImageViewer from './ImageViewer.svelte';

  export let location = null;

  const dispatch = createEventDispatcher();

  let isImageViewerOpen = false;
  let currentImageIndex = 0;
  let currentDetailImageIndex = 0;

  /**
   * Reactive: Get all images for this location
   * Images array already includes hero as first item
   */
  $: allLocationImages = location?.images || [];

  /**
   * Reactive: Reset image index when location changes
   */
  $: if (location) {
    currentDetailImageIndex = 0;
  }

  /**
   * Reactive: Get currently displayed image in detail panel
   */
  $: currentDetailImage = allLocationImages[currentDetailImageIndex] || allLocationImages[0];

  /**
   * Close detail panel by clearing location
   * Uses two-way binding to notify parent
   */
  function handleClosePanel() {
    location = null;
  }

  /**
   * Handle tag click - triggers search for that tag
   * @param {string} tag - Tag that was clicked
   */
  function handleTagClick(tag) {
    dispatch('tagclick', tag);
  }

  /**
   * Navigate to previous image in detail panel
   * @param {Event} event - Click event (to stop propagation)
   */
  function showPreviousDetailImage(event) {
    event.stopPropagation();
    if (currentDetailImageIndex > 0) {
      currentDetailImageIndex--;
    }
  }

  /**
   * Navigate to next image in detail panel
   * @param {Event} event - Click event (to stop propagation)
   */
  function showNextDetailImage(event) {
    event.stopPropagation();
    if (currentDetailImageIndex < allLocationImages.length - 1) {
      currentDetailImageIndex++;
    }
  }

  /**
   * Open full-screen image viewer at current detail panel image
   */
  function openImageViewer() {
    currentImageIndex = currentDetailImageIndex;
    isImageViewerOpen = true;
  }

  /**
   * Close full-screen image viewer
   */
  function closeImageViewer() {
    isImageViewerOpen = false;
  }
</script>

{#if location}
  <div class="detail-panel">
    <div class="detail-header">
      <div>
        <h2>{location.name}</h2>
        <p class="detail-place">📍 {location.place}</p>
      </div>
      <button class="close-button" on:click={handleClosePanel} aria-label="Close">
        ×
      </button>
    </div>

    {#if currentDetailImage}
      <div class="detail-hero" role="button" tabindex="0" on:click={openImageViewer} on:keypress={(e) => e.key === 'Enter' && openImageViewer()}>
        <img src={currentDetailImage} alt={location.name} />
        <div class="hero-overlay">
          <span class="hero-zoom-icon">🔍</span>
        </div>

        <!-- Image navigation controls (only show if multiple images) -->
        {#if allLocationImages.length > 1}
          <div class="detail-hero-nav">
            <button
              class="hero-nav-btn hero-prev"
              on:click={showPreviousDetailImage}
              disabled={currentDetailImageIndex === 0}
              aria-label="Previous image"
            >
              ‹
            </button>

            <div class="hero-counter">
              {currentDetailImageIndex + 1} / {allLocationImages.length}
            </div>

            <button
              class="hero-nav-btn hero-next"
              on:click={showNextDetailImage}
              disabled={currentDetailImageIndex === allLocationImages.length - 1}
              aria-label="Next image"
            >
              ›
            </button>
          </div>
        {/if}
      </div>
    {/if}

    <div class="detail-content">
      {@html marked.parse(location.description || '')}
    </div>

    {#if location.tags && location.tags.length > 0}
      <div class="detail-tags">
        {#each location.tags as tag}
          <button
            class="tag tag-button"
            on:click={() => handleTagClick(tag)}
            title="Search for {tag}"
          >
            {tag}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <ImageViewer
    images={allLocationImages}
    bind:currentIndex={currentImageIndex}
    isOpen={isImageViewerOpen}
    on:close={closeImageViewer}
  />
{/if}

<style>
  .detail-hero-nav {
    position: absolute;
    bottom: var(--spacing-md);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    z-index: 10;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .detail-hero:hover .detail-hero-nav {
    opacity: 1;
  }

  .hero-nav-btn,
  .hero-counter {
    pointer-events: all;
  }

  .hero-nav-btn {
    width: 2.5rem;
    height: 2.5rem;
    background: var(--color-surface);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 1.5rem;
    font-weight: var(--font-weight-bold);
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-md);
    transition: all 0.2s ease;
    padding: 0;
  }

  .hero-nav-btn:hover:not(:disabled) {
    background: var(--color-primary);
    transform: translateY(-1px);
    box-shadow: var(--shadow-lg);
  }

  .hero-nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .hero-counter {
    padding: var(--spacing-xs) var(--spacing-md);
    background: var(--color-surface);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-full);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-bold);
    font-size: 0.75rem;
    box-shadow: var(--shadow-md);
    white-space: nowrap;
  }
</style>
