<script>
	import { onMount } from 'svelte';
	
	// main sections
	import Navbar from './Navbar.svelte';
	import Contact from './Contact.svelte';
	import Footer from './Footer.svelte';
	// sub sections
	import Landing from './Landing.svelte';
	import Submit from './Submit.svelte';
	import Programme from './Programme.svelte'
	import Accomodation from './Accomodation.svelte';
	import About from './About.svelte';
	import Jumbotron from './Jumbotron.svelte';
	import Maintopics from './maintopics.svelte';
	import RegistrationFees from './RegistrationFees.svelte';

	// subpages setup
	let currentRoute = window.location.pathname;

	// This will run when the component mounts
	onMount(() => {
		console.log("Initial currentRoute: ", currentRoute); // Debugging line
		window.addEventListener('popstate', () => {
			currentRoute = window.location.pathname;
			console.log("Updated currentRoute: ", currentRoute); // Debugging line
		});
	});

</script>	

<Navbar/>
{#if currentRoute === '/submit'}
	<Submit />
	<Contact />
	<Footer />

{:else if currentRoute === '/programme'}	
	<Maintopics />
	<Programme />
	<Footer />

{:else if currentRoute === '/accomodation'}
	<Accomodation />
	<Contact />
	<Footer />

{:else if currentRoute === '/about'}
	<About />
	<Jumbotron />
	<Footer />

{:else if currentRoute === '/registrationfees' }
	<RegistrationFees />
	<Contact />
	<Footer />

{:else}
	<Jumbotron />
	<Landing />
	<Footer />

{/if}

<!-- Here, <Navbar /> is outside the conditional block, so it's common to all routes. The content (either <Landing />, <Contact />, etc. or <Submit />) changes based on the value of currentRoute.
Also, I added an {:else} block to show the main page components only if the route is not /submit. This prevents the main page and submit page components from showing up simultaneously. -->
