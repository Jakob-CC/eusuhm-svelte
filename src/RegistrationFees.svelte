<script>
    // Importieren des Stores aus der externen Datei
    import { congressData } from './CongressData.js';
    
    // Auto-Subscription des Svelte Stores
    $: data = $congressData;
    
      let displayed = 'Registration Fees';
    </script>
    
    <!-- MAIN CONTENT -->
    <main class="uk-container uk-padding-remove-top">
    <article id="landing-data" class="uk-padding-remove-top">
      <div class="uk-grid uk-grid-column">
        <div class="uk-width-1-2">
            {#each Object.entries(data) as [section, details], index}
                {#if index !== 0}  
                  <div class="eus-width-1-2-desktop eus-width-1-1-mobile uk-padding uk-padding-remove-top">
                      {#if section==displayed}
                        {#if section==='Registration Fees'}
                            <h1   style="line-height:0; padding-bottom:0;">{section}</h1>
                            <span style="display: inline-block; width:110px"></span>
                            <span style="display: inline-block; width:80px; text-align:right;">early bird</span>
                            <span style="display: inline-block; width:80px; text-align:right;">regular</span>
                          {:else}     
                            <h1>{section}</h1>
                          {/if}
                          <p>
                          {#each Object.entries(details) as [key, value]}
                                    {#if section==='Registration Fees'}
                                        <span style="display: inline-block; width:110px">{key}</span>
                                        {#each Object.entries(value) as [cat, prices]}
                                            <span style="display: inline-block; width:80px; text-align:right;">{prices}&hairsp;&hairsp;€</span>
                                            <!-- 11 -->
                                             <!-- content here -->
                                        {/each}
                                        <br>
                                    {:else}
                                        {value} &nbsp;
                                        <br>
                                    {/if}
                          {/each}
                        </p>
                      {/if}
                  </div>
                {/if}
            {/each}
        </div>
      </div>
    </article>
    </main>
    