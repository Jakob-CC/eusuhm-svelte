<script>
	// main page
	import Navbar from './Navbar.svelte';
	import Landing from './Landing.svelte';
	import Footer from './Footer.svelte';
	import Contact from './Contact.svelte';
	// subpages setup
	let currentRoute = window.location.pathname;
	// submit page
	import Submit from './Submit.svelte';


	let content1=1;
	let onClick = () => {
		content1+=1;
	}

</script>

<Navbar/>

{#if currentRoute === '/submit'}
  <Submit>
    <!-- SubPage Content -->
  </Submit>
{:else}
  <Landing />
  <Contact />
  <button on:click={onClick}>{content1}</button>
  <Footer />
{/if}

<!-- Here, <Navbar /> is outside the conditional block, so it's common to all routes. The content (either <Landing />, <Contact />, etc. or <Submit />) changes based on the value of currentRoute.
Also, I added an {:else} block to show the main page components only if the route is not /submit. This prevents the main page and submit page components from showing up simultaneously. -->
