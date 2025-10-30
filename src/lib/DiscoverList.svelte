<script>
  /**
   * DiscoverList Component
   *
   * Modal overlay showing all recently updated locations.
   * Appears when user clicks DISCOVER button, providing access to all
   * recent discoveries rather than just jumping to the first one.
   *
   * Features:
   * - Modal overlay with scrollable list
   * - Click location to view details
   * - Close button to dismiss
   * - Keyboard accessible (ESC to close)
   *
   * @prop {Array} locations - Recent locations to display (galleryLocations)
   * @prop {boolean} isOpen - Controls visibility of modal
   *
   * @fires select - When a location is selected
   * @fires close - When modal is closed
   */

  import { createEventDispatcher } from 'svelte';

  export let locations = [];
  export let isOpen = false;

  const dispatch = createEventDispatcher();

  /**
   * Handle location selection
   */
  function handleSelect(location) {
    dispatch('select', location);
    dispatch('close');
  }

  /**
   * Handle close button or backdrop click
   */
  function handleClose() {
    dispatch('close');
  }

  /**
   * Handle backdrop click (only close if clicking backdrop itself)
   */
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  }

  /**
   * Handle keyboard events (ESC to close)
   */
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      handleClose();
    }
  }
</script>

{#if isOpen}
  <div
    class="discover-backdrop"
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="button"
    tabindex="-1"
  >
    <div
      class="discover-modal"
      role="dialog"
      aria-labelledby="discover-title"
      aria-modal="true"
    >
      <div class="discover-header">
        <h2 id="discover-title">Recent Updates</h2>
        <button
          class="discover-close"
          on:click={handleClose}
          aria-label="Close discover list"
        >
          ×
        </button>
      </div>

      <div class="discover-content">
        {#if locations.length === 0}
          <p class="no-locations">No locations to discover yet.</p>
        {:else}
          {#each locations as location (location.slug)}
            <button
              class="discover-item"
              on:click={() => handleSelect(location)}
            >
              {#if location.hero}
                <img
                  src={location.hero}
                  alt={location.name}
                  class="discover-thumb"
                />
              {/if}
              <div class="discover-info">
                <h3>{location.name}</h3>
                <p>{location.place}</p>
              </div>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .discover-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: var(--spacing-md);
  }

  .discover-modal {
    background: var(--color-surface);
    border: var(--border-width-thick) solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    width: 100%;
    max-width: 500px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    animation: slideIn 0.2s ease;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .discover-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-md) var(--spacing-lg);
    border-bottom: var(--border-width) solid var(--color-border);
    background: var(--color-primary);
  }

  .discover-header h2 {
    font-size: 1.25rem;
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0;
    text-transform: uppercase;
  }

  .discover-close {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-surface);
    color: var(--color-text-primary);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 1.5rem;
    font-weight: var(--font-weight-bold);
    line-height: 1;
    transition: all 0.2s ease;
  }

  .discover-close:hover {
    background: var(--color-accent);
    transform: translate(-1px, -1px);
    box-shadow: var(--shadow-md);
  }

  .discover-content {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-sm);
  }

  .no-locations {
    padding: var(--spacing-lg);
    text-align: center;
    color: var(--color-text-secondary);
  }

  .discover-item {
    display: flex;
    gap: var(--spacing-md);
    width: 100%;
    padding: var(--spacing-md);
    margin-bottom: var(--spacing-sm);
    background: var(--color-surface);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    box-shadow: var(--shadow-sm);
  }

  .discover-item:hover {
    background: var(--color-complement);
    transform: translate(-2px, -2px);
    box-shadow: var(--shadow-md);
  }

  .discover-item:last-child {
    margin-bottom: 0;
  }

  .discover-thumb {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: var(--radius-sm);
    border: var(--border-width) solid var(--color-border);
    flex-shrink: 0;
  }

  .discover-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    justify-content: center;
  }

  .discover-info h3 {
    font-size: 1rem;
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0;
    text-transform: uppercase;
  }

  .discover-info p {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    margin: 0;
  }

  /* Mobile/tablet: Full screen modal */
  @media (max-width: 1024px) {
    .discover-backdrop {
      padding: 0;
    }

    .discover-modal {
      max-width: 100%;
      max-height: 100vh;
      border-radius: 0;
      height: 100vh;
    }

    .discover-item {
      padding: var(--spacing-sm);
    }

    .discover-thumb {
      width: 60px;
      height: 60px;
    }
  }
</style>
