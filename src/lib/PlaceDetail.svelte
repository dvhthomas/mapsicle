<script>
  import { marked } from 'marked';

  export let location;
  export let compact = false;
</script>

<div class="popup-content" class:compact>
  <h3>{location.name}</h3>
  <div class="place">{location.place}</div>

  {#if location.description}
    <div class="description">
      {@html marked.parse(location.description)}
    </div>
  {/if}

  {#if location.tags && location.tags.length > 0}
    <div class="tags">
      {#each location.tags as tag}
        <span class="tag">{tag}</span>
      {/each}
    </div>
  {/if}
</div>

<style>
  /* Component-specific styles can go here if needed */
  /* Most styles are inherited from app.css */
</style>
