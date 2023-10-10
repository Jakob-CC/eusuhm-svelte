import { writable } from 'svelte/store';

export const congressdata = writable({
    'Programme Committee': {
      'BVÖGD': ['Gabriele Ellsäßer', 'Bettina Langenbruch', 'Karlin Stark', 'Gabriele Trost-Brinkhues', 'Andrea Wünsch', 'Claudia Korebrits'],
      'ScolarMed': ['Tina Huber-Gieseke', 'Susanne Stronski'],
      'EUSUHM\'s Executive Committee': ['Noora Seilo', 'Marija Posavec', 'Bernarda Vogrin', 'Zophia Nagy', 'Lineke Dogger']
    },
    'Wissenschaftliche Leitung':
    {   
        name: 'TBD',
        organisation: 'TBD'
    },
    'Certification':
    {
        content:'Certification of the event will be applied for at the Hamburg Medical Association "Ärztekammer Hamburg".'
    },
    'Organisation und Anmeldung':
        {
            company: 'Congress Compact 2C GmbH Congress Compact 2C GmbH',
            contact: 'Gina Braun',
            address: 'Joachimsthaler Straße 31-32, 10719 Berlin',
        },
       
  });