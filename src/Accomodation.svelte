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
            <h1 class="uk-text-center uk-margin-large-top uk-heading-small">Accomodation</h1>
            <table class="uk-table uk-table-hover uk-table-divider">
                <thead>
                <tr>
                    <th class="uk-width-1-3">Hotel</th>
                    <th>Rooms Available</th>
                    <th>Keyword</th>
                    <th>Contact</th>
                </tr>
                </thead>
                <tbody>
                {#each hotels as hotel}
                    <tr>
                    <td class="uk-text-large uk-width-1-3">{hotel.name}</td>
                    <td>{hotel.room}</td>
                    <td>{hotel.keyword}</td>
                    <td><a href="mailto:{hotel.contact}">{hotel.contact}</a></td>
                    </tr>
                {/each}
                </tbody>
            </table>
            
        </article>
    </section>
    
</main>
