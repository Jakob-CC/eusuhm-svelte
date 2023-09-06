<script>
    import { eventSchedule } from './Store.js';
  </script>
  
  <style>
    /* Your existing styles here */
  </style>
  
  <section class="uk-padding uk-margin-xlarge">
    <h1 class="uk-text-center uk-heading-large">Program</h1>
    
    {#each Object.keys($eventSchedule) as day}
      <h3 class="uk-text-center uk-card uk-card-primary">{day}</h3>
      <table class="eus-table uk-margin-large-top">
        {#each $eventSchedule[day] as event, index}
          {#if event.subevent}
            <tr>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td class="eus-subevent eus-subevent-title">{event.subevent}</td>
            </tr>
          {/if}
          <tr>
            <td>{day}</td>
            <td>{event.startTime}</td>
            <td>—</td>
            <td>{event.endTime}</td>
            <td class="{event.subevent ? 'eus-subevent' : ''}">
              {#if Array.isArray(event.event)}
                <div class="eus-triplet eus-subevent">
                  {#each event.event as e}
                    <div class="eus-flex1 eus-subevent">{e}</div>
                  {/each}
                </div>
              {:else}
                {event.event}
              {/if}
            </td>
          </tr>
        {/each}
      </table>
    {/each}
  </section>
  