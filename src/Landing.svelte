<script>
    import {objectives, topics} from './Store.js'

</script>


<!-- MAIN CONTENT -->
<main class="uk-container">
    <!-- HERO SECTION -->
    <article id="" class="uk-padding uk-padding-remove-bottom">
        <h2 id="eus-forthechildren">For the Health and Wellbeing of Children <br> and Young People in Europe</h2>
    </article>
    <section id="top" class="eus-potsdam-bg  uk-section uk-section-primary uk-section-xlarge uk-text-center uk-light eus-background-prime">
        <h1 class="uk-heading-2xlarge">EUSUHM</h1>
    </section>
    <!-- Conference Introduction -->
    <article id="about" class="uk-padding uk-margin-xlarge">
        <!-- Conference Invitation and Details -->
        <h2 class="uk-text-light">
            The European Union for School and University Health and Medicine (<a class="uk-link-muted" href="https://eusuhm.org/" target='_blank' rel='noopener'>EUSUHM</a>)
            invites you to the 22nd conference on 
            <span class="uk-text-bolder">Sustainable Health in Children and Students — Reduce the GAP!</span>
            in 
            <span class="uk-text-bolder">Potsdam, Germany.</span>
        </h2>

        <!-- Context About Health Services in Educational Settings -->
        <p class="uk-text-lead">
            Health services for educational settings play a vital role in fostering the overall well-being of students and supporting their academic success by focusing on monitoring health, promoting mental well-being, and addressing specific health challenges. 
        </p><p class="uk-text-lead">
            The conference focuses on the disparities in health and healthcare access among European children and adolescents, taking into account the multiple impacts of the pandemic. It will explore numerous health-related initiatives and programs carried out in learning environments, primarily focusing on educational institutions.
        </p>
    </article>

<!-- Highlighted Topics -->

  
  <div class="eus-clip">
    <section class="eus-background-prime uk-background-muted uk-padding uk-margin-xlarge">
      <article class="uk-margin-large">
        <h1 class="uk-text-center uk-heading-large">Program Highlights</h1>
  
        <!-- Card Grid -->
        <div class="uk-grid uk-grid-small uk-child-width-1-2@s uk-child-width-1-3@m uk-text-center uk-grid-match uk-margin-large-top" uk-grid>
          {#each topics as topic}
            <div class="eus-clip">
              <div class="eus-height-300 uk-card uk-card-hover uk-card-body uk-card-small uk-background-default uk-flex uk-flex-middle uk-flex-center">
                <p class="eus-text-xxlarge uk-margin-remove">{topic}</p>
              </div>
            </div>
          {/each}
        </div>
      </article>
    </section>
  </div>
  

  
  <section class="uk-padding">
    <article>
      <h1 class="uk-text-center uk-margin-large-top uk-heading-small">Objectives of the conference</h1>
      <div class="uk-grid uk-grid-match uk-child-width-1-3@s uk-margin-large-top" uk-grid>
        {#each objectives as objective}
          <div class="eus-clip">
            <div class="uk-text-center uk-card uk-card-secondary uk-card-body uk-flex uk-flex-middle uk-flex-center">
              <h2 class="uk-text-bold">{objective}</h2>
            </div>
          </div>
        {/each}
      </div>
    </article>
  </section>
  
<!-- Additional Information -->
<section class="uk-padding uk-margin-xlarge-bottom">
    <article>
        <h1 class="uk-text-center uk-margin-large-top uk-heading-small">Location</h1>
        <p class="uk-text-large">
            The 22nd EUSUHM conference will take place in the <a class="uk-link-muted" href="https://oberlin-schule.de/" target='_blank' rel='noopener'>Oberlin-Schule Potsdam</a>, 
            which is a dedicated educational and living space for children and adolescents 
            with diverse disabilities. <a class="uk-link-muted" href="https://www.potsdam-tourism.com/en/home" target='_blank' rel='noopener'>Potsdam</a> is home to several UNESCO World Heritage Sites,
            including Sanssouci Palace, a symbol of the Age of Enlightenment, 
            and the <a class="uk-link-muted" href="https://www.spsg.de/schloesser-gaerten/objekt/schloss-cecilienhof/" target='_blank' rel='noopener'>Cecilienhof</a>, where the post-World War II Europe was restructured.
        </p>
        <h1 class="uk-text-center uk-margin-large-top uk-heading-small">Great Partners</h1>
        <p class="uk-text-large">
            The EUSUHM conference and scientific program is set up in close cooperation with the 
            <a class="uk-link-muted" href="https://www.bvoegd.de/" target="_blank" rel="noopener">German Federal Association of Doctors in the Public Health Service (BVÖGD), </a>
            <a class="uk-link-muted" href="https://www.dgoeg.de/" target="_blank" rel="noopener">the German Association of Public Health (DGÖG) </a>
            and the 
            <a class="uk-link-muted" href="https://www.scolarmed.ch/index.php/de/" target='_blank' rel='noopener'>Swiss Association of Specialists in School Health Services (SCOLARMED).</a>
        </p>
        <h1 class="uk-heading-large uk-text-center uk-margin-large uk-padding-large">Looking forward to&nbsp;seeing you at&nbsp;the&nbsp;conference</h1>
    </article>

<!-- Signatories -->
    <div class="uk-grid uk-child-width-1-3@s uk-text-center uk-margin-bottom" uk-grid></div>
        <div>
            <strong>Gabriele Ellsaesser</strong>
            <br>
            EUSUHM, president
        </div>
        <div>
            <strong>Susanne Stronski</strong>
            <br>
            <strong>Tina Huber-Gieseke</strong>
            <br>
            SCOLARMED, co-presidents
        </div>
        <div>
            <strong>Johannes Nießen</strong>
            <br>
            BVÖGD, chair
        </div>
</section>

</main>
