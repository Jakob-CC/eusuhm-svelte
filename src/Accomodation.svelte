<script>
	import Contact from './Contact.svelte';
    let hotels = [
      {name: 'The niu Amity', room: 30, keyword: 'Congress Compact', contact: 'reservation@novum-hospitality.com'},
      {name: 'Holiday Inn Express & Suites Potsdam', room: 40, keyword: 'EUSUHM 2024', contact: 'info@hiex-potsdam.de'},
      {name: 'Nh Hotel Potsdam', room: 30, keyword: 'EUSUHM 2024', contact: 'reservierungen@nh-hotels.com'}
    ];
</script>
  
<main class="uk-container">
    <section class="uk-padding uk-margin-xlarge-bottom">
        <article>
            <h1 class="uk-text-center uk-margin-large-top uk-heading-small">Accommodation</h1>
            <div class="uk-grid uk-grid-match uk-child-width-1-3@m" uk-grid>
                {#each hotels as hotel}
                    <div>
                        <div class="uk-card uk-card-default">
                            <div class="uk-card-body">
                                <h3 class="uk-card-title">{hotel.name}</h3>
                                <p class="uk-text-meta">Rooms Available <span class="uk-text-primary">{hotel.room}</span></p>
                                <p class="uk-text-meta">Keyword <span class="uk-text-primary">{hotel.keyword}</span></p>
                                <p class="uk-text-meta">Contact <a class="uk-text-primary" href="mailto:{hotel.contact}">{hotel.contact}</a></p>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </article>
    </section>
</main>