import { writable } from 'svelte/store';

export const congressdata = writable({
    'Wissenschaftliche Leitung': {   
        name: 'TBD',
        organisation: 'TBD'
    },
    'Certification': {
        // content:'Certification of the event will be applied for at the Hamburg Medical Association, Ärztekammer Hamburg.'
        content:'The event’s accreditation will be recognized by a Medical Association'
    },
    'Programme Committee': [
        {
            organisation: 'BVÖGD',
            members: ['Gabriele Ellsäßer', 'Bettina Langenbruch', 'Karlin Stark', 'Gabriele Trost-Brinkhues', 'Andrea Wünsch', 'Claudia Korebrits']
        },
        {
            organisation: 'ScolarMed',
            members: ['Tina Huber-Gieseke', 'Susanne Stronski']
        },
        {
            organisation: 'EUSUHM\'s Executive Committee',
            members: ['Noora Seilo', 'Marija Posavec', 'Bernarda Vogrin', 'Zophia Nagy', 'Lineke Dogger']
        }
    ],
    'Location': {
        name: 'Oberlinschule',
        address: 'Rudolf-Breitscheid-Straße 24',
        city: '14482 Potsdam',
    },
    'Organiser': {
        company: 'Congress Compact 2C GmbH',
        contact: 'Gina Braun',
        address: 'Joachimsthaler Straße 31-32, 10719 Berlin',
        phone: '+49 30 88727370',
        fax: '+49 30 887273710',
        email: 'info@congress-compact.de',
    },    
});
