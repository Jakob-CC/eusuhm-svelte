<script>
	// main page
	import Navbar from './Navbar.svelte';
	import Landing from './Landing.svelte';
	import Footer from './Footer.svelte';
	import Contact from './Contact.svelte';
	// submit page
	import Submit from './Submit.svelte';


	let content1=1;
	let onClick = () => {
		content1+=1;
	}

</script>

<Navbar />
<Landing />
<Contact />
<button on:click={onClick}>{content1}</button>
<Footer />