<script>
    import { congressdata } from './CongressData.js';
    let data;
    congressdata.subscribe(value => {
      data = value;
    });
    let notdisplayed = "Wissenschaftliche Leitung";
</script>


<!-- MAIN CONTENT -->
<main class="uk-container">
  <article id="" class="uk-padding uk-padding-remove-bottom">
        
    {#each Object.entries(data) as [section, details], index}
    <!-- h1 -->
    <h1>{section}</h1>
      {#each Object.entries(details) as [key, value]}
          <!-- {key} -->
          {#if Array.isArray(value)}
              <!-- Inhalt wie "Congress Compact" -->
              {#each value as item}
                <p>{item}</p>
              {/each}
          {:else if typeof value === 'object'}
              {#each Object.entries(value) as [innerKey, innerValue],index}
                  {#if index===0}
                     <h2>{innerValue}</h2>
                  {:else}
                    <ul class="uk-list">
                      {#each innerValue as person}
                         <li>{person}</li>
                      {/each}
                    </ul>
                  {/if}
                     
              {/each}
          {:else}
            <p>{value}</p>
          {/if}
      {/each}
    {/each}
  </article>
</main>
