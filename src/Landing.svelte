<script>
// Importieren des Stores aus der externen Datei
import { congressData } from './CongressData.js';

// Auto-Subscription des Svelte Stores
$: data = $congressData;

  let notdisplayed = 'Registration Fees';
</script>

<!-- MAIN CONTENT -->
<main class="uk-container uk-padding-remove-top">
<article id="landing-data" class="uk-padding-remove-top">
  <div class="uk-grid uk-grid-column">
    <div class="uk-width-1-2 eus-width-1-1-mobile">
        {#each Object.entries(data) as [section, details], index}
            {#if index === 0}  
              <div class="eus-width-1-2-desktop eus-width-1-1-mobile uk-padding uk-padding-remove-top">
                  {#if section!==notdisplayed}
                      <h1 class="eus-line-height-1">{section}</h1>
                      {#each Object.entries(details) as [key, value]}
                      <!-- {key} -->
                          {#if Array.isArray(value)}
                              <!-- Inhalt wie "Congress Compact" -->
                            
                          {:else if typeof value === 'object'}
                              <div class="uk-grid">
                                  {#each Object.entries(value) as [innerKey, innerValue],index}
                                    {#if innerKey==='organisation'}
                                        <div class="uk-width-1-2 eus-width-1-1-mobile">
                                            <!-- Regel für "BVÖGD" und solche Titel -->
                                            <a href="{value.link}" target="_blank" rel="noopener">
                                            <h3 class="eus-line-height-1 eus-topborder eus-margin-0">{innerValue}</h3>
                                                <p class="uk-padding-remove">{value.fullname}</p>
                                            </a>
                                        </div>
                                    {:else if innerKey==='members'}<!-- Keine Aktion für index 1 und 2 -->
                                        <div class="uk-width-1-2 eus-width-1-1-mobile">
                                              <ul class="uk-list eus-margin-0">
                                                  {#each innerValue as person}
                                                      <li class="eus-margin-0">{person}</li>
                                                  {/each}
                                              </ul>
                                        </div>
                                    {/if}
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
            {#if index !== 0}  
              <div class="eus-width-1-2-desktop eus-width-1-1-mobile uk-padding uk-padding-remove-top">
                  {#if section!==notdisplayed}
                    <h1 class="uk-margin-remove">{section}</h1>
                    <p class="uk-margin-remove" style="padding-left:2px;">
                      {#each Object.entries(details) as [key, value]}
                                {#if key==='email'}
                                    <a class="uk-link-muted" href="mailto:{value}">{value}</a>
                                {:else if key==='phone'}
                                    <a class="uk-link-muted" href="tel:{value}">{value}</a>
                                {:else}
                                    {value} 
                                {/if}
                                &nbsp;<br>
                      {/each}
                    </p>
                  {/if}
              </div>
              <br>
            {/if}
        {/each}
    </div>
  </div>
</article>
</main>
