import { writable } from 'svelte/store';

export const congressData = writable({
    // 'Wissenschaftliche Leitung': {   
    //     name: 'TBD',
    //     organisation: 'TBD'
    // },
    
    'Programme Committee': [
        {
            organisation: 'BVÖGD',
            fullname: 'Federal Association of Doctors in\u00A0the\u00A0Public Health Service',
            link: 'https://www.bvoegd.de/',
            members: ['Gabriele Ellsäßer', 'Bettina Langenbruch', 'Karlin Stark', 'Gabriele Trost-Brinkhues', 'Andrea Wünsch', 'Claudia Korebrits']
        },
        {
            organisation: 'ScolarMed',
            fullname: 'Swiss Association of Specialists in\u00A0the\u00A0School Health\u00A0Service',
            link: 'https://www.scolarmed.ch/index.php/de/',
            members: ['Tina Huber-Gieseke', 'Susanne Stronski']
        },
        {
            organisation: 'EUSUHM\'s Executive Committee',
            fullname: 'European Union for School and University Health and Medicine',
            link: 'https://eusuhm.org/',
            members: ['Noora Seilo', 'Marija Posavec', 'Bernarda Vogrin', 'Zophia Nagy', 'Lineke Dogger']
        },
        {
            organisation: 'DGÖG',
            fullname: 'German Association for\u00A0Public\u00A0Health\u00A0Service',
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
        contact: 'Gina Braun, Gina Isemann, Anne Klein',
        address: 'Joachimsthaler Straße 31-32', 
        address2: '10719\u00A0Berlin',
        phone: '+49 30 88727370',
        // fax: '+49 30 887273710',
        email: 'info@congress-compact.de',
    },    
    'Certification': {
        // content:'Certification of the event will be applied for at the Hamburg Medical Association, Ärztekammer Hamburg.'
        line1:'The event’s accreditation will be ',
        line2:'recognized by a medical association.'
    },
    // 'Registration Fees': {
    //     cat1: 'members:early bird: 280€, then 300€',
    //     cat2: 'non-members:early bird: 380€, then 400€',
    //     cat3: 'students: early bird: 150€, then 170€',
    //     cat4: 'day_ticket: early bird: 120€, then 140€',
    //     cat5: 'nurses: early bird: 120€, then 140€',
    //     evening: 'evening event: 70€'
    //   },
    'Registration Fees': {
        'Full\u00A0Participant EUSUHM\u00A0Member': { early_bird: 280, regular: 300, late: 330 },
        'Full\u00A0Participant Non\u2011EUSUHM\u00A0Member': { early_bird: 380, regular: 400, late: 430 },
        Student: { early_bird: 150, regular: 170, late: 190 },
        'Daily Ticket': { early_bird: 120, regular: 140, late: 180 },
        //'Daily ticket ': { early_bird: 120, regular: 140, late: 160 },
        'Attendance for the School Nurse Session only': { early_bird: 120, regular: 140, late: 160 },
        'Congress Gala Dinner': { early_bird:70, regular:70, late:70}
    }
});
