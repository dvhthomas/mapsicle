<script>
  /**
   * ImageViewer Component
   *
   * Full-screen modal image viewer with navigation controls.
   * Used by DetailPanel to display location images at full resolution.
   *
   * Features:
   * - Full-screen overlay with dark backdrop
   * - Previous/Next navigation buttons (when multiple images)
   * - Image counter display (e.g., "2 / 5")
   * - Keyboard navigation (Arrow keys, Escape to close)
   * - Click backdrop to close
   * - Disabled prev/next buttons at boundaries
   * - Maintains aspect ratio with responsive sizing
   *
   * @prop {Array<string>} images - Array of image paths to display
   * @prop {number} currentIndex - Currently displayed image index (two-way bound)
   * @prop {boolean} isOpen - Whether viewer is visible
   *
   * @fires close - When viewer should be closed
   */

  import { createEventDispatcher } from 'svelte';

  export let images = [];
  export let currentIndex = 0;
  export let isOpen = false;

  const dispatch = createEventDispatcher();

  /**
   * Close the image viewer
   */
  function closeViewer() {
    dispatch('close');
  }

  /**
   * Navigate to next image
   * Only works if not already at the last image
   */
  function showNextImage() {
    if (currentIndex < images.length - 1) {
      currentIndex++;
    }
  }

  /**
   * Navigate to previous image
   * Only works if not already at the first image
   */
  function showPreviousImage() {
    if (currentIndex > 0) {
      currentIndex--;
    }
  }

  /**
   * Handle global keyboard shortcuts
   * - Escape: Close viewer
   * - Arrow Right: Next image
   * - Arrow Left: Previous image
   * @param {KeyboardEvent} event - Keyboard event
   */
  function handleKeydown(event) {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      closeViewer();
    } else if (event.key === 'ArrowRight') {
      showNextImage();
    } else if (event.key === 'ArrowLeft') {
      showPreviousImage();
    }
  }

  /**
   * Close viewer when clicking the backdrop (but not the image itself)
   * @param {MouseEvent} event - Click event
   */
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      closeViewer();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div
    class="image-viewer-backdrop"
    on:click={handleBackdropClick}
    on:keydown={(e) => e.key === 'Escape' && closeViewer()}
    role="button"
    tabindex="0"
  >
    <div class="image-viewer-container">
      <button class="viewer-close" on:click={closeViewer} aria-label="Close viewer">
        ×
      </button>

      <div class="image-viewer-content">
        <img src={images[currentIndex]} alt="Full size" />
      </div>

      {#if images.length > 1}
        <div class="viewer-controls">
          <button
            class="viewer-nav viewer-prev"
            on:click={showPreviousImage}
            disabled={currentIndex === 0}
            aria-label="Previous image"
          >
            ‹
          </button>

          <div class="viewer-counter">
            {currentIndex + 1} / {images.length}
          </div>

          <button
            class="viewer-nav viewer-next"
            on:click={showNextImage}
            disabled={currentIndex === images.length - 1}
            aria-label="Next image"
          >
            ›
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .image-viewer-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.9);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .image-viewer-container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .image-viewer-content {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-height: calc(100vh - 8rem);
  }

  .image-viewer-content img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: var(--radius-md);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  }

  .viewer-close {
    position: absolute;
    top: 0;
    right: 0;
    width: 3rem;
    height: 3rem;
    background: var(--color-accent);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 2rem;
    font-weight: var(--font-weight-bold);
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }

  .viewer-close:hover {
    background: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  }

  .viewer-controls {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-top: 2rem;
  }

  .viewer-nav {
    width: 3rem;
    height: 3rem;
    background: var(--color-surface);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-text-primary);
    font-size: 2rem;
    font-weight: var(--font-weight-bold);
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }

  .viewer-nav:hover:not(:disabled) {
    background: var(--color-primary);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  }

  .viewer-nav:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .viewer-counter {
    padding: 0.5rem 1rem;
    background: var(--color-surface);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-full);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-bold);
    font-size: 0.875rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
</style>
