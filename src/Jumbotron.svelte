<script>
    import {objectives, topics, euscolors, topbuttons} from './Store.js'
</script>


<!-- MAIN CONTENT -->
<main class="uk-container">
  <!-- HERO SECTION -->
  <article id="" class="uk-article uk-padding-remove-bottom">
    <h2 id="eus-smallhead">Sustainable Health in&nbsp;Children and&nbsp;Students —&nbsp;Reduce&nbsp;the&nbsp;GAP!</h2>
</article>
<section id="top" class="eus-potsdam-bg  uk-section uk-section-primary uk-text-center uk-light eus-background-prime uk-padding-remove-top">
    <div style="max-width:100%; margin: 60px 30px" class="eus-clip uk-card uk-card-body uk-background-primary uk-padding-small">
      <p>Congress Announcement </p>
      <h1 class="uk-heading-large"> 22nd EUSUHM Congress </h1>
      <h3 class="eus-transform-none">3rd to 5th of October 2024</h3>
      <!-- <h2 class="uk-padding uk-padding-remove-top">on&nbsp;Sustainable Health in&nbsp;Children and&nbsp;Students —&nbsp;Reduce&nbsp;the&nbsp;GAP!</h2> -->
    </div>
</section>
<section style="position:relative; top:-100px" class="">
  <article class="">
    <div class="uk-grid uk-grid-match uk-child-width-1-3@s uk-padding" uk-grid>
      {#each topbuttons as button, i}
        <div class="eus-clip">
          <!-- euscolors contains also darker shades. the first three are the main colors. so length-darkshades -->
          <!-- the first color should not be green, so i+n -->
          <a href="{button.url}" rel="noopener" target="_blank">
            <div style="background-color:{euscolors[ (2+i) % (euscolors.length-1) ]}" class="uk-height-small uk-text-center uk-card uk-card-body uk-flex uk-flex-middle uk-flex-center">
              <h3 class="eus-line-height-1">{button.label}</h3>
            </div>
          </a>
        </div>
      {/each}    
    </div>
  </article>
</section>
</main>
