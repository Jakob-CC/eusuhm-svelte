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
  <article id="" class="uk-padding">
    
    {#each Object.entries(data) as [section, details], index}
      {#if section!==notdisplayed}
        <h1>{section}</h1>
        {#each Object.entries(details) as [key, value]}
        <!-- {key} -->
          {#if Array.isArray(value)}
                <!-- Inhalt wie "Congress Compact" -->
                {#each value as item}
                  {item}
                {/each}
            {:else if typeof value === 'object'}
              <div class="uk-grid">
                {#each Object.entries(value) as [innerKey, innerValue],index}
                  <div class="uk-width-1-3 eus-width-1-1-mobile">
                  <!-- <div class="uk-width-1-3 uk-width-1-1@s"> -->
                    {#if index===0}
                      <h3 class="eus-topborder">{innerValue}</h3>
                      
                    {:else}
                      <ul class="uk-list">
                        {#each innerValue as person}
                          <li>{person}</li>
                        {/each}
                      </ul>
                    {/if} 
                  </div>
                {/each}
              </div>
            {:else}
              {value}<br>
            {/if}
        {/each}
      {/if}
    {/each}
  </article>
</main>
