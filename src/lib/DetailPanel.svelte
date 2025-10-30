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
  import { createEventDispatcher, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import ImageViewer from './ImageViewer.svelte';

  export let location = null;

  const dispatch = createEventDispatcher();

  let isImageViewerOpen = false;
  let currentImageIndex = 0;
  let currentDetailImageIndex = 0;
  let isMobile = false;

  // Detect mobile/tablet size - desktop uses normal carousel
  onMount(() => {
    const checkMobile = () => {
      isMobile = window.innerWidth <= 1024;
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });

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

    // Clear location from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('loc');
    goto(url, { replaceState: true, noScroll: true, keepFocus: true });
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
      {#if isMobile}
        <!-- Mobile: Button to open photo gallery modal -->
        <button class="view-photos-button" on:click={openImageViewer}>
          📷 View Photos {#if allLocationImages.length > 1}({allLocationImages.length}){/if}
        </button>
      {:else}
        <!-- Desktop: Inline carousel with navigation -->
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
  .detail-panel {
    width: 360px;
    min-width: 360px;
    max-width: 360px;
    height: 100%;
    flex-shrink: 0;
    background: var(--color-complement);
    border-left: var(--border-width-thick) solid var(--color-border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: none;
  }

  .detail-header {
    padding: var(--spacing-lg);
    border-bottom: var(--border-width-thick) solid var(--color-border);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    background: var(--color-complement);
    flex-shrink: 0;
  }

  .detail-header h2 {
    margin: 0;
    font-size: 1.75rem;
    color: var(--color-text-primary);
    line-height: 1.2;
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    letter-spacing: -0.02em;
  }

  .detail-place {
    margin: 0.5rem 0 0 0;
    font-size: 0.875rem;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-normal);
  }

  .close-button {
    background: var(--color-accent);
    border: var(--border-width) solid var(--color-border);
    font-size: 1.5rem;
    line-height: 1;
    color: var(--color-text-primary);
    cursor: pointer;
    padding: 0;
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    transition: none;
    flex-shrink: 0;
    font-weight: var(--font-weight-bold);
    box-shadow: var(--shadow-sm);
  }

  .close-button:hover {
    background: var(--color-primary);
    transform: translate(-1px, -1px);
    box-shadow: var(--shadow-md);
  }

  .detail-hero {
    width: 100%;
    height: 240px;
    flex-shrink: 0;
    overflow: hidden;
    background: var(--color-surface);
    border-bottom: var(--border-width-thick) solid var(--color-border);
    position: relative;
    cursor: pointer;
  }

  .detail-hero img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    border: none;
    transition: transform 0.3s ease;
  }

  .detail-hero:hover img {
    transform: scale(1.05);
  }

  .hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .detail-hero:hover .hero-overlay {
    opacity: 1;
  }

  .hero-zoom-icon {
    font-size: 3rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }

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

  .detail-content {
    padding: var(--spacing-md) var(--spacing-lg);
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    line-height: 1.6;
  }

  /* Styles for markdown-generated content */
  .detail-content :global(h1) {
    font-size: 1.5rem;
    font-weight: var(--font-weight-bold);
    margin: 0 0 var(--spacing-md) 0;
    color: var(--color-text-primary);
    text-transform: uppercase;
  }

  .detail-content :global(h1:not(:first-child)) {
    margin-top: var(--spacing-lg);
  }

  .detail-content :global(h2) {
    font-size: 1.25rem;
    font-weight: var(--font-weight-bold);
    margin: var(--spacing-md) 0 var(--spacing-sm) 0;
    color: var(--color-text-primary);
    text-transform: uppercase;
  }

  .detail-content :global(h3) {
    font-size: 1.125rem;
    font-weight: var(--font-weight-bold);
    margin: var(--spacing-md) 0 var(--spacing-sm) 0;
    color: var(--color-text-primary);
    text-transform: uppercase;
  }

  .detail-content :global(p) {
    margin: var(--spacing-sm) 0;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-normal);
  }

  .detail-content :global(ul),
  .detail-content :global(ol) {
    margin: var(--spacing-sm) 0;
    padding-left: var(--spacing-lg);
  }

  .detail-content :global(li) {
    margin: var(--spacing-xs) 0;
    font-weight: var(--font-weight-normal);
  }

  .detail-content :global(strong) {
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
  }

  .detail-content :global(em) {
    color: var(--color-text-primary);
    font-style: normal;
    font-weight: var(--font-weight-bold);
  }

  .detail-content :global(img) {
    max-width: 100%;
    height: auto;
    margin: var(--spacing-md) 0;
    border-radius: var(--radius-md);
    border: var(--border-width) solid var(--color-border);
    box-shadow: var(--shadow-md);
  }

  .detail-tags {
    padding: var(--spacing-sm) var(--spacing-md);
    border-top: var(--border-width-thick) solid var(--color-border);
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
    background: var(--color-complement);
    flex-shrink: 0;
  }

  .detail-tags .tag {
    padding: 0.25rem 0.5rem;
    background: var(--color-surface);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: 0.65rem;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-normal);
    text-transform: uppercase;
    box-shadow: var(--shadow-sm);
  }

  .view-photos-button {
    width: 100%;
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-sm);
    background: var(--color-accent);
    color: var(--color-text-primary);
    border: 2px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 1rem;
    font-weight: var(--font-weight-bold);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
    flex-shrink: 0;
  }

  .view-photos-button:hover {
    background: var(--color-primary);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .view-photos-button:active {
    transform: translateY(0);
  }

  /* Mobile/Tablet responsive */
  @media (max-width: 1024px) {
    .detail-panel {
      width: 100%;
      max-width: 100%;
      min-width: 100%;
      height: 50vh;
      max-height: 50vh;
      border-left: none;
      border-top: 2px solid var(--color-border);
      border-radius: 0;
      position: relative;
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr) auto;
    }

    .detail-header {
      padding: var(--spacing-xs) var(--spacing-sm);
      grid-row: 1;
    }

    .detail-header h2 {
      font-size: 1rem;
      margin-bottom: 0;
    }

    .detail-place {
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .close-button {
      width: 2rem;
      height: 2rem;
      font-size: 1.25rem;
    }

    .detail-hero {
      height: 120px;
      border-radius: 0;
      grid-row: 2;
    }

    .detail-hero-nav {
      display: none !important;
    }

    .hero-overlay {
      display: none;
    }

    .view-photos-button {
      border-radius: 0;
      margin-bottom: 0;
      padding: var(--spacing-sm) var(--spacing-md);
      font-size: 0.875rem;
      grid-row: 2;
    }

    .detail-content {
      padding: var(--spacing-xs) var(--spacing-sm);
      grid-row: 3;
      overflow-y: auto;
      min-height: 0;
    }

    .detail-tags {
      grid-row: 4;
      padding: var(--spacing-xs) var(--spacing-sm);
    }

    .detail-tags .tag {
      font-size: 0.6rem;
      padding: 0.2rem 0.4rem;
    }
  }
</style>
