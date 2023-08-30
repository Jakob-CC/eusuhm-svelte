<script>
    let hottopics = [
        "Samples of topics",
        "Sustainable Health in Children and Students – Reduce the Gap!",
        "Bridging Health and Education Gaps: Lessons Learnt!",
        "Digital World and Impact on Children’s and Adolescents’ Wellbeing",
        "10 Interactive Rooms* - Take Away Message!",
        
        "Data for Action: Monitoring Health in Children, Adolescents and Students",
        "Intersectoral Interventions: Public Health on Site",
        "School Nurses and Networking",
        "Improving HPV Vaccination in Europe - Lessons Learnt",
        "Vision and Hearing Screening",
        
        
        ];
</script>

<!-- Submit Component -->
<div class="uk-container">
    <h1 class="uk-heading-large uk-padding-large uk-text-center">Submit your abstract here</h1>
    <button class="uk-button uk-button-primary uk-button-large">Submit</button> 
    <h2>Our main topics in 2024</h2>
    <ul class="uk-list uk-list-large">
        {#each hottopics as hottopic}
            <li>{hottopic}</li>
        {/each}
    </ul>

</div> 