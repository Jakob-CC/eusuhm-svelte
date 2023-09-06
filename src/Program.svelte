<script>
    import { eventSchedule } from './Store.js';
  
    function generateRow(day, event) {
      let subeventHtml = event.subevent ? `
        <tr >
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td class="eus-subevent">${event.subevent}</td>
        </tr>
        ` : '';

      if (Array.isArray(event.event)) {
        // It's a parallel session
        return `
          ${subeventHtml}
          <tr>
            <td>${day}</td>
            <td>${event.startTime}</td>
            <td>—</td>
            <td>${event.endTime}</td>
            <td class="eus-triplet">
              ${event.event.map(e => `<div class="eus-flex1 eus-subevent">${e}</div>`).join('')}
            </td>
          </tr>
        `;
      } else {
        // It's a single event
        return `
        ${subeventHtml}
        <tr>
            <td>${day}</td>
            <td>${event.startTime}</td>
            <td>—</td>
            <td>${event.endTime}</td>
            <td>${event.event}</td>
        </tr>
        `;
      }
    }
  </script>



<section class="uk-padding uk-margin-xlarge">
  <h1 class="uk-text-center uk-heading-large">Program</h1>
  
  {#each Object.keys(eventSchedule) as day}
    <h3 class="uk-text-center uk-card uk-card-primary">{day}</h3>
    <table class="eus-table uk-margin-large-top">
      {@html eventSchedule[day].map(event => generateRow(day, event)).join('')}
    </table>
  {/each}
</section>

<!-- Programm -->
<section class="uk-padding uk-margin-xlarge">

    <h1 class="uk-text-center uk-heading-large">Program</h1>
    
    <h3 class="uk-text-center uk-card uk-card-primary">Friday</h3>
    <table class="eus-table uk-margin-large-top">

      <tr>
        <td>Friday</td>
        <td>8:00</td>
        <td>—</td>
        <td>9:00</td>

        <td style="colspan:3;">Pitch Poster Presentations</td>
      </tr>
      <tr>
        <td>Friday</td>
        <td>9:00</td>
        <td>—</td>
        <td>9:30</td>
        
        <td>Coffee Break</td>
      </tr>

      <tr>
        <td>Friday</td>
        <td>9:30</td>
        <td>—</td>
        <td>11:00</td>
        
        <td class="eus-triplet">
          <div class="eus-flex1">Data for Action Monitoring Health in Children, Adolescents, and Students</div>
          <div class="eus-flex1">Intersectoral Interventions: Public Health on Site</div>
          <div class="eus-flex1">School Nurses and Networking (GE/EN)</div>
        </td>
      </tr>
      
      <tr>
        <td>Friday</td>
        <td>11:00</td>
        <td>—</td>
        <td>11:30</td>

        <td>Coffee Break</td>
      </tr>
    </table>
  </section>
  <!-- Ende Program -->