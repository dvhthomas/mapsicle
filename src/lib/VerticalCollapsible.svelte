<script>
  /**
   * VerticalCollapsible Component
   *
   * Slide-in/out panel from the left side of the screen.
   * Used on mobile to show/hide the sidebar without taking permanent screen space.
   *
   * Features:
   * - Slides in from left when opened
   * - Toggle button (hamburger icon) positioned on map
   * - Backdrop overlay when open (click to close)
   * - Smooth transitions
   * - Keyboard accessible (Escape to close)
   *
   * @prop {boolean} isOpen - Panel open/closed state (two-way bindable)
   */

  export let isOpen = false;

  /**
   * Toggle panel open/closed
   */
  function toggle() {
    isOpen = !isOpen;
  }

  /**
   * Close panel
   */
  function close() {
    isOpen = false;
  }

  /**
   * Handle keyboard shortcuts
   * - Escape: Close panel
   */
  function handleKeydown(event) {
    if (event.key === 'Escape' && isOpen) {
      close();
    }
  }

  /**
   * Close when clicking backdrop
   */
  function handleBackdropClick() {
    close();
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Toggle button - always visible on mobile -->
<button class="panel-toggle" on:click={toggle} aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}>
  <span class="hamburger-icon" class:open={isOpen}>
    <span></span>
    <span></span>
    <span></span>
  </span>
</button>

<!-- Backdrop overlay when panel is open -->
{#if isOpen}
  <div class="backdrop" on:click={handleBackdropClick} role="presentation"></div>
{/if}

<!-- Sliding panel -->
<div class="vertical-panel" class:open={isOpen}>
  <div class="panel-content">
    <slot />
  </div>
</div>

<style>
  .panel-toggle {
    position: fixed;
    top: 0;
    left: var(--spacing-md);
    width: 1.5rem;
    height: 1.5rem;
    background: var(--color-surface);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
    z-index: 1101; /* Above panel so close button remains visible */
    display: none; /* Hidden on desktop */
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s ease;
  }

  .panel-toggle:hover {
    background: var(--color-primary);
    transform: translate(-2px, -2px);
    box-shadow: var(--shadow-xl);
  }

  .panel-toggle:active {
    transform: translate(-1px, -1px);
  }

  /* Hamburger icon - three lines */
  .hamburger-icon {
    display: flex;
    flex-direction: column;
    gap: 2px;
    width: 0.75rem;
  }

  .hamburger-icon span {
    display: block;
    width: 100%;
    height: 1.5px;
    background: var(--color-text-primary);
    transition: all 0.3s ease;
    border-radius: 1px;
  }

  /* Animate hamburger to X when open */
  .hamburger-icon.open span:nth-child(1) {
    transform: translateY(3.5px) rotate(45deg);
  }

  .hamburger-icon.open span:nth-child(2) {
    opacity: 0;
  }

  .hamburger-icon.open span:nth-child(3) {
    transform: translateY(-3.5px) rotate(-45deg);
  }

  /* Backdrop overlay */
  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
    display: none; /* Hidden on desktop */
  }

  /* Sliding panel */
  .vertical-panel {
    position: fixed;
    top: 0;
    left: -320px; /* Hidden off-screen to the left */
    width: 320px;
    height: 100vh;
    background: var(--color-primary);
    border-right: var(--border-width-thick) solid var(--color-border);
    z-index: 1100; /* Above backdrop and map content */
    transition: left 0.3s ease;
    display: none; /* Hidden on desktop - uses normal layout */
    flex-direction: column;
    overflow: hidden;
    box-shadow: none;
  }

  .vertical-panel.open {
    left: 0; /* Slide in */
    box-shadow: 8px 0 24px rgba(0, 0, 0, 0.3);
  }

  .panel-content {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  /* Mobile: Show toggle button, backdrop, and enable sliding panel */
  @media (max-width: 1024px) {
    .panel-toggle {
      display: flex;
      top: 0.85rem; /* Aligns with vertical center of header on mobile */
    }

    .panel-toggle:hover {
      transform: translate(-2px, -2px);
    }

    .panel-toggle:active {
      transform: translate(-1px, -1px);
    }

    .panel-content {
      padding-left: calc(1.5rem + var(--spacing-md) * 2); /* Width of button + left spacing + clearance */
    }

    /* Background strip for button area with gradient */
    .panel-content::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: calc(1.5rem + var(--spacing-md) * 2);
      height: 100%;
      background: linear-gradient(180deg, var(--color-primary) 0%, var(--color-complement) 100%);
      z-index: -1;
    }

    .backdrop {
      display: block;
    }

    .vertical-panel {
      display: flex;
    }
  }
</style>
