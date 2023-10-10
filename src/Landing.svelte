<script>
  import { congressdata } from './CongressData.js';
  let data = {};
  congressdata.subscribe(value => {
      data = value;
  });
  const committee = 'Programme Committee';
</script>

<!-- MAIN CONTENT -->
<main class="uk-container">
<article id="" class="uk-padding uk-padding-remove-bottom">
  {#each Object.entries(data) as [section, details], index}
    <h1>{section}</h1>
    <ul class="uk-list">
      {#each Object.entries(details) as [key, value]}
        
        {#if key !== committee} <!-- Your curated filter for 'Committee' -->
          <li>
            <strong>{key}</strong>
        {/if}

        {#if Array.isArray(value)}
          <ul class="uk-list">
            {#each value as item}
              <li>{item}</li>
            {/each}
          </ul>
        {:else if section === committee}
          <ul class="uk-list">
            {#each value as { organisation, members }}
              <li>{organisation}: {#each members as member} {member} {/each}</li>
            {/each}
          </ul>
        {:else if typeof value === 'object'}
          <ul class="uk-list">
            {#each Object.entries(value) as [innerKey, innerValue]}
              <li>{innerKey}: {innerValue}</li>
            {/each}
          </ul>
        {:else}
          {value}
        {/if}

        {#if key !== committee}
          </li>
        {/if}
      {/each}
    </ul>
  {/each}
</article>
</main>
