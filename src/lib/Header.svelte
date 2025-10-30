<script>
  /**
   * Header Component
   *
   * Displays app title and subtitle
   * - On desktop/tablet: Hidden (title shown in sidebar)
   * - On mobile: Minimal persistent header above search bar
   */
  import { config } from '$lib/config';
</script>

<div class="mobile-header">
  <h1>{config.appTitle}</h1>
  <p>{config.appSubtitle}</p>
</div>

<style>
  .mobile-header {
    /* Hidden on desktop and tablet - title shown in sidebar */
    display: none;
  }

  /* Mobile only: Show compact horizontal header */
  @media (max-width: 1024px) {
    .mobile-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-xs);
      background: var(--color-primary);
      padding: var(--spacing-sm) var(--spacing-md);
      margin: 0;
      border: none;
      border-bottom: var(--border-width-thick) solid var(--color-border);
      width: 100%;
    }

    .mobile-header h1 {
      font-size: 0.9rem;
      font-weight: var(--font-weight-bold);
      margin: 0;
      color: var(--color-text-primary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .mobile-header p {
      font-size: 0.65rem;
      margin: 0;
      color: var(--color-text-primary);
      text-transform: uppercase;
      opacity: 0.85;
    }

    .mobile-header p::before {
      content: "·";
      margin-right: var(--spacing-xs);
    }
  }
</style>
