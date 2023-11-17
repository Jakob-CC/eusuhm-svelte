import { writable } from 'svelte/store';

let eventid = 1381;

const basePath = window.location.origin;
export const navbarlinks = [
  // Name of Link, Hyperlink, Target(self=>same window, blank=>new tab)
  ["Home", `${basePath}/`, "_self"],
  ["About The Congress", `${basePath}/about`, "_self"],
  ["Accomodation", `${basePath}/accomodation`, "_self"],
  ["Registration Fees", `${basePath}/registrationfees`, "_blank"],
  // ["Contact", `${basePath}/#contact`, "_self"],
  // ["Submit", `${basePath}/submit`, "_self"]
];

export const topbuttons = [
  // { label: "3rd to 5th of October 2024", url: "#date" },
  { label: "Registration",       label2:"Opening 15.01.2024",        url: "https://www.congress-compact.de/veranstaltungskalender?anmeldung=" + eventid },
  { label: "Abstract Submission",label2:" Opening 15.01.2024",        url: "/submit"},
  { label: "Programme Overview",    url: "/programme" }
];


export const topics = [
  "Health monitoring and health promotion — data for action",
  "Early childhood interventions — community networking",
  "Mental health and well-being",
  "Special education and health care for children with chronic conditions",
  "Inclusion of children with chronic health conditions in schools: collaboration of the health and education sector",
  "Health promotion efforts at universities",
  "Qualification of school doctors and school nurses",
  "Improving public health action in educational settings by enhancing networking"
];

export const objectives = [
  "Exchange of Evidence",
  "Exchange of Experiences",
  "Showcase Best Practices"
];

export const euscolors = [
  'rgb(23, 207, 100)',
  '#F29B74',
  '#F3FB34',
  // darker shades
  'rgb(0, 129, 54)',
];


export const interactiveRooms = writable([
  "Health Monitoring and Health Promotion - Data for Action",
  "Early Childhood and Early Support",
  "Inclusion of Children with Chronic Health Conditions in Schools: Collaboration Between the Education and Health Sector",
  "Special Education and Health Care for Children with Chronic conditions",
  "Mental Health and Wellbeing in Adolescents and\u00A0Students",
  "School Absenteeism – Cooperation Needs between the Educational and Health Sector",
  "Health Promotion Projects in Schools – Sharing Experience on the Ground",
  "School Health Services in Europe: Guidelines, Researches, Challenges",
  "Health Promotion in Students at Universities",
  "Qualification of School Doctors and School Nurses - Guidelines, Curricula",
]);

export const hottopics = writable ([
  "Sustainable Health in Children and Students – Reduce the Gap!",
  "Bridging Health and Education Gaps: Lessons Learnt!",
  "Digital World and Impact on Children’s and Adolescents’ Wellbeing",
  "Data for Action: Monitoring Health in Children, Adolescents and\u00A0Students",
  "Intersectoral Interventions: Public Health on Site",
  "School Nurses and Networking",
  "Improving HPV Vaccination in Europe",
  "Vision and Hearing Screening",
  "Sexuality, Diversity, Puberty",
  "Inclusion of Children with Chronic Health Conditions: Models of Good Practice",
  ]);

export const eventSchedule = writable({
// export const eventSchedule = {
  'Thursday': [
    {
      startTime: 'from',
      endTime: '1:00',
      event: 'Welcome Reception'
    },

    {
      startTime: '2:00',
      endTime: '3:30',
      event: 'Opening Session'
    },
    {
      startTime: '3:30',
      endTime: '4:00',
      event: 'Coffee Break'
    },
    {
      startTime: '4:00',
      endTime: '6:00',
      event: 'Plenary Session',
      plenary: true,
    },
    {
      startTime: '4:00',
      endTime: '5:30',
      event: 'Sustainable Health in Children and Students – Reduce the Gap!',
      plenary: true,
    },
    {
      startTime: '5:30',
      endTime: '6:00',
      event: 'Panel Discussion: Lessons Learnt for Acting on the Ground',
      plenary: true,
    },
    {
      startTime: '6:00',
      endTime: '7:00',
      event: 'Break'
    },
    {
      startTime: '7:00',
      endTime: '9:00',
      event: 'Get Together' // Reithalle Schiffsbauergasse'
    }
  ],
  'Friday': [
    {
      startTime: '8:00',
      endTime: '9:00',
      event: 'Pitch Poster Presentations'
    },
    {
      startTime: '9:00',
      endTime: '9:30',
      event: 'Coffee Break'
    },
    {
      startTime: '9:30',
      endTime: '11:00',
      subevent:'Parallel Sessions',
      event: [
        'Data for Action Monitoring Health in\u00A0Children, Adolescents and\u00A0Students',
        'Intersectoral Interventions: Public\u00A0Health on Site',
        'School Nurses and Networking (GE)'
      ]
    },
    {
      startTime: '11:00',
      endTime: '11:30',
      event: 'Coffee Break'
    },
    {
      startTime: '11:30',
      endTime: '1:00',
      subevent: '10 Interactive Rooms  ',
      event: 'Bridging Health and Education Gaps: Lessons Learnt!',
    },
    {
      startTime: '1:00',
      endTime: '2:00',
      event: 'Lunch Break'
    },
    {
      startTime: '1:00',
      endTime: '1:45',
      subevent: "Pharma Symposium",
      event: [
        'Improving HPV Vaccination in Europe',
        'Vision and Hearing Screening'
      ]
    },
    {
      startTime: '2:00',
      endTime: '3:30',
      subevent: 'Plenary Session',
      event: 'Digital World and Impact on Children’s and Adolescents’ Wellbeing',
      plenary: true,
    },
    {
      startTime: '3:30',
      endTime: '4:00',
      event: 'Coffee Break'
    },
    {
      startTime: '4:00',
      endTime: '5:30',
      subevent: '10 Interactive Rooms  ',
      event: 'Sharing Experience - Take Away Messages'
    },
    {
      startTime: '5:45',
      endTime: '7:00',
      event: 'General Assembly'
    },
    {
      startTime: '8:00',
      endTime: '11:00',
      event: 'Gala Dinner',
    },
  ],
  'Saturday': [
    {
      startTime: '8:00',
      endTime: '9:30',
      subevent: 'Early Bird Pharma Symposium',
      event: ['ADHD', 'New Vaccines']
    },
    {
      startTime: '9:30',
      endTime: '10:00',
      event: 'Coffee Break'
    },
    {
      startTime: '10:00',
      endTime: '11:30',
      subevent: 'Parallel Sessions',
      event: ['Inclusion of Children with Chronic Health Conditions: Models of Good Practice', 'Sexuality, Diversity, Puberty']
    },
    {
      startTime: '11:30',
      endTime: '12:00',
      event: 'Coffee Break'
    },
    {
      startTime: '12:00',
      endTime: '1:15',
      event: 'Lessons Learnt to Reduce the Health and Educational Gap in Children and Students - Moderators\u00A0Wrap\u00A0Up',
      subevent: 'Plenary Session',
      plenary: true,
    },
    {
      startTime: '1:15',
      endTime: '1:30',
      event: 'Coffee Break'
    },
    {
      startTime: '1:30',
      endTime: '2:30',
      event: 'Think Globally, Act Locally',
      subevent: 'Closing Session',
    },
    {
      startTime: '2:30',
      endTime: '3:00', // Or some other arbitrary close time, just to signify the end
      event: 'Farewell'
    }
  ]
});

