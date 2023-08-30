<script>
	import { onMount } from 'svelte';
	
	// main page
	import Navbar from './Navbar.svelte';
	import Landing from './Landing.svelte';
	import Footer from './Footer.svelte';
	import Contact from './Contact.svelte';
	// submit page
	import Submit from './Submit.svelte';

	// subpages setup
	let currentRoute = window.location.pathname;

	// This will run when the component mounts
	onMount(() => {
		window.addEventListener('popstate', () => {
			currentRoute = window.location.pathname;
		});
	});

	// some local testing scripts
	let content1=1;
	let onClick = () => {
		content1+=1;
	}

</script>

<Navbar/>

{#if currentRoute === '/submit'}
  <Submit>
	<Contact />
    <!-- SubPage Content -->
  </Submit>
{:else}
  <Landing />
  <Contact />
  <button on:click={onClick}>{content1}</button>
  <Footer />
{/if}
