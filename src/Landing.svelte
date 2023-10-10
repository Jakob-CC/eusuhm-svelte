<script>
    import { congressdata } from './CongressData.js';
    import {objectives, topics, euscolors, topbuttons} from './Store.js';
    let data;
    congressdata.subscribe(value => {
      data = value;
    });
</script>


<!-- MAIN CONTENT -->
<main class="uk-container">
  <article id="" class="uk-padding uk-padding-remove-bottom">
        
    {#each Object.entries(data) as [section, details], index}
    <!-- h1 -->
    <h1>{section}</h1>
    <ul class="uk-list">
      {#each Object.entries(details) as [key, value]}
        <li>
          <!-- "Name" etc -->
          {key}
          {#if Array.isArray(value)}
            <ul class="uk-list">
              <!-- Inhalt wie "Congress Compact" -->
              {#each value as item}
                <li>{item}</li>
              {/each}
            </ul>
          {:else if typeof value === 'object'}
            <ul>
              {#each Object.entries(value) as [innerKey, innerValue]}
                <li>{innerKey}: {innerValue}</li>
              {/each}
            </ul>
          {:else}
            {value}
          {/if}
        </li>
      {/each}
    </ul>
    {/each}
  </article>
</main>
