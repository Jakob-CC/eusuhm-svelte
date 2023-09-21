import { writable } from 'svelte/store';

const basePath = window.location.origin;
export const navbarlinks = [
  ["Home", `${basePath}/`, "_self"],
  ["About The Congress", `${basePath}/#about`, "_self"],
  ["Accomodation", `${basePath}/accomodation`, "_self"],
  // ["Contact", `${basePath}/#contact`, "_self"],
  // ["Submit", `${basePath}/submit`, "_self"]
];

export const topbuttons = [
  // { label: "3rd to 5th of October 2024", url: "#date" },
  { label: "Registration",        url: "/registration" },
  { label: "Abstract Submission", url: "/submit" },
  { label: "Program Overview",    url: "/submit#program" }
];


export const topics = [
  "Health monitoring and health promotion — data for action",
  "Early childhood interventions — community networking",
  "Mental health and well-being",
  "Special education and health care for children with chronic conditions",
  "Inclusion of children with chronic health conditions in schools: collaboration of the health and education sector",
  "Health promotion efforts at universities",
  "Qualification of school doctors and school nurses",
  "Improving Public Health Action in educational settings by enhancing networking"
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

export const eventSchedule = writable({
// export const eventSchedule = {
  'Thursday': [
    {
      startTime: '1:00',
      endTime: 'End',
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
      event: 'Plenary Session'
    },
    {
      startTime: '4:00',
      endTime: '5:30',
      event: 'Sustainable Health in Children and Students – Reduce the Gap!'
    },
    {
      startTime: '5:30',
      endTime: '6:00',
      event: 'Panel Discussion: Lessons Learnt for Acting on the Ground'
    },
    {
      startTime: '6:00',
      endTime: '7:00',
      event: 'Break'
    },
    {
      startTime: '7:00',
      endTime: '9:00',
      event: 'Get Together: Reithalle Schiffsbauergasse'
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
        'Data for Action Monitoring Health in Children, Adolescents, and Students',
        'Intersectoral Interventions: Public Health on Site',
        'School Nurses and Networking (GE/EN)'
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
      subevent: '10 Interactive Rooms (Rotation after 40 min) Topics',
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
        'Improving HPV Vaccination in Europe - Lessons Learnt',
        'Vision and Hearing Screening'
      ]
    },
    {
      startTime: '2:00',
      endTime: '3:30',
      subevent: 'Plenary Session',
      event: 'Digital World and Impact on Children’s and Adolescents’ Wellbeing'
    },
    {
      startTime: '3:30',
      endTime: '4:00',
      event: 'Coffee Break'
    },
    {
      startTime: '4:30',
      endTime: '6:00',
      subevent: '10 Interactive Rooms (Rotation after 40 min) Topics',
      event: 'Sharing Experience -Take Away Messages'
    },
    {
      startTime: '6:00',
      endTime: '7:00',
      event: 'General Assembly'
    },
    {
      startTime: '7:00',
      endTime: '8:00',
      event: 'Break'
    },
    {
      startTime: '8:00',
      endTime: '11:00',
      event: 'Gala Dinner',
    },
  ],
  'Saturday': [
    {
      startTime: '9:00',
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
      startTime: '9:00',
      endTime: '11:30',
      subevent: 'Parallel Sessions',
      event: ['Inclusion of Children with Chronic Health Conditions: Models of Good Practice', 'Gender Dysphoria']
    },
    {
      startTime: '11:30',
      endTime: '12:00',
      event: 'Coffee Break'
    },
    {
      startTime: '12:00',
      endTime: '1:15',
      event: 'Lessons Learnt to Reduce the Health and Educational Gap in Children and Students - Moderators Wrap Up'
    },
    {
      startTime: '1:15',
      endTime: '1:30',
      event: 'Coffee Break'
    },
    {
      startTime: '1:30',
      endTime: '2:30',
      event: 'Closing Session: Think Globally, Act Locally'
    },
    {
      startTime: '2:30',
      endTime: '3:00', // Or some other arbitrary close time, just to signify the end
      event: 'Farewell'
    }
  ]
});
