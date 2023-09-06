const basePath = window.location.origin;
export const navbarlinks = [
  ["Home", `${basePath}/`, "_self"],
  ["About", `${basePath}/#about`, "_self"],
  ["EUSUHM", "https://www.eusuhm.org", "_blank"],
  ["Contact", `${basePath}/#contact`, "_self"],
  ["Submit", `${basePath}/submit`, "_self"]
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

export const eventSchedule = {
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
      subevent:'3 Parallel Sessions',
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
      startTime: "",
      endTime: "",
      event: "Pharma Symposium"},
    {
      startTime: '1:00',
      endTime: '1:45',
      event: [
        'Improving HPV Vaccination in Europe - Lessons Learnt',
        'Vision and Hearing Screening'
      ]
    },
    {
      startTime: '2:00',
      endTime: '3:30',
      event: 'Plenary Session'
    },
    {
      startTime: '3:30',
      endTime: '4:00',
      event: 'Coffee Break'
    },
    {
      startTime: '4:30',
      endTime: '6:00',
      event: '10 Interactive Rooms (Rotation after 40 min) Topics'
    },
    {
      startTime: '6:00',
      endTime: '7:00',
      event: 'General Assembly'
    }
  ],
  'Saturday': [
    {
      startTime: '8:30',
      endTime: '9:15',
      event: 'Early Bird Pharma Symposium'
    },
    {
      startTime: '9:00',
      endTime: '9:30',
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
      endTime: '2:31', // Or some other arbitrary close time, just to signify the end
      event: 'Farewell'
    }
  ]
};
