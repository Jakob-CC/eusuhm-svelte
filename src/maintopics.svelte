<script>
    import { euscolors, hottopics } from "./Store.js";
</script>

<!-- Submit Component -->
<div class="uk-container uk-padding-large">
    <article class="uk-margin-large">
        <h1 class="uk-text-center uk-heading-large eus-transform-none">Our Main Topics in 2024</h1>
  
        <!-- Card Grid -->
        <div class="uk-grid uk-grid-small uk-child-width-1-2@s uk-child-width-1-3@m uk-text-center uk-grid-match uk-margin-large-top" uk-grid>
          {#each $hottopics as topic, i}
            <div class="eus-clip">
              <div style="background-color:{euscolors[ (2+i) % (euscolors.length-1) ]}; color: black;" class="eus-height-300 uk-card uk-card-hover uk-card-body uk-card-small uk-flex uk-flex-middle uk-flex-center">
                <p class="eus-text-xxlarge uk-margin-remove">{topic}</p>
              </div>
            </div>
          {/each}
        </div>
      </article>

</div> 