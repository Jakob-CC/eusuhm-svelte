<script>
  import { congressdata } from './CongressData.js';
  let data;
  congressdata.subscribe(value => {
    data = value;
  });
  let notdisplayed = "Wissenschaftliche Leitung";
</script>

<!-- MAIN CONTENT -->
<main class="uk-container uk-padding-remove-top">
<article id="" class="uk-padding-remove-top">
  <div class="uk-grid uk-grid-column">
    <div class="uk-width-1-2 eus-width-1-1-mobile">
        {#each Object.entries(data) as [section, details], index}
            {#if index % 2 === 0}  <!-- 👾 Linke Spalte: Nur Indexe 0, 2, 4, ... -->
              <div class="eus-width-1-2-desktop eus-width-1-1-mobile uk-padding uk-padding-remove-top">
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
                                      <div class="uk-width-1-2 eus-width-1-1-mobile">
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
              </div>
            {/if}
        {/each}
    </div>
    <div class="uk-width-1-2">
        {#each Object.entries(data) as [section, details], index}
            {#if index % 2 === 1}  <!-- 👾 Rechte Spalte: Nur Indexe 1, 3, 5, ... -->
              <div class="eus-width-1-2-desktop eus-width-1-1-mobile uk-padding uk-padding-remove-top">
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
              </div>
            {/if}
        {/each}
    </div>
  </div>
</article>
</main>
