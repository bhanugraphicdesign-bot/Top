export type AcademyRole = 'website' | 'student' | 'teacher' | 'admin';

export interface CourseSyllabusUnit {
  unitHi: string;
  unitEn: string;
  topicsHi: string[];
  topicsEn: string[];
}

export interface CourseTimetableSlot {
  dayHi: string;
  dayEn: string;
  slotHi: string;
  slotEn: string;
}

export interface AcademyCourse {
  id: string;
  code: string;
  nameHi: string;
  nameEn: string;
  targetHi: string;
  targetEn: string;
  durationHi: string;
  durationEn: string;
  modeHi: string;
  modeEn: string;
  sampleFee: number;
  materialFee: number;
  image: string;
  summaryHi: string;
  summaryEn: string;
  syllabus: CourseSyllabusUnit[];
  timetable: CourseTimetableSlot[];
}

export interface UpcomingBatch {
  id: string;
  courseId: string;
  nameHi: string;
  nameEn: string;
  startDateHi: string;
  startDateEn: string;
  timingHi: string;
  timingEn: string;
  modeHi: string;
  modeEn: string;
  seatsLeft: number;
}

export interface CampusFacility {
  id: string;
  titleHi: string;
  titleEn: string;
  descHi: string;
  descEn: string;
  image: string;
}

export interface McqQuestion {
  id: string;
  subject: 'physics' | 'chemistry' | 'maths';
  subjectHi: string;
  subjectEn: string;
  questionHi: string;
  questionEn: string;
  optionsHi: string[];
  optionsEn: string[];
  correctIndex: number;
  explanationHi: string;
  explanationEn: string;
}

export interface FaqItem {
  id: string;
  qHi: string;
  qEn: string;
  aHi: string;
  aEn: string;
}

export interface VideoLecture {
  id: string;
  titleHi: string;
  titleEn: string;
  subjectHi: string;
  subjectEn: string;
  durationHi: string;
  durationEn: string;
  facultyHi: string;
  facultyEn: string;
  thumbnail: string;
}

export interface StudyNote {
  id: string;
  titleHi: string;
  titleEn: string;
  subjectHi: string;
  subjectEn: string;
  pages: number;
  updatedHi: string;
  updatedEn: string;
}

export interface DoubtItem {
  id: string;
  studentHi: string;
  studentEn: string;
  batchHi: string;
  batchEn: string;
  subjectHi: string;
  subjectEn: string;
  questionHi: string;
  questionEn: string;
  timeHi: string;
  timeEn: string;
  reply?: string;
}

export interface HomeworkItem {
  id: string;
  subjectHi: string;
  subjectEn: string;
  type: 'homework' | 'test';
  dueDate: string;
  prompt: string;
  batchHi: string;
  batchEn: string;
}

export type InquiryStatus = 'new' | 'called' | 'admitted';

export interface AdmissionInquiry {
  id: string;
  name: string;
  studentClass: string;
  courseId: string;
  mobile: string;
  dateHi: string;
  dateEn: string;
  status: InquiryStatus;
}

export interface AttendanceStudent {
  id: string;
  rollNo: string;
  nameHi: string;
  nameEn: string;
  batchId: string;
}

export interface AcademyNotice {
  id: string;
  titleHi: string;
  titleEn: string;
  bodyHi: string;
  bodyEn: string;
  audienceHi: string;
  audienceEn: string;
  dateHi: string;
  dateEn: string;
}

export interface PlatformFeatureItem {
  id: string;
  titleHi: string;
  titleEn: string;
  descHi: string;
  descEn: string;
}

export interface DemoPackageTier {
  id: string;
  nameHi: string;
  nameEn: string;
  price: string;
  audienceHi: string;
  audienceEn: string;
  featured?: boolean;
  pointsHi: string[];
  pointsEn: string[];
}

export const VIDYA_IMAGES = {
  hero: '/demo/vidya-shikhar/hero.jpg',
  smartboard: '/demo/vidya-shikhar/classroom-smartboard.jpg',
  library: '/demo/vidya-shikhar/library.jpg',
  onlineClass: '/demo/vidya-shikhar/online-class.jpg',
  testHall: '/demo/vidya-shikhar/test-hall.jpg',
  doubtSession: '/demo/vidya-shikhar/doubt-session.jpg',
  courseJee: '/demo/vidya-shikhar/course-jee.jpg',
  courseNeet: '/demo/vidya-shikhar/course-neet.jpg',
  courseFoundation: '/demo/vidya-shikhar/course-foundation.jpg',
  courseGovt: '/demo/vidya-shikhar/course-govt-exams.jpg',
  parentCounselling: '/demo/vidya-shikhar/parent-counselling.jpg',
} as const;

export const HERO_SLIDES = [
  {
    id: 'campus',
    image: VIDYA_IMAGES.hero,
    kickerHi: 'सही मार्गदर्शन, मज़बूत तैयारी · नमूना संस्थान प्लेटफ़ॉर्म',
    kickerEn: 'Right Guidance, Strong Preparation · Sample Institute Platform',
    titleHi: 'अपने लक्ष्य की तैयारी सही दिशा में',
    titleEn: 'Prepare for Your Goal in the Right Direction',
    subtitleHi:
      'संरचित पाठ्यक्रम, नियमित अभ्यास टेस्ट, व्यक्तिगत डाउट समाधान और अभिभावक रिपोर्ट के साथ आधुनिक कोचिंग व्यवस्था।',
    subtitleEn:
      'Structured curricula, regular practice tests, dedicated doubt resolution, and parent progress updates in one academic platform.',
  },
  {
    id: 'smartboard',
    image: VIDYA_IMAGES.smartboard,
    kickerHi: 'इंटरैक्टिव स्मार्ट क्लासरूम · अनुशासित शिक्षण',
    kickerEn: 'Interactive Smart Classrooms · Structured Teaching',
    titleHi: 'संकल्पना से अभ्यास तक स्पष्ट मार्गदर्शन',
    titleEn: 'Clear Mentorship From Concept to Practice',
    subtitleHi:
      'डिजिटल स्मार्टबोर्ड लेक्चर, दैनिक अभ्यास शीट (DPP) और साप्ताहिक पुनरावृत्ति सत्र।',
    subtitleEn:
      'Digital smartboard lectures, daily practice sheets, and weekly concept revision sessions.',
  },
  {
    id: 'online',
    image: VIDYA_IMAGES.onlineClass,
    kickerHi: 'हाइब्रिड और ऑनलाइन लाइव क्लास · कहीं से भी पढ़ाई',
    kickerEn: 'Hybrid & Online Live Classes · Learn From Anywhere',
    titleHi: 'ऑफ़लाइन और ऑनलाइन तैयारी का संतुलित संगम',
    titleEn: 'Balanced Offline and Online Preparation',
    subtitleHi:
      'लाइव इंटरैक्टिव कक्षाएँ, रिकॉर्डेड रिविज़न लेक्चर, डिजिटल नोट्स और कंप्यूटर-आधारित मॉक टेस्ट।',
    subtitleEn:
      'Live interactive classes, recorded revision lectures, structured digital notes, and computer-based mock tests.',
  },
];

export const ACADEMY_COURSES: AcademyCourse[] = [
  {
    id: 'jee',
    code: 'JEE-2026',
    nameHi: 'JEE (मेन एवं एडवांस्ड)',
    nameEn: 'JEE (Main & Advanced)',
    targetHi: 'कक्षा 11, 12 एवं ड्रॉपर छात्रों के लिए',
    targetEn: 'For Class 11, 12 & Dropper Students',
    durationHi: '1 वर्ष / 2 वर्ष',
    durationEn: '1 Year / 2 Years',
    modeHi: 'ऑफ़लाइन / ऑनलाइन',
    modeEn: 'Offline / Online',
    sampleFee: 78000,
    materialFee: 6000,
    image: VIDYA_IMAGES.courseJee,
    summaryHi:
      'भौतिकी, रसायन और गणित के मूल सिद्धांतों से लेकर एडवांस्ड समस्या-समाधान और CBT मॉक टेस्ट अभ्यास।',
    summaryEn:
      'Conceptual Physics, Chemistry, and Mathematics modules paired with problem-solving workshops and CBT mock tests.',
    syllabus: [
      {
        unitHi: 'भौतिक विज्ञान (Physics)',
        unitEn: 'Physics Core Modules',
        topicsHi: ['यांत्रिकी एवं घूर्णन गति', 'विद्युतचुंबकत्व और परिपथ', 'प्रकाशिकी एवं आधुनिक भौतिकी'],
        topicsEn: ['Mechanics & Rotational Motion', 'Electromagnetism & Circuits', 'Optics & Modern Physics'],
      },
      {
        unitHi: 'रसायन विज्ञान (Chemistry)',
        unitEn: 'Chemistry Core Modules',
        topicsHi: ['भौतिक रसायन व ऊष्मागतिकी', 'कार्बनिक अभिक्रिया तंत्र', 'अकार्बनिक आवर्त सारणी एवं उपसहसंयोजन'],
        topicsEn: ['Physical Chemistry & Thermodynamics', 'Organic Reaction Mechanisms', 'Inorganic Periodicity & Coordination'],
      },
      {
        unitHi: 'गणित (Mathematics)',
        unitEn: 'Mathematics Core Modules',
        topicsHi: ['कलन (Calculus) व फलन', 'निर्देशांक ज्यामिति और सदिश', 'बीजगणित, आव्यूह और प्रायिकता'],
        topicsEn: ['Calculus & Functions', 'Coordinate Geometry & Vectors', 'Algebra, Matrices & Probability'],
      },
    ],
    timetable: [
      { dayHi: 'सोम – बुध', dayEn: 'Mon – Wed', slotHi: 'भौतिकी व गणित (सुबह 8:00 – 11:30)', slotEn: 'Physics & Maths (8:00 – 11:30 AM)' },
      { dayHi: 'गुरु – शुक्र', dayEn: 'Thu – Fri', slotHi: 'रसायन व अभ्यास सत्र (सुबह 8:00 – 11:30)', slotEn: 'Chemistry & Problem Lab (8:00 – 11:30 AM)' },
      { dayHi: 'शनिवार', dayEn: 'Saturday', slotHi: 'डाउट क्लियरिंग व रिविज़न (सुबह 9:00 – 12:00)', slotEn: 'Doubt Clearing & Revision (9:00 AM – 12:00 PM)' },
      { dayHi: 'रविवार', dayEn: 'Sunday', slotHi: 'CBT पैटर्न साप्ताहिक टेस्ट (सुबह 9:30)', slotEn: 'CBT Pattern Weekly Test (9:30 AM)' },
    ],
  },
  {
    id: 'neet',
    code: 'NEET-2026',
    nameHi: 'NEET (UG मेडिकल प्रवेश)',
    nameEn: 'NEET (UG Medical Entrance)',
    targetHi: 'कक्षा 11, 12 एवं रिपीटर छात्रों के लिए',
    targetEn: 'For Class 11, 12 & Repeater Students',
    durationHi: '1 वर्ष / 2 वर्ष',
    durationEn: '1 Year / 2 Years',
    modeHi: 'ऑफ़लाइन / ऑनलाइन',
    modeEn: 'Offline / Online',
    sampleFee: 72000,
    materialFee: 5500,
    image: VIDYA_IMAGES.courseNeet,
    summaryHi:
      'NCERT-आधारित जीवविज्ञान, भौतिकी और रसायन की गहन तैयारी के साथ नियमित OMR व समयबद्ध टेस्ट अभ्यास।',
    summaryEn:
      'NCERT-aligned Biology, Physics, and Chemistry instruction supported by timed OMR practice tests and error analysis.',
    syllabus: [
      {
        unitHi: 'जीवविज्ञान (Botany & Zoology)',
        unitEn: 'Biology (Botany & Zoology)',
        topicsHi: ['कोशिका संरचना एवं आनुवंशिकी', 'मानव शरीर क्रिया विज्ञान', 'पादप कार्यिकी एवं पारिस्थितिकी'],
        topicsEn: ['Cell Structure & Genetics', 'Human Physiology', 'Plant Physiology & Ecology'],
      },
      {
        unitHi: 'रसायन विज्ञान (NCERT केंद्रित)',
        unitEn: 'Chemistry (NCERT Focused)',
        topicsHi: ['रासायनिक आबंधन और साम्य', 'जैव-अणु एवं कार्बनिक रसायन', 'इलेक्ट्रोकेमिस्ट्री और काइनेटिक्स'],
        topicsEn: ['Chemical Bonding & Equilibrium', 'Biomolecules & Organic Chemistry', 'Electrochemistry & Kinetics'],
      },
      {
        unitHi: 'भौतिक विज्ञान (संकल्पनात्मक)',
        unitEn: 'Physics (Conceptual & Numerical)',
        topicsHi: ['गति के नियम एवं कार्य-ऊर्जा', 'विद्युत धारा और चुंबकत्व', 'किरण प्रकाशिकी व अर्धचालक'],
        topicsEn: ['Laws of Motion & Work-Energy', 'Current Electricity & Magnetism', 'Ray Optics & Semiconductors'],
      },
    ],
    timetable: [
      { dayHi: 'सोम – बुध', dayEn: 'Mon – Wed', slotHi: 'जीवविज्ञान व भौतिकी (दोपहर 2:30 – 6:00)', slotEn: 'Biology & Physics (2:30 – 6:00 PM)' },
      { dayHi: 'गुरु – शुक्र', dayEn: 'Thu – Fri', slotHi: 'रसायन व NCERT लाइन-बाय-लाइन अभ्यास', slotEn: 'Chemistry & NCERT Line-by-Line Review' },
      { dayHi: 'शनिवार', dayEn: 'Saturday', slotHi: 'व्यक्तिगत डाउट डेस्क (दोपहर 3:00 – 5:30)', slotEn: 'Personal Doubt Desk (3:00 – 5:30 PM)' },
      { dayHi: 'रविवार', dayEn: 'Sunday', slotHi: 'पूर्ण-सिलेबस / पार्ट OMR टेस्ट', slotEn: 'Full / Part Syllabus OMR Practice Test' },
    ],
  },
  {
    id: 'foundation',
    code: 'FND-810',
    nameHi: 'फ़ाउंडेशन (कक्षा 8–10)',
    nameEn: 'Foundation (Class 8–10)',
    targetHi: 'स्कूल बोर्ड + ओलंपियाड व प्रारंभिक नींव',
    targetEn: 'School Boards + Olympiad & Early STEM Base',
    durationHi: '10 माह प्रति सत्र',
    durationEn: '10 Months per Session',
    modeHi: 'ऑफ़लाइन / ऑनलाइन',
    modeEn: 'Offline / Online',
    sampleFee: 36000,
    materialFee: 3500,
    image: VIDYA_IMAGES.courseFoundation,
    summaryHi:
      'स्कूल परीक्षाओं के साथ गणित, विज्ञान और तार्किक क्षमता की मज़बूत आधारशिला तैयार करने वाला कार्यक्रम।',
    summaryEn:
      'Strong conceptual grounding in Mathematics, Science, and Mental Ability aligned with school boards and Olympiads.',
    syllabus: [
      {
        unitHi: 'गणित एवं तार्किक योग्यता',
        unitEn: 'Mathematics & Mental Ability',
        topicsHi: ['बीजगणित, ज्यामिति और त्रिकोणमिति', 'संख्या पद्धति एवं तार्किक पहेलियाँ', 'ओलंपियाड स्तर अभ्यास प्रश्न'],
        topicsEn: ['Algebra, Geometry & Trigonometry', 'Number Systems & Logical Puzzles', 'Olympiad Practice Sets'],
      },
      {
        unitHi: 'विज्ञान (भौतिकी, रसायन, जीव)',
        unitEn: 'Integrated Science',
        topicsHi: ['बल, प्रकाश और विद्युत मूल बातें', 'अम्ल-क्षार, धातु और कार्बन यौगिक', 'जीवन प्रक्रियाएँ और पर्यावरण'],
        topicsEn: ['Force, Light & Basic Electricity', 'Acids-Bases, Metals & Carbon', 'Life Processes & Environment'],
      },
    ],
    timetable: [
      { dayHi: 'सोम – गुरु', dayEn: 'Mon – Thu', slotHi: 'गणित व विज्ञान (शाम 4:30 – 6:30)', slotEn: 'Maths & Science (4:30 – 6:30 PM)' },
      { dayHi: 'शुक्रवार', dayEn: 'Friday', slotHi: 'मेंटल एबिलिटी व प्रोजेक्ट वर्कशॉप', slotEn: 'Mental Ability & Activity Workshop' },
      { dayHi: 'शनिवार', dayEn: 'Saturday', slotHi: 'साप्ताहिक यूनिट क्विज़ व पेरेंट अपडेट', slotEn: 'Weekly Unit Quiz & Parent Update' },
    ],
  },
  {
    id: 'govt',
    code: 'GOV-2026',
    nameHi: 'सरकारी परीक्षाएँ (SSC / बैंकिंग / राज्य)',
    nameEn: 'Government Exams (SSC / Banking / State)',
    targetHi: 'स्नातक एवं 12वीं उत्तीर्ण अभ्यर्थियों के लिए',
    targetEn: 'For Graduates & 12th-Pass Aspirants',
    durationHi: '8 माह / 12 माह',
    durationEn: '8 Months / 12 Months',
    modeHi: 'ऑफ़लाइन / ऑनलाइन',
    modeEn: 'Offline / Online',
    sampleFee: 24000,
    materialFee: 2500,
    image: VIDYA_IMAGES.courseGovt,
    summaryHi:
      'मात्रात्मक अभियोग्यता, रीज़निंग, सामान्य अध्ययन, करंट अफ़ेयर्स और स्पीड टेस्ट अभ्यास का पूर्ण पाठ्यक्रम।',
    summaryEn:
      'Comprehensive preparation for Quantitative Aptitude, Reasoning, General Studies, Current Affairs, and timed speed tests.',
    syllabus: [
      {
        unitHi: 'गणित एवं रीज़निंग',
        unitEn: 'Quantitative Aptitude & Reasoning',
        topicsHi: ['अंकगणित, डेटा इंटरप्रिटेशन', 'वर्बल व नॉन-वर्बल रीज़निंग', 'समय प्रबंधन और शॉर्टकट अभ्यास'],
        topicsEn: ['Arithmetic & Data Interpretation', 'Verbal & Non-Verbal Reasoning', 'Speed & Time-Management Drills'],
      },
      {
        unitHi: 'सामान्य अध्ययन, हिन्दी व अंग्रेज़ी',
        unitEn: 'General Studies & Languages',
        topicsHi: ['भारतीय संविधान, भूगोल और इतिहास', 'मासिक करंट अफ़ेयर्स संकलन', 'व्याकरण एवं अपठित गद्यांश'],
        topicsEn: ['Indian Polity, Geography & History', 'Monthly Current Affairs Digest', 'Grammar & Reading Comprehension'],
      },
    ],
    timetable: [
      { dayHi: 'सोम – शुक्र', dayEn: 'Mon – Fri', slotHi: 'क्वांट, रीज़निंग व GS (सुबह 7:30 – 10:30)', slotEn: 'Quant, Reasoning & GS (7:30 – 10:30 AM)' },
      { dayHi: 'शनिवार', dayEn: 'Saturday', slotHi: 'साप्ताहिक करंट अफ़ेयर्स व स्पीड टेस्ट', slotEn: 'Weekly Current Affairs & Speed Test' },
    ],
  },
];

export const UPCOMING_BATCHES: UpcomingBatch[] = [
  {
    id: 'b-jee-1',
    courseId: 'jee',
    nameHi: 'शिखर JEE लक्ष्य बैच (कक्षा 12)',
    nameEn: 'Shikhar JEE Target Batch (Class 12)',
    startDateHi: '12 मई (नमूना)',
    startDateEn: '12 May (Sample)',
    timingHi: 'सुबह 8:00 – 11:30',
    timingEn: '8:00 AM – 11:30 AM',
    modeHi: 'ऑफ़लाइन + लाइव बैकअप',
    modeEn: 'Offline + Live Backup',
    seatsLeft: 14,
  },
  {
    id: 'b-neet-1',
    courseId: 'neet',
    nameHi: 'संकल्प NEET बैच (कक्षा 11/12)',
    nameEn: 'Sankalp NEET Batch (Class 11/12)',
    startDateHi: '19 मई (नमूना)',
    startDateEn: '19 May (Sample)',
    timingHi: 'दोपहर 2:30 – 6:00',
    timingEn: '2:30 PM – 6:00 PM',
    modeHi: 'ऑफ़लाइन / ऑनलाइन',
    modeEn: 'Offline / Online',
    seatsLeft: 18,
  },
  {
    id: 'b-fnd-1',
    courseId: 'foundation',
    nameHi: 'आधार फ़ाउंडेशन बैच (कक्षा 8–10)',
    nameEn: 'Aadhaar Foundation Batch (Class 8–10)',
    startDateHi: '26 मई (नमूना)',
    startDateEn: '26 May (Sample)',
    timingHi: 'शाम 4:30 – 6:30',
    timingEn: '4:30 PM – 6:30 PM',
    modeHi: 'हाइब्रिड मोड',
    modeEn: 'Hybrid Mode',
    seatsLeft: 22,
  },
  {
    id: 'b-govt-1',
    courseId: 'govt',
    nameHi: 'प्रगति SSC व राज्य परीक्षा बैच',
    nameEn: 'Pragati SSC & State Exam Batch',
    startDateHi: '2 जून (नमूना)',
    startDateEn: '2 June (Sample)',
    timingHi: 'सुबह 7:30 – 10:30',
    timingEn: '7:30 AM – 10:30 AM',
    modeHi: 'ऑनलाइन लाइव',
    modeEn: 'Online Live',
    seatsLeft: 25,
  },
];

export const CAMPUS_FACILITIES: CampusFacility[] = [
  {
    id: 'smart-classroom',
    titleHi: 'स्मार्ट क्लासरूम',
    titleEn: 'Smart Classrooms',
    descHi: 'इंटरैक्टिव डिजिटल बोर्ड, स्पष्ट ऑडियो और सीमित बैच आकार के साथ कक्षा शिक्षण।',
    descEn: 'Interactive digital boards, clear acoustics, and disciplined classroom seating.',
    image: VIDYA_IMAGES.smartboard,
  },
  {
    id: 'library',
    titleHi: 'शांत अध्ययन लाइब्रेरी',
    titleEn: 'Quiet Study Library',
    descHi: 'व्यक्तिगत रीडिंग डेस्क, संदर्भ पुस्तकें और स्व-अध्ययन का अनुशासित वातावरण।',
    descEn: 'Dedicated reading carrels, reference textbooks, and a distraction-free self-study zone.',
    image: VIDYA_IMAGES.library,
  },
  {
    id: 'online-live',
    titleHi: 'ऑनलाइन लाइव क्लास',
    titleEn: 'Online Live Classes',
    descHi: 'घर बैठे टू-वे लाइव कक्षाएँ, चैट डाउट और रिकॉर्डेड लेक्चर की सुविधा।',
    descEn: 'Two-way live online sessions with recorded revision access from home.',
    image: VIDYA_IMAGES.onlineClass,
  },
  {
    id: 'cbt-hall',
    titleHi: 'कंप्यूटर टेस्ट हॉल (CBT)',
    titleEn: 'Computer Test Hall (CBT)',
    descHi: 'वास्तविक परीक्षा जैसे माहौल में ऑनलाइन टेस्ट अभ्यास और तुरंत विश्लेषण।',
    descEn: 'Dedicated computer-based test workstations simulating exam-day discipline.',
    image: VIDYA_IMAGES.testHall,
  },
  {
    id: 'doubt-cell',
    titleHi: 'डाउट क्लियरिंग सेशन',
    titleEn: 'Doubt Clearing Sessions',
    descHi: 'छोटे समूहों में विषय विशेषज्ञ शिक्षकों के साथ कठिन प्रश्नों का समाधान।',
    descEn: 'Small-group mentor tables dedicated to resolving tough numericals and concepts.',
    image: VIDYA_IMAGES.doubtSession,
  },
  {
    id: 'parent-counselling',
    titleHi: 'पेरेंट काउंसलिंग डेस्क',
    titleEn: 'Parent Counselling Desk',
    descHi: 'अभिभावकों के साथ नियमित प्रगति समीक्षा, उपस्थिति रिपोर्ट और मार्गदर्शन।',
    descEn: 'Scheduled parent-mentor reviews covering attendance, test trends, and study routines.',
    image: VIDYA_IMAGES.parentCounselling,
  },
];

export const SCHOLARSHIP_QUESTIONS: McqQuestion[] = [
  {
    id: 'sq1',
    subject: 'physics',
    subjectHi: 'भौतिकी',
    subjectEn: 'Physics',
    questionHi: 'यदि किसी वस्तु का वेग दोगुना कर दिया जाए, तो उसकी गतिज ऊर्जा कितने गुना हो जाएगी?',
    questionEn: 'If the velocity of an object is doubled, its kinetic energy becomes:',
    optionsHi: ['2 गुना', '4 गुना', 'आधी', 'अपरिवर्तित'],
    optionsEn: ['2 times', '4 times', 'Half', 'Unchanged'],
    correctIndex: 1,
    explanationHi: 'गतिज ऊर्जा KE = ½mv² होती है, इसलिए वेग दोगुना होने पर ऊर्जा 2² = 4 गुना हो जाती है।',
    explanationEn: 'Since KE = ½mv², doubling velocity increases kinetic energy by 2² = 4 times.',
  },
  {
    id: 'sq2',
    subject: 'chemistry',
    subjectHi: 'रसायन',
    subjectEn: 'Chemistry',
    questionHi: '25°C पर शुद्ध उदासीन जल का pH मान कितना होता है?',
    questionEn: 'What is the pH value of pure neutral water at 25°C?',
    optionsHi: ['5', '6', '7', '8'],
    optionsEn: ['5', '6', '7', '8'],
    correctIndex: 2,
    explanationHi: '25°C पर शुद्ध जल उदासीन होता है और इसका pH मान 7 होता है।',
    explanationEn: 'Pure water at 25°C is neutral with equal H⁺ and OH⁻ ions, giving pH = 7.',
  },
  {
    id: 'sq3',
    subject: 'maths',
    subjectHi: 'गणित',
    subjectEn: 'Mathematics',
    questionHi: 'यदि 3x + 7 = 22 हो, तो x का मान क्या होगा?',
    questionEn: 'If 3x + 7 = 22, what is the value of x?',
    optionsHi: ['3', '4', '5', '6'],
    optionsEn: ['3', '4', '5', '6'],
    correctIndex: 2,
    explanationHi: '3x = 22 - 7 = 15, इसलिए x = 15 / 3 = 5।',
    explanationEn: '3x = 22 - 7 = 15, which gives x = 5.',
  },
  {
    id: 'sq4',
    subject: 'physics',
    subjectHi: 'भौतिकी',
    subjectEn: 'Physics',
    questionHi: 'विद्युत प्रतिरोध (Electrical Resistance) की SI इकाई क्या है?',
    questionEn: 'What is the SI unit of electrical resistance?',
    optionsHi: ['वोल्ट (Volt)', 'एम्पीयर (Ampere)', 'ओम (Ohm)', 'वाट (Watt)'],
    optionsEn: ['Volt', 'Ampere', 'Ohm', 'Watt'],
    correctIndex: 2,
    explanationHi: 'ओम के नियम (R = V/I) के अनुसार प्रतिरोध की SI इकाई ओम (Ω) है।',
    explanationEn: 'By Ohm’s law (R = V/I), the SI unit of resistance is the Ohm (Ω).',
  },
  {
    id: 'sq5',
    subject: 'maths',
    subjectHi: 'गणित',
    subjectEn: 'Mathematics',
    questionHi: 'एक समकोण त्रिभुज की दो छोटी भुजाएँ 6 cm और 8 cm हैं, तो कर्ण (Hypotenuse) कितना होगा?',
    questionEn: 'A right triangle has legs of 6 cm and 8 cm. What is the length of its hypotenuse?',
    optionsHi: ['9 cm', '10 cm', '12 cm', '14 cm'],
    optionsEn: ['9 cm', '10 cm', '12 cm', '14 cm'],
    correctIndex: 1,
    explanationHi: 'पाइथागोरस प्रमेय से: √(6² + 8²) = √(36 + 64) = √100 = 10 cm।',
    explanationEn: 'By the Pythagorean theorem: √(6² + 8²) = √100 = 10 cm.',
  },
];

export const MOCK_TEST_QUESTIONS: McqQuestion[] = [
  ...SCHOLARSHIP_QUESTIONS,
  {
    id: 'mq6',
    subject: 'chemistry',
    subjectHi: 'रसायन',
    subjectEn: 'Chemistry',
    questionHi: 'आवर्त सारणी में कार्बन (Carbon) का परमाणु क्रमांक कितना होता है?',
    questionEn: 'What is the atomic number of Carbon in the periodic table?',
    optionsHi: ['4', '6', '8', '12'],
    optionsEn: ['4', '6', '8', '12'],
    correctIndex: 1,
    explanationHi: 'कार्बन के नाभिक में 6 प्रोटॉन होते हैं, अतः इसका परमाणु क्रमांक 6 है।',
    explanationEn: 'Carbon has 6 protons in its nucleus, so its atomic number is 6.',
  },
  {
    id: 'mq7',
    subject: 'physics',
    subjectHi: 'भौतिकी',
    subjectEn: 'Physics',
    questionHi: 'निर्वात (Vacuum) में प्रकाश की चाल लगभग कितनी होती है?',
    questionEn: 'What is the approximate speed of light in vacuum?',
    optionsHi: ['3 × 10⁶ m/s', '3 × 10⁸ m/s', '3 × 10¹⁰ m/s', '1.5 × 10⁸ m/s'],
    optionsEn: ['3 × 10⁶ m/s', '3 × 10⁸ m/s', '3 × 10¹⁰ m/s', '1.5 × 10⁸ m/s'],
    correctIndex: 1,
    explanationHi: 'निर्वात में प्रकाश की चाल c ≈ 3 × 10⁸ मीटर प्रति सेकंड होती है।',
    explanationEn: 'Light travels at approximately 3 × 10⁸ m/s in vacuum.',
  },
  {
    id: 'mq8',
    subject: 'chemistry',
    subjectHi: 'रसायन',
    subjectEn: 'Chemistry',
    questionHi: 'निम्नलिखित में से कौन-सी गैस हरितगृह प्रभाव (Greenhouse Effect) में प्रमुख भूमिका निभाती है?',
    questionEn: 'Which of the following gases is a primary contributor to the greenhouse effect?',
    optionsHi: ['नाइट्रोजन (N₂)', 'ऑक्सीजन (O₂)', 'कार्बन डाइऑक्साइड (CO₂)', 'आर्गन (Ar)'],
    optionsEn: ['Nitrogen (N₂)', 'Oxygen (O₂)', 'Carbon Dioxide (CO₂)', 'Argon (Ar)'],
    correctIndex: 2,
    explanationHi: 'कार्बन डाइऑक्साइड (CO₂) अवरक्त विकिरण को अवशोषित कर ऊष्मा को बनाए रखती है।',
    explanationEn: 'Carbon dioxide absorbs infrared radiation and traps heat in the atmosphere.',
  },
  {
    id: 'mq9',
    subject: 'maths',
    subjectHi: 'गणित',
    subjectEn: 'Mathematics',
    questionHi: 'sin²(30°) + cos²(30°) का मान क्या होता है?',
    questionEn: 'What is the value of sin²(30°) + cos²(30°)?',
    optionsHi: ['0', '0.5', '1', '2'],
    optionsEn: ['0', '0.5', '1', '2'],
    correctIndex: 2,
    explanationHi: 'त्रिकोणमितीय सर्वसमिका sin²θ + cos²θ = 1 सभी कोणों θ के लिए सत्य है।',
    explanationEn: 'By the Pythagorean trigonometric identity, sin²θ + cos²θ = 1 for any angle θ.',
  },
  {
    id: 'mq10',
    subject: 'maths',
    subjectHi: 'गणित',
    subjectEn: 'Mathematics',
    questionHi: 'd/dx (x³) का अवकलज (Derivative) क्या होता है?',
    questionEn: 'What is the derivative d/dx (x³)?',
    optionsHi: ['x²', '3x²', '3x', 'x³/3'],
    optionsEn: ['x²', '3x²', '3x', 'x³/3'],
    correctIndex: 1,
    explanationHi: 'घात नियम (Power Rule) से d/dx (xⁿ) = n·xⁿ⁻¹, इसलिए d/dx (x³) = 3x²।',
    explanationEn: 'Using the power rule d/dx (xⁿ) = n·xⁿ⁻¹, the derivative of x³ is 3x².',
  },
];

export const ACADEMY_FAQS: FaqItem[] = [
  {
    id: 'f1',
    qHi: 'क्या ऑफ़लाइन और ऑनलाइन दोनों माध्यमों में बैच उपलब्ध हैं?',
    qEn: 'Are batches available in both offline and online modes?',
    aHi: 'हाँ, इस डेमो प्लेटफ़ॉर्म में ऑफ़लाइन क्लासरूम, ऑनलाइन लाइव क्लास और हाइब्रिड बैच मॉडल दर्शाए गए हैं।',
    aEn: 'Yes, this demo platform showcases offline classroom, online live, and hybrid batch options.',
  },
  {
    id: 'f2',
    qHi: 'क्या फ़ीस किस्तों (Installments) में जमा की जा सकती है?',
    qEn: 'Can tuition fees be paid in installments?',
    aHi: 'हाँ, ऊपर दिए गए फ़ीस कैलकुलेटर में 1, 3 और 6 किस्तों की नमूना संरचना देखी जा सकती है।',
    aEn: 'Yes, you can preview 1, 3, and 6 installment breakdowns directly in the Fee Calculator above.',
  },
  {
    id: 'f3',
    qHi: 'यदि छात्र कोई कक्षा छूट जाए तो क्या बैकअप लेक्चर मिलता है?',
    qEn: 'Do students get recorded backup lectures if they miss a class?',
    aHi: 'छात्र पोर्टल में विषय-वार वीडियो लेक्चर और डिजिटल नोट्स सेक्शन दिया गया है ताकि छात्र आसानी से दोहरा सकें।',
    aEn: 'The Student Portal includes topic-wise lecture listings and study notes so students can revise anytime.',
  },
  {
    id: 'f4',
    qHi: 'साप्ताहिक टेस्ट और रिज़ल्ट की जानकारी अभिभावकों को कैसे मिलती है?',
    qEn: 'How are weekly test results and attendance shared with parents?',
    aHi: 'प्लेटफ़ॉर्म में हाज़िरी रिंग, 6-टेस्ट प्रगति ग्राफ़, विषय-वार विश्लेषण और पेरेंट काउंसलिंग अपडेट की व्यवस्था है।',
    aEn: 'The platform provides attendance tracking, 6-test progress charts, subject-wise breakdowns, and scheduled parent reviews.',
  },
  {
    id: 'f5',
    qHi: 'कठिन प्रश्नों के लिए डाउट क्लियरिंग की क्या प्रक्रिया है?',
    qEn: 'How does doubt clearing work for difficult problems?',
    aHi: 'छात्र पोर्टल से ऑनलाइन डाउट भेज सकते हैं जो सीधे टीचर पैनल के डाउट इनबॉक्स में दिखता है, साथ ही ऑफ़लाइन डाउट डेस्क भी है।',
    aEn: 'Students can post questions from the Student Portal straight into the Teacher Doubt Inbox, alongside in-person doubt desks.',
  },
  {
    id: 'f6',
    qHi: 'क्या यह वास्तविक कोचिंग वेबसाइट है या क्लाइंट डेमो?',
    qEn: 'Is this a live coaching institute or an interactive client demo?',
    aHi: 'यह Power Web Studio AI द्वारा बनाया गया इंटरैक्टिव डेमो प्लेटफ़ॉर्म है। इसमें सभी नाम, बैच, फ़ीस और आँकड़े नमूना हैं।',
    aEn: 'This is an interactive demonstration platform built by Power Web Studio AI. All batches, fees, and metrics are sample data.',
  },
];

export const SAMPLE_VIDEO_LECTURES: VideoLecture[] = [
  {
    id: 'vl1',
    titleHi: 'प्रक्षेप्य गति और वेक्टर विश्लेषण — भाग 1',
    titleEn: 'Projectile Motion & Vector Analysis — Part 1',
    subjectHi: 'भौतिकी',
    subjectEn: 'Physics',
    durationHi: '48 मिनट',
    durationEn: '48 min',
    facultyHi: 'प्रो. आर. शर्मा (नमूना)',
    facultyEn: 'Prof. R. Sharma (Sample)',
    thumbnail: VIDYA_IMAGES.smartboard,
  },
  {
    id: 'vl2',
    titleHi: 'कार्बनिक रसायन: अभिक्रिया तंत्र की बुनियाद',
    titleEn: 'Organic Chemistry: Foundations of Reaction Mechanisms',
    subjectHi: 'रसायन',
    subjectEn: 'Chemistry',
    durationHi: '52 मिनट',
    durationEn: '52 min',
    facultyHi: 'डॉ. एस. वर्मा (नमूना)',
    facultyEn: 'Dr. S. Verma (Sample)',
    thumbnail: VIDYA_IMAGES.courseNeet,
  },
  {
    id: 'vl3',
    titleHi: 'अवकलन (Differentiation) और ग्राफ़ विश्लेषण',
    titleEn: 'Differentiation & Curve Analysis Workshop',
    subjectHi: 'गणित',
    subjectEn: 'Mathematics',
    durationHi: '44 मिनट',
    durationEn: '44 min',
    facultyHi: 'श्री ए. पटेल (नमूना)',
    facultyEn: 'Mr. A. Patel (Sample)',
    thumbnail: VIDYA_IMAGES.courseJee,
  },
  {
    id: 'vl4',
    titleHi: 'ऑनलाइन परीक्षा समय प्रबंधन रणनीति',
    titleEn: 'CBT Exam Time-Management Strategy',
    subjectHi: 'मार्गदर्शन',
    subjectEn: 'Strategy',
    durationHi: '26 मिनट',
    durationEn: '26 min',
    facultyHi: 'अकादमिक टीम (नमूना)',
    facultyEn: 'Academic Team (Sample)',
    thumbnail: VIDYA_IMAGES.onlineClass,
  },
];

export const SAMPLE_STUDY_NOTES: StudyNote[] = [
  {
    id: 'sn1',
    titleHi: 'भौतिकी सूत्र पुस्तिका — यांत्रिकी (DPP-04)',
    titleEn: 'Physics Formula Handbook — Mechanics (DPP-04)',
    subjectHi: 'भौतिकी',
    subjectEn: 'Physics',
    pages: 18,
    updatedHi: 'नमूना पीडीएफ · इस सप्ताह',
    updatedEn: 'Sample PDF · This Week',
  },
  {
    id: 'sn2',
    titleHi: 'आवर्त सारणी एवं रासायनिक आबंधन सारांश',
    titleEn: 'Periodic Trends & Chemical Bonding Digest',
    subjectHi: 'रसायन',
    subjectEn: 'Chemistry',
    pages: 22,
    updatedHi: 'नमूना पीडीएफ · 3 दिन पहले',
    updatedEn: 'Sample PDF · 3 days ago',
  },
  {
    id: 'sn3',
    titleHi: 'कलन अभ्यास प्रश्न सेट — 40 हल सहित प्रश्न',
    titleEn: 'Calculus Practice Sheet — 40 Worked Examples',
    subjectHi: 'गणित',
    subjectEn: 'Mathematics',
    pages: 15,
    updatedHi: 'नमूना पीडीएफ · पिछले सप्ताह',
    updatedEn: 'Sample PDF · Last Week',
  },
  {
    id: 'sn4',
    titleHi: 'NCERT मुख्य बिंदु चेकलिस्ट (जीवविज्ञान)',
    titleEn: 'NCERT Key Concepts Checklist (Biology)',
    subjectHi: 'जीवविज्ञान',
    subjectEn: 'Biology',
    pages: 26,
    updatedHi: 'नमूना पीडीएफ · अद्यतन',
    updatedEn: 'Sample PDF · Updated',
  },
];

export const STUDENT_PROGRESS_SERIES = [
  { labelHi: 'टेस्ट 1', labelEn: 'Test 1', score: 62 },
  { labelHi: 'टेस्ट 2', labelEn: 'Test 2', score: 68 },
  { labelHi: 'टेस्ट 3', labelEn: 'Test 3', score: 66 },
  { labelHi: 'टेस्ट 4', labelEn: 'Test 4', score: 74 },
  { labelHi: 'टेस्ट 5', labelEn: 'Test 5', score: 79 },
  { labelHi: 'टेस्ट 6', labelEn: 'Test 6', score: 84 },
];

export const INITIAL_DOUBTS: DoubtItem[] = [
  {
    id: 'd1',
    studentHi: 'डेमो छात्र',
    studentEn: 'Demo Student',
    batchHi: 'शिखर JEE लक्ष्य बैच',
    batchEn: 'Shikhar JEE Target Batch',
    subjectHi: 'भौतिकी',
    subjectEn: 'Physics',
    questionHi: 'प्रक्षेप्य गति में अधिकतम परास (Range) के लिए प्रक्षेपण कोण 45° ही क्यों होता है?',
    questionEn: 'Why does a 45° launch angle produce maximum horizontal range in projectile motion?',
    timeHi: 'आज, सुबह 10:15 (नमूना)',
    timeEn: 'Today, 10:15 AM (Sample)',
    reply:
      'R = (u² sin 2θ) / g होता है। sin 2θ का अधिकतम मान 1 तब होता है जब 2θ = 90°, अर्थात θ = 45°। (नमूना उत्तर)',
  },
  {
    id: 'd2',
    studentHi: 'डेमो छात्र (रोल #104)',
    studentEn: 'Demo Student (Roll #104)',
    batchHi: 'संकल्प NEET बैच',
    batchEn: 'Sankalp NEET Batch',
    subjectHi: 'रसायन',
    subjectEn: 'Chemistry',
    questionHi: 'बफ़र विलयन (Buffer Solution) में pH परिवर्तन बहुत कम क्यों होता है?',
    questionEn: 'Why does a buffer solution resist sudden changes in pH upon adding small acid/base?',
    timeHi: 'आज, दोपहर 12:20 (नमूना)',
    timeEn: 'Today, 12:20 PM (Sample)',
  },
  {
    id: 'd3',
    studentHi: 'डेमो छात्र (रोल #109)',
    studentEn: 'Demo Student (Roll #109)',
    batchHi: 'आधार फ़ाउंडेशन बैच',
    batchEn: 'Aadhaar Foundation Batch',
    subjectHi: 'गणित',
    subjectEn: 'Mathematics',
    questionHi: 'द्विघात समीकरण के मूल वास्तविक और बराबर होने की शर्त क्या है?',
    questionEn: 'What is the condition for a quadratic equation to have real and equal roots?',
    timeHi: 'कल, शाम 5:10 (नमूना)',
    timeEn: 'Yesterday, 5:10 PM (Sample)',
  },
];

export const TEACHER_BATCHES = [
  { id: 'b-jee-1', nameHi: 'शिखर JEE लक्ष्य बैच', nameEn: 'Shikhar JEE Target Batch', facultyHi: 'प्रो. आर. शर्मा', facultyEn: 'Prof. R. Sharma', timingHi: 'सुबह 8:00', timingEn: '8:00 AM' },
  { id: 'b-neet-1', nameHi: 'संकल्प NEET बैच', nameEn: 'Sankalp NEET Batch', facultyHi: 'डॉ. एस. वर्मा', facultyEn: 'Dr. S. Verma', timingHi: 'दोपहर 2:30', timingEn: '2:30 PM' },
  { id: 'b-fnd-1', nameHi: 'आधार फ़ाउंडेशन बैच', nameEn: 'Aadhaar Foundation Batch', facultyHi: 'श्री ए. पटेल', facultyEn: 'Mr. A. Patel', timingHi: 'शाम 4:30', timingEn: '4:30 PM' },
];

export const ATTENDANCE_STUDENTS: AttendanceStudent[] = [
  { id: 'st-01', rollNo: 'VS-101', nameHi: 'डेमो छात्र 01 (आरव)', nameEn: 'Demo Student 01 (Aarav)', batchId: 'b-jee-1' },
  { id: 'st-02', rollNo: 'VS-102', nameHi: 'डेमो छात्र 02 (अनन्या)', nameEn: 'Demo Student 02 (Ananya)', batchId: 'b-jee-1' },
  { id: 'st-03', rollNo: 'VS-103', nameHi: 'डेमो छात्र 03 (रोहित)', nameEn: 'Demo Student 03 (Rohit)', batchId: 'b-jee-1' },
  { id: 'st-04', rollNo: 'VS-104', nameHi: 'डेमो छात्र 04 (प्रिया)', nameEn: 'Demo Student 04 (Priya)', batchId: 'b-jee-1' },
  { id: 'st-05', rollNo: 'VS-105', nameHi: 'डेमो छात्र 05 (कबीर)', nameEn: 'Demo Student 05 (Kabir)', batchId: 'b-jee-1' },
  { id: 'st-06', rollNo: 'VS-106', nameHi: 'डेमो छात्र 06 (मेघा)', nameEn: 'Demo Student 06 (Megha)', batchId: 'b-jee-1' },
  { id: 'st-07', rollNo: 'VS-107', nameHi: 'डेमो छात्र 07 (आदित्य)', nameEn: 'Demo Student 07 (Aditya)', batchId: 'b-jee-1' },
  { id: 'st-08', rollNo: 'VS-108', nameHi: 'डेमो छात्र 08 (स्नेहा)', nameEn: 'Demo Student 08 (Sneha)', batchId: 'b-jee-1' },
  { id: 'st-09', rollNo: 'VS-109', nameHi: 'डेमो छात्र 09 (विवेक)', nameEn: 'Demo Student 09 (Vivek)', batchId: 'b-jee-1' },
  { id: 'st-10', rollNo: 'VS-110', nameHi: 'डेमो छात्र 10 (काव्या)', nameEn: 'Demo Student 10 (Kavya)', batchId: 'b-jee-1' },
  { id: 'st-11', rollNo: 'VS-111', nameHi: 'डेमो छात्र 11 (सार्थक)', nameEn: 'Demo Student 11 (Sarthak)', batchId: 'b-jee-1' },
  { id: 'st-12', rollNo: 'VS-112', nameHi: 'डेमो छात्र 12 (तन्वी)', nameEn: 'Demo Student 12 (Tanvi)', batchId: 'b-jee-1' },
];

export const INITIAL_HOMEWORKS: HomeworkItem[] = [
  {
    id: 'hw-1',
    subjectHi: 'भौतिकी',
    subjectEn: 'Physics',
    type: 'homework',
    dueDate: '2026-05-18',
    prompt: 'DPP-05: गति के नियम और घर्षण पर आधारित प्रश्न संख्या 1 से 15 हल करें। (नमूना)',
    batchHi: 'शिखर JEE लक्ष्य बैच',
    batchEn: 'Shikhar JEE Target Batch',
  },
  {
    id: 'hw-2',
    subjectHi: 'रसायन',
    subjectEn: 'Chemistry',
    type: 'test',
    dueDate: '2026-05-21',
    prompt: 'यूनिट टेस्ट: रासायनिक साम्य एवं pH गणना — 20 वस्तुनिष्ठ प्रश्न। (नमूना)',
    batchHi: 'संकल्प NEET बैच',
    batchEn: 'Sankalp NEET Batch',
  },
];

export const INITIAL_INQUIRIES: AdmissionInquiry[] = [
  {
    id: 'INQ-301',
    name: 'डेमो अभिभावक — राजेश कुमार',
    studentClass: 'कक्षा 12 (विज्ञान)',
    courseId: 'jee',
    mobile: '90000 00101',
    dateHi: 'आज (नमूना)',
    dateEn: 'Today (Sample)',
    status: 'new',
  },
  {
    id: 'INQ-302',
    name: 'डेमो छात्रा — निधि साहू',
    studentClass: 'कक्षा 11 (बायो)',
    courseId: 'neet',
    mobile: '90000 00102',
    dateHi: 'कल (नमूना)',
    dateEn: 'Yesterday (Sample)',
    status: 'called',
  },
  {
    id: 'INQ-303',
    name: 'डेमो छात्र — अमन वर्मा',
    studentClass: 'कक्षा 9',
    courseId: 'foundation',
    mobile: '90000 00103',
    dateHi: '2 दिन पहले (नमूना)',
    dateEn: '2 days ago (Sample)',
    status: 'admitted',
  },
  {
    id: 'INQ-304',
    name: 'डेमो अभ्यर्थी — पूजा देवांगन',
    studentClass: 'स्नातक',
    courseId: 'govt',
    mobile: '90000 00104',
    dateHi: '3 दिन पहले (नमूना)',
    dateEn: '3 days ago (Sample)',
    status: 'called',
  },
];

export const INITIAL_NOTICES: AcademyNotice[] = [
  {
    id: 'nt-1',
    titleHi: 'रविवार साप्ताहिक CBT अभ्यास टेस्ट समय-सारणी',
    titleEn: 'Sunday Weekly CBT Practice Test Schedule',
    bodyHi: 'सभी JEE और NEET बैच के छात्रों के लिए रविवार सुबह 9:30 बजे कंप्यूटर टेस्ट हॉल में अभ्यास परीक्षा आयोजित की जाएगी। (नमूना सूचना)',
    bodyEn: 'Weekly practice assessment for JEE and NEET batches will be held Sunday at 9:30 AM in the CBT Hall. (Sample notice)',
    audienceHi: 'सभी छात्र',
    audienceEn: 'All Students',
    dateHi: 'आज · नमूना',
    dateEn: 'Today · Sample',
  },
  {
    id: 'nt-2',
    titleHi: 'मासिक पेरेंट-टीचर समीक्षा बैठक',
    titleEn: 'Monthly Parent-Mentor Progress Review',
    bodyHi: 'इस शनिवार दोपहर 2:00 से 5:00 बजे तक अभिभावक काउंसलिंग कक्ष में उपस्थिति व टेस्ट रिपोर्ट साझा की जाएगी। (नमूना सूचना)',
    bodyEn: 'Attendance and test trend reviews will be held this Saturday from 2:00 PM to 5:00 PM at the Counselling Desk. (Sample notice)',
    audienceHi: 'अभिभावक व छात्र',
    audienceEn: 'Parents & Students',
    dateHi: '2 दिन पहले · नमूना',
    dateEn: '2 days ago · Sample',
  },
];

export const ADMIN_MONTHLY_FEES = [
  { monthHi: 'दिसं', monthEn: 'Dec', amountLakhs: 4.2 },
  { monthHi: 'जन', monthEn: 'Jan', amountLakhs: 5.1 },
  { monthHi: 'फ़र', monthEn: 'Feb', amountLakhs: 4.8 },
  { monthHi: 'मार्च', monthEn: 'Mar', amountLakhs: 6.4 },
  { monthHi: 'अप्रै', monthEn: 'Apr', amountLakhs: 7.9 },
  { monthHi: 'मई', monthEn: 'May', amountLakhs: 6.8 },
];

export const ADMIN_COURSE_DISTRIBUTION = [
  { courseHi: 'JEE', courseEn: 'JEE', count: 145 },
  { courseHi: 'NEET', courseEn: 'NEET', count: 132 },
  { courseHi: 'फ़ाउंडेशन 8–10', courseEn: 'Foundation 8–10', count: 98 },
  { courseHi: 'सरकारी परीक्षाएँ', courseEn: 'Govt Exams', count: 85 },
];

export const PLATFORM_FEATURES: PlatformFeatureItem[] = [
  { id: 'admission', titleHi: 'ऑनलाइन एडमिशन', titleEn: 'Online Admission', descHi: 'डिजिटल पूछताछ, काउंसलिंग फ़ॉलो-अप और सीट आवंटन।', descEn: 'Digital inquiry capture, counselling follow-ups, and enrollment flow.' },
  { id: 'fees', titleHi: 'फ़ीस किस्तें और रसीद', titleEn: 'Fee Installments & Receipts', descHi: 'किस्त शेड्यूल, बकाया रिमाइंडर और प्रिंट-रेडी डिजिटल रसीद।', descEn: 'Installment plans, due alerts, and printable fee receipts.' },
  { id: 'live', titleHi: 'लाइव क्लास', titleEn: 'Live Classes', descHi: 'ऑनलाइन व हाइब्रिड बैच के लिए एकीकृत लाइव कक्षा लिंक।', descEn: 'Unified live lecture schedule for online and hybrid batches.' },
  { id: 'video', titleHi: 'वीडियो लेक्चर', titleEn: 'Video Lectures', descHi: 'अध्याय-वार रिकॉर्डेड रिविज़न लाइब्रेरी और पीडीएफ नोट्स।', descEn: 'Chapter-wise recorded lecture library with companion study notes.' },
  { id: 'tests', titleHi: 'ऑनलाइन टेस्ट', titleEn: 'Online Tests', descHi: 'टाइमर, प्रश्न पैलेट और CBT पैटर्न मॉक टेस्ट इंजन।', descEn: 'Timed CBT-style mock test runner with question navigation palette.' },
  { id: 'analysis', titleHi: 'रिज़ल्ट एनालिसिस', titleEn: 'Result Analysis', descHi: 'विषय-वार स्कोर ग्राफ़ और क्रमिक टेस्ट प्रगति रिपोर्ट।', descEn: 'Subject-wise score breakdown and multi-test trend charts.' },
  { id: 'attendance', titleHi: 'हाज़िरी प्रबंधन', titleEn: 'Attendance Tracking', descHi: 'बैच-वार दैनिक उपस्थिति और तुरंत प्रतिशत सारांश।', descEn: 'Daily batch attendance register with automated percentage summary.' },
  { id: 'parent', titleHi: 'पेरेंट अपडेट', titleEn: 'Parent Updates', descHi: 'अभिभावकों के लिए उपस्थिति, टेस्ट और फ़ीस पारदर्शिता।', descEn: 'Clear parent visibility into attendance, tests, and fee status.' },
  { id: 'notice', titleHi: 'नोटिस बोर्ड', titleEn: 'Notice Board', descHi: 'समय-सारणी, अवकाश और परीक्षा सूचनाएँ एक क्लिक में।', descEn: 'Publish exam timetables and academic announcements instantly.' },
  { id: 'rbac', titleHi: 'रोल-आधारित एक्सेस', titleEn: 'Role-Based Access', descHi: 'वेबसाइट, छात्र, टीचर और एडमिन के अलग-अलग पोर्टल।', descEn: 'Dedicated portals for Website, Student, Teacher, and Admin roles.' },
  { id: 'bilingual', titleHi: 'हिन्दी / English', titleEn: 'Hindi / English', descHi: 'हिन्दी और अंग्रेज़ी दोनों भाषाओं में सहज इंटरफ़ेस।', descEn: 'Full bilingual interface tailored for Indian learners and parents.' },
  { id: 'mobile', titleHi: 'मोबाइल ऐप-रेडी', titleEn: 'Mobile App-Ready', descHi: 'Android ऐप से जुड़ने योग्य आधुनिक API-फ़र्स्ट आर्किटेक्चर।', descEn: 'Mobile-first experience ready to extend to native Android apps.' },
];

export const DEMO_PACKAGES: DemoPackageTier[] = [
  {
    id: 'starter',
    nameHi: 'स्टार्टर',
    nameEn: 'Starter',
    price: '₹49,999',
    audienceHi: 'नए या स्थानीय कोचिंग केंद्रों के लिए',
    audienceEn: 'For emerging coaching institutes',
    pointsHi: [
      'प्रीमियम कोचिंग वेबसाइट (हिन्दी / English)',
      'कोर्स विवरण, बैच कैलेंडर और फ़ीस कैलकुलेटर',
      'ऑनलाइन एडमिशन पूछताछ फ़ॉर्म व FAQ',
      'मोबाइल-फ़र्स्ट रिस्पॉन्सिव डिज़ाइन',
    ],
    pointsEn: [
      'Premium coaching institute website (Hindi / English)',
      'Course catalog, batch calendar & fee calculator',
      'Online admission inquiry form & FAQ',
      'Mobile-first responsive performance',
    ],
  },
  {
    id: 'pro',
    nameHi: 'प्रो',
    nameEn: 'Pro',
    price: '₹1,49,999',
    audienceHi: 'बढ़ते मल्टी-बैच कोचिंग संस्थानों के लिए',
    audienceEn: 'For growing multi-batch institutes',
    featured: true,
    pointsHi: [
      'स्टार्टर पैकेज की सभी सुविधाएँ शामिल',
      'छात्र पोर्टल: वीडियो सूची, नोट्स और प्रगति ग्राफ़',
      'ऑनलाइन मॉक टेस्ट व विषय-वार रिज़ल्ट एनालिसिस',
      'फ़ीस किस्त प्रबंधन, रसीद जनरेटर व डाउट इनबॉक्स',
    ],
    pointsEn: [
      'Everything in Starter included',
      'Student Portal: lectures, notes & progress charts',
      'Online mock test engine & subject-wise analytics',
      'Fee installments, receipt generator & doubt inbox',
    ],
  },
  {
    id: 'enterprise',
    nameHi: 'एंटरप्राइज़',
    nameEn: 'Enterprise',
    price: '₹2,99,999',
    audienceHi: 'बड़े संस्थानों व मल्टी-ब्रांच अकादमियों के लिए',
    audienceEn: 'For large coaching academies & multi-branch ops',
    pointsHi: [
      'पूरा 4-रोल प्लेटफ़ॉर्म (वेबसाइट, छात्र, टीचर, एडमिन)',
      'नेटिव Android छात्र/पेरेंट ऐप इंटीग्रेशन',
      'हाज़िरी, होमवर्क, नोटिस बोर्ड और एडमिन एनालिटिक्स',
      'आपके ब्रांड, डोमेन और कस्टम वर्कफ़्लो के अनुरूप सेटअप',
    ],
    pointsEn: [
      'Complete 4-role platform (Website, Student, Teacher, Admin)',
      'Native Android student & parent app integration',
      'Attendance, homework, notice board & admin analytics',
      'Custom branding, domain & tailored institute workflows',
    ],
  },
];

export function formatINR(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}
