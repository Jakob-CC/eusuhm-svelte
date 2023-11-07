import { writable } from 'svelte/store';

export const congressData = writable({
    // 'Wissenschaftliche Leitung': {   
    //     name: 'TBD',
    //     organisation: 'TBD'
    // },
    
    'Programme Committee': [
        {
            organisation: 'BVÖGD',
            fullname: 'Federal Association of Doctors in the Public Health Service',
            link: 'https://www.bvoegd.de/',
            members: ['Gabriele Ellsäßer', 'Bettina Langenbruch', 'Karlin Stark', 'Gabriele Trost-Brinkhues', 'Andrea Wünsch', 'Claudia Korebrits']
        },
        {
            organisation: 'ScolarMed',
            fullname: 'Swiss Association of Specialists in the School Health Service',
            link: 'https://www.scolarmed.ch/index.php/de/',
            members: ['Tina Huber-Gieseke', 'Susanne Stronski']
        },
        {
            organisation: 'EUSUHM\'s Executive\u00A0Committee',
            fullname: 'European Union for School and University Health and Medicine',
            link: 'https://eusuhm.org/',
            members: ['Noora Seilo', 'Marija Posavec', 'Bernarda Vogrin', 'Zophia Nagy', 'Lineke Dogger']
        },
        {
            organisation: 'DGÖG',
            fullname: 'German Association for\u00A0Public\u00A0Health',
            link: 'https://www.dgoeg.de/',
            members: ['Claudia Korebrits']
        },
        {
            organisation: 'DGSPJ',
            fullname: 'German Association for Social Paediatrics and Youth Medicine',
            link: 'https://www.dgspj.de/',
            members: ['Heidrun Thaiss']
        }
    ],
    'Location': {
        name: 'Oberlinschule',
        address: 'Rudolf-Breitscheid-Straße 24',
        city: '14482 Potsdam',
    },
    'Organiser': {
        company: 'Congress Compact 2C GmbH',
        contact: 'Gina Braun, Anne Klein',
        address: 'Joachimsthaler Straße 31-32, 10719\u00A0Berlin',
        phone: '+49 30 88727370',
        // fax: '+49 30 887273710',
        email: 'info@congress-compact.de',
    },    
    'Certification': {
        // content:'Certification of the event will be applied for at the Hamburg Medical Association, Ärztekammer Hamburg.'
        line1:'The event’s accreditation will be ',
        line2:'recognized by a medical association.'
    },
});
