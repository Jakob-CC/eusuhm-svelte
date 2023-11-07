<script>
    import { euscolors, hottopics } from "./Store.js";
</script>

<!-- Submit Component -->
<div class="uk-container uk-padding-large">
    <h1 class="uk-heading-large uk-text-center">Submit your abstract here</h1>

    <div class="uk-flex uk-flex-center uk-padding-large">
        <a style="color: white;" href="https://abstract.cc2c.de/?termin=1381" target="_blank">
            <button style="-min-width:61%; min-height: 90px; font-size: 30px; font-weight:bold; box-shadow: 0 10px 10px #0001" class="uk-button uk-button-primary uk-button-large uk-margin">
                Submit
            </button> 
        </a>        
    </div>


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