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
