<script>
    // let navbarlinks = [["Display Text 1", "URL 1", "Target 1"],["Display Text 2", "URL 2", "Target 2"],];
    import { navbarlinks } from './Store.js';
    //import { test } from './Test.js'
</script>

<!-- {test} -->
<!-- Sticky Logo Green Snake -->

<a href="#top" id="eus-sticky-logo">
    <img src="./img/eusuhm_logo.svg" alt="Logo"/>
    <!-- <img src={logo} alt="Logo"/> -->
</a>

<!-- Mobile Off-Canvas Navbar -->
<div uk-sticky="sel-target: .uk-navbar-container; cls-active: uk-navbar-sticky uk-navbar-transparent uk-hidden@m">
    <nav class="uk-navbar-container" uk-navbar>

 
        
        <!-- Menu on the Right -->
        <div class="uk-navbar-right uk-padding uk-padding-remove-top uk-padding-remove-bottom">
            <a class="uk-text-success uk-navbar-toggle uk-hidden@m" href="/" uk-toggle="target: #offcanvas-nav">
                <span uk-icon="icon: navbar-toggle-icon; ratio: 1.5"></span>
            </a>
        </div>
    </nav>
</div>

  
<!-- Off Canvas Links -->
<div id="offcanvas-nav" uk-offcanvas="mode:slide; overlay:true; flip:true">
    <div class="uk-offcanvas-bar">
        <ul class="uk-nav uk-nav-default">
        {#each navbarlinks as [text, url, target]}
            <li><a class="eus-text-50" href={url} target={target} rel='noopener'>{text}</a></li>
        {/each}
        </ul>
    </div>
</div>

<!-- Desktop Navbar -->
<div class="uk-visible@m">
    <nav class="uk-navbar-container uk-navbar-transparent uk-padding-large uk-padding-remove-top uk-padding-remove-bottom" uk-navbar>
        
      <!-- Logo on the Left: Text part -->
      <div class="eus-logo-text uk-navbar-left uk-padding uk-padding-remove-top uk-padding-remove-bottom">
        <a href="/">
          <img src="img/eusuhm_logo_text.svg" alt="Logo"/>
        </a>
      </div>
          
      <div class="uk-navbar-right">
        <ul class="uk-navbar-nav">
          {#each navbarlinks as [text, url, target]}
            <li><a href="img/eusuhm_logo_text.svg" target={target} rel='noopener'>{text}</a></li>
          {/each}
        </ul>
      </div>
    </nav>
  </div>
  
  <!-- Spacer -->
  <div class="uk-padding"></div>