<script>
  /**
   * SearchBar Component
   *
   * Simple search input with clear button
   * - Search logic is handled by the centralized store (appState.js)
   * - Updates URL with search query via store actions
   * - Clear button triggers full application reset
   *
   * @prop {string} searchQuery - Current search text (two-way bound)
   *
   * @fires search - Emitted when search query changes
   */

  import { createEventDispatcher } from 'svelte';
  import { actions } from './stores/appState';

  export let searchQuery = '';

  const dispatch = createEventDispatcher();
  let inputElement;

  /**
   * Handle input changes
   * Dispatches query to parent which calls store actions
   */
  function handleInput() {
    dispatch('search', { query: searchQuery });
  }

  /**
   * Clear button handler
   * Triggers full application reset (clears all filters, selections, URL)
   */
  function handleClearButtonClick() {
    actions.reset();
  }

  /**
   * Focus on search input and select any existing text
   * Called from parent via keyboard shortcut
   */
  export function focusAndSelect() {
    if (inputElement) {
      inputElement.focus();
      inputElement.select();
    }
  }
</script>

<div class="search-section">
  <div class="search-input-wrapper">
    <input
      type="text"
      bind:value={searchQuery}
      bind:this={inputElement}
      on:input={handleInput}
      placeholder="Search locations..."
      class="search-input"
      aria-label="Search locations"
    />
    {#if searchQuery}
      <button
        class="clear-search"
        on:click={handleClearButtonClick}
        aria-label="Clear search and reset filters"
      >
        ×
      </button>
    {/if}
  </div>
</div>

<style>
  .search-section {
    padding: 0;
    background: transparent;
    border: none;
    box-shadow: none;
  }

  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .search-input {
    width: 100%;
    padding: var(--spacing-md) var(--spacing-lg);
    padding-right: 4rem;
    font-size: 1.125rem;
    font-weight: var(--font-weight-normal);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-lg);
    background: var(--color-surface);
    color: var(--color-text-primary);
    transition: box-shadow 0.2s ease;
    font-family: var(--font-family);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-border);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2), 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  .search-input::placeholder {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-normal);
  }

  .clear-search {
    position: absolute;
    right: var(--spacing-md);
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-accent);
    color: var(--color-text-primary);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 1.25rem;
    font-weight: var(--font-weight-bold);
    line-height: 1;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
    padding: 0;
  }

  .clear-search:hover {
    background: var(--color-primary);
    color: var(--color-text-primary);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }

  /* Responsive: Compact search bar on mobile/tablet */
  @media (max-width: 1024px) {
    .search-input {
      padding: var(--spacing-sm);
      font-size: 0.9rem;
    }
  }
</style>
