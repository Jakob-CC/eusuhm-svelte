<script>
  import { each } from 'svelte/internal';
    import { euscolors, eventSchedule, interactiveRooms } from './Store.js';
  </script>

<main class="uk-container">

  <section id="Programme" class="uk-padding uk-margin-xlarge">
    <h1 class="uk-text-center uk-heading-large">Programme</h1>
    


    {#each Object.keys($eventSchedule) as day}
      <h3 class="uk-text-center uk-card uk-card-primary">{day}</h3>
      <table class="eus-table uk-margin-large-top">
        {#each $eventSchedule[day] as event, index}
          
        
          {#if event.subevent}
              
        
              <!-- Mit extra Regel für Plenary Session -->
              <tr class=" 
                          eus-subevent-row
                          {typeof event.subevent === 'string' && event.subevent.toLowerCase().includes('plenary') ? 'plenary' : ''}
              ">
              <td class="no-border "></td>
              <td class="no-border ">{event.startTime}</td>
              <td class="no-border ">&HorizontalLine;</td>
              <td class="no-border ">{event.endTime}</td>
  
              <td class="eus-subevent eus-subevent-title no-border">
                <!-- Extra Regel für Interactive Rooms -->
                {#if typeof event.subevent === 'string' && event.subevent.toLowerCase().includes('interactive rooms')}
                  {event.subevent} <a href="#interactiverooms" class="uk-text-small"> Rotation&nbsp;after&nbsp;40&nbsp;min &ndash; More&nbsp;Information</a> 
                {:else}
                  {event.subevent}
                {/if}
              </td>
              
            </tr>

          {/if}
          <!-- Mit extra Regel für Plenary Session (Dopplung) -->
          <tr class="
                <!-- Klasse für Titel von parallelen Veranstaltungen -->
                {event.subevent ? 'eus-subevent-row' : ''}
                <!-- Sonderregel für Plenary Session (Anderer Hintergrund) -->
                {event.plenary ? 'plenary' : ''}
          ">

          <!-- Datum -->
            <!-- Wenn Unterkategorie, dann Zeit ausblenden -->
            {#if event.subevent}
              <!-- Tabellenzellen für Zeiten leer lassen -->
              {#each Array(4) as _}
                 <!-- content here -->
                 <td></td>
              {/each}
            {:else if event.plenary}
              <td class="no-border">{day}</td>
              <td class="no-border">{event.startTime}</td>
              <td class="no-border">&HorizontalLine;</td>
              <td class="no-border">{event.endTime}</td>
            {:else}
              <td>{day}</td>
              <td>{event.startTime}</td>
                <!-- Den Bindestrich bei den Zeiten wegnehmen bei dem ersten Eintrag -->
                {#if event.event.includes('Welcome')}
                    <td></td>
                {:else}
                    <td>&HorizontalLine;</td>
                {/if}
              <td>{event.endTime}</td>
            {/if}
          
          <!-- Titel -->
            <td class="
              <!-- Subevent formatting -->
              {event.subevent ? 'eus-subevent' : ''}
              <!-- Plenary Session Titling -->
              {event.event.includes('Plenary') ? 'eus-subevent-title' : ''}
              <!-- Break formatting -->
              {typeof event.event === 'string' && event.event.toLowerCase().includes('break') ? 'eus-Programmebreak' : ''}
            ">
          <!-- Prüfen, ob mehrere Veranstaltungen parallel sind -->
              {#if Array.isArray(event.event)}
                <div class="eus-triplet eus-subevent">
                  {#each event.event as e}
                    <div class="eus-flex1 eus-subevent">{e}</div>
                  {/each}
                </div>
          <!-- Wenn nicht parallel, dann einfach Titel schreiben -->
              {:else}
                {event.event}
              {/if}
            </td>
          </tr>
        {/each}
      </table>
    {/each}




  </section>
  <section id="interactiverooms" class="uk-padding uk-margin-xlarge">
    <h1 class="uk-text-center uk-heading-large">Interactive Rooms</h1>
    <h3>Bridging Health and Education Gaps: Lessons Learnt
    </h3>
      <p>Friday: 11:30&hairsp;&hairsp;&ndash;&hairsp;1:00 and 4:30&hairsp;&hairsp;&ndash;&hairsp;6:00
       <br> Rotation after 40 Minutes</p>
    <!-- Card Grid -->
    <div class="uk-grid uk-grid-small uk-child-width-1-2@s uk-child-width-1-3@m uk-text-center uk-grid-match uk-margin-large-top" uk-grid>
        {#each $interactiveRooms as room, i}
        <!-- {#each $hottopics as topic, i} -->
          <div class="eus-clip">
            <div style="background-color:{euscolors[ (2+i) % (euscolors.length-1) ]}; color: black;" 
                class="eus-height-100 uk-card uk-card-hover uk-card-body uk-card-small uk-flex uk-flex-middle uk-flex-center">
              <p class="eus-text-large uk-margin-remove">{room}</p>
            </div>
          </div>
        {/each}
      </div>
  </section>

</main>