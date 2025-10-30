<script>
  /**
   * Collapsible Component
   *
   * Shared collapsible section with consistent header styling.
   * Used by TagFilter and LocationList for uniform appearance.
   *
   * Features:
   * - Consistent header styling across sidebar sections
   * - Optional count badge in header
   * - Expand/collapse icon with rotation animation
   * - Two-way binding for expanded state
   * - Optional fill mode to take remaining sidebar space (for LocationList)
   * - Optional tooltip on hover with accessibility support
   *
   * @prop {string} title - Section title to display
   * @prop {number|null} count - Optional count badge (null to hide)
   * @prop {boolean} isExpanded - Expand/collapse state (two-way bindable)
   * @prop {boolean} fill - If true, section fills remaining vertical space
   * @prop {string} tooltip - Optional tooltip text shown on hover
   */

  export let title = '';
  export let count = null;
  export let isExpanded = false;
  export let fill = false;
  export let tooltip = '';

  let showTooltip = false;
  let tooltipTimeout;

  /**
   * Toggle collapse/expand state
   */
  function toggle() {
    isExpanded = !isExpanded;
  }

  /**
   * Show tooltip after brief delay
   */
  function handleMouseEnter() {
    if (!tooltip) return;
    tooltipTimeout = setTimeout(() => {
      showTooltip = true;
    }, 300); // 300ms delay before showing
  }

  /**
   * Hide tooltip immediately
   */
  function handleMouseLeave() {
    clearTimeout(tooltipTimeout);
    showTooltip = false;
  }
</script>

<div class="collapsible-section" class:fill={fill}>
  <button
    class="collapsible-header"
    on:click={toggle}
    on:mouseenter={handleMouseEnter}
    on:mouseleave={handleMouseLeave}
    aria-label={tooltip ? `${title}. ${tooltip}` : title}
    aria-expanded={isExpanded}
  >
    <h3>
      {title}
      {#if count !== null && count > 0}
        <span class="count-badge">({count})</span>
      {/if}
    </h3>
    <span class="expand-icon" class:expanded={isExpanded}>▼</span>
    {#if tooltip && showTooltip}
      <span class="tooltip" role="tooltip">
        {tooltip}
      </span>
    {/if}
  </button>
  {#if isExpanded}
    <div class="collapsible-content" class:fill={fill}>
      <slot />
    </div>
  {/if}
</div>

<style>
  .collapsible-section {
    background: var(--color-surface);
    border-bottom: var(--border-width) solid var(--color-border);
  }

  .collapsible-header {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    background: transparent;
    border: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: background 0.2s ease;
    position: relative; /* For tooltip positioning */
  }

  .collapsible-header:hover {
    background: var(--color-surface-hover);
  }

  /* Tooltip styling */
  .tooltip {
    position: absolute;
    bottom: calc(100% + var(--spacing-xs));
    left: 50%;
    transform: translateX(-50%);
    background: var(--color-text-primary);
    color: var(--color-surface);
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: var(--radius-md);
    font-size: 0.75rem;
    font-weight: var(--font-weight-normal);
    line-height: 1.4;
    white-space: nowrap;
    z-index: 1000;
    pointer-events: none;
    border: var(--border-width) solid var(--color-border);
    box-shadow: var(--shadow-md);
    animation: tooltipFadeIn 0.2s ease;
  }

  /* Tooltip arrow */
  .tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid var(--color-text-primary);
  }

  @keyframes tooltipFadeIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  .collapsible-section h3 {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--color-text-primary);
    margin: 0;
    font-weight: var(--font-weight-bold);
    text-align: left;
  }

  .count-badge {
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-normal);
  }

  .expand-icon {
    font-size: 0.75rem;
    transition: transform 0.2s ease;
    color: var(--color-text-secondary);
  }

  .expand-icon.expanded {
    transform: rotate(180deg);
  }

  /* Content styling is handled by slotted components */

  /* Fill mode: Takes remaining vertical space (for LocationList) */
  .collapsible-section.fill {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .collapsible-content.fill {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  /* Responsive: Slightly more compact on mobile/tablet */
  @media (max-width: 1024px) {
    .collapsible-header {
      padding: var(--spacing-sm) var(--spacing-md);
    }

    .collapsible-section h3 {
      font-size: 0.7rem;
    }
  }
</style>
