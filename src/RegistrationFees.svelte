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
      <div class="">
        <div class="">
            {#each Object.entries(data) as [section, details], index}
                {#if index !== 0}  
                  <div class="uk-padding uk-padding-remove-top">
                      {#if section==displayed}
                        {#if section==='Registration Fees'}
                            <h1   class="uk-heading-small">{section}</h1>
                            <ul class="uk-list uk-text-large">
                                <li class="uk-padding-bottom-remove">
                                    <span class="eus-fee eus-fee-title eus-fee-spacer"></span>
                                    <div style="display:inline-block">
                                        <span class="eus-fee eus-fee-title">Early </span>
                                        <span class="eus-fee eus-fee-title">Regular </span>
                                        <span class="eus-fee eus-fee-title">Late </span>
                                    </div>
                                </li>
                                <li class="uk-text-small" style="margin-top:0">
                                    <span class="eus-fee eus-fee-title eus-fee-spacer uk-text-top" style="line-height: 0px; padding-bottom:0;"></span>
                                    <div style="display:inline-block">
                                        <span class="eus-fee eus-fee-title eus-fee-details uk-text-top">Early Rate until 1st&nbsp;July 2024</span>
                                        <span class="eus-fee eus-fee-title eus-fee-details uk-text-top">Regular Rate</span>
                                        <span class="eus-fee eus-fee-title eus-fee-details uk-text-top">Late Rate after 1st&nbsp;September 2024</span>
                                    </div>
                                </li>
                            </ul>
                        {:else}     
                            <h1>{section}</h1>
                          {/if}
                          <ul class="uk-list">
                          {#each Object.entries(details) as [key, value]}
                                    <li>
                                        <span class="eus-fee eus-fee-title eus-fee-spacer uk-text-large">{key}</span>
                                        <div style="display:inline-block">
                                            {#each Object.entries(value) as [cat, prices]}
                                                <span class="eus-fee">{prices}&hairsp;&hairsp;€</span>
                                            {/each}
                                        </div>
                                    </li>
                                    <br>
                          {/each}
                          </ul>
                      {/if}
                  </div>
                {/if}
            {/each}
        </div>
      </div>
    </article>
    </main>
    