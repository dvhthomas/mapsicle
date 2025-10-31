<script>
  /**
   * Header Component
   *
   * Universal header for all device sizes
   * - Displays app title and subtitle
   * - Clicking header resets app to HOME state (like VIEW ALL button)
   * - Desktop: Full-size header in sidebar
   * - Mobile: Compact horizontal header in sidebar
   */
  import { config } from '$lib/config';
  import { actions } from '$lib/stores/appState';

  function handleReset() {
    actions.reset();
  }
</script>

<button class="header" on:click={handleReset}>
  <h1>{config.appTitle}</h1>
  <p>{config.appSubtitle}</p>
</button>

<style>
  .header {
    display: block;
    background: var(--color-primary);
    border: none;
    border-bottom: var(--border-width-thick) solid var(--color-border);
    width: 100%;
    cursor: pointer;
    transition: opacity 0.2s ease;
    text-align: center;
    margin: 0;
    padding: var(--spacing-lg) var(--spacing-md);
    line-height: 1;
    font-family: inherit;
  }

  .header:hover {
    opacity: 0.85;
  }

  .header:active {
    opacity: 0.7;
  }

  .header h1,
  .header p {
    display: inline;
    margin: 0;
    padding: 0;
    vertical-align: baseline;
  }

  .header h1 {
    font-size: 1.5rem;
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    text-transform: uppercase;
  }

  .header p {
    font-size: 0.875rem;
    font-weight: var(--font-weight-normal);
    color: var(--color-text-primary);
    text-transform: uppercase;
    margin-left: var(--spacing-sm);
  }

  /* Mobile: Smaller text and padding */
  @media (max-width: 1024px) {
    .header {
      padding: var(--spacing-md) var(--spacing-md);
    }

    .header h1 {
      font-size: 0.9rem;
    }

    .header p {
      font-size: 0.65rem;
    }
  }
</style>
