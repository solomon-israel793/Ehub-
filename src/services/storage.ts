import { Course, ExamRecord, LibraryDoc, Notice, School, User } from '../types';

const DB_PREFIX = 'cbt_';

export function getDB<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(DB_PREFIX + key);
    return val ? (JSON.parse(val) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function setDB<T>(key: string, val: T): void {
  try {
    localStorage.setItem(DB_PREFIX + key, JSON.stringify(val));
    window.dispatchEvent(new Event('cbt_storage_changed'));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

export function initDefaultData(): void {
  if (getDB('seeded_v2', false)) {
    return;
  }

  const defaultSchools: School[] = [
    {
      id: 'sch_1',
      name: 'University of Lagos',
      type: 'university',
      email: 'unilag@school.edu',
      pass: 'Unilag@123',
      faculties: [
        {
          name: 'Science',
          departments: ['Chemistry', 'Computer Science', 'Physics', 'Mathematics', 'Biochemistry']
        },
        {
          name: 'Engineering',
          departments: ['Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering']
        }
      ]
    }
  ];

  const defaultCourses: Course[] = [
    {
      id: 'c_1',
      code: 'CHM101',
      title: 'General Chemistry I',
      schoolId: 'sch_1',
      dept: 'Chemistry',
      level: '100',
      semester: 'First',
      units: 3,
      questions: [
        {
          id: 'q1',
          type: 'mcq',
          text: 'What is the oxidation state of Chromium in $K_2Cr_2O_7$?',
          options: ['+3', '+6', '+4', '+7'],
          answer: '+6',
          explanation: 'In $K_2Cr_2O_7$, $2(+1) + 2x + 7(-2) = 0 \\implies 2x = 12 \\implies x = +6$.'
        },
        {
          id: 'q2',
          type: 'mcq',
          text: 'Solve for $x$ in the equation $\\sqrt{x + 5} = 4$.',
          options: ['9', '11', '16', '21'],
          answer: '11',
          explanation: 'Squaring both sides gives $x + 5 = 16 \\implies x = 11$.'
        },
        {
          id: 'q3',
          type: 'gap',
          text: "Avogadro's constant is approximately ____ $\\times 10^{23}$ particles per mole.",
          answer: '6.02|6.022',
          explanation: 'The standard accepted value is $6.022 \\times 10^{23}$.'
        },
        {
          id: 'q4',
          type: 'mcq',
          text: 'What is the pH of a $0.01\\text{ M}$ solution of hydrochloric acid ($HCl$)?',
          options: ['1', '2', '3', '7'],
          answer: '2',
          explanation: '$\\text{pH} = -\\log[H^+] = -\\log(10^{-2}) = 2$.'
        },
        {
          id: 'q5',
          type: 'mcq',
          text: 'The shape of a methane ($CH_4$) molecule according to VSEPR theory is:',
          options: ['Trigonal planar', 'Tetrahedral', 'Octahedral', 'Linear'],
          answer: 'Tetrahedral',
          explanation: 'Methane has $sp^3$ hybridization with 4 bonding pairs and 0 lone pairs, giving a bond angle of $109.5^\\circ$.'
        }
      ]
    },
    {
      id: 'c_2',
      code: 'CSC101',
      title: 'Introduction to Computer Science',
      schoolId: 'sch_1',
      dept: 'Computer Science',
      level: '100',
      semester: 'First',
      units: 2,
      questions: [
        {
          id: 'qc1',
          type: 'mcq',
          text: 'Which of the following is volatile primary memory?',
          options: ['ROM', 'Flash Drive', 'RAM', 'Hard Disk'],
          answer: 'RAM',
          explanation: 'RAM loses its contents as soon as power is turned off (volatile memory).'
        },
        {
          id: 'qc2',
          type: 'mcq',
          text: 'Convert binary number $(1011)_2$ to base 10 (decimal):',
          options: ['9', '10', '11', '13'],
          answer: '11',
          explanation: '$1 \\cdot 2^3 + 0 \\cdot 2^2 + 1 \\cdot 2^1 + 1 \\cdot 2^0 = 8 + 0 + 2 + 1 = 11$.'
        },
        {
          id: 'qc3',
          type: 'gap',
          text: 'The time complexity of binary search on a sorted array of $n$ elements is $O(\\log$ ____$)$.',
          answer: 'n|N',
          explanation: 'Binary search splits the search interval in half at each step, yielding $O(\\log n)$.'
        }
      ]
    },
    {
      id: 'c_3',
      code: 'MAT101',
      title: 'Elementary Mathematics I (Algebra & Trigonometry)',
      schoolId: 'sch_1',
      dept: 'Mathematics',
      level: '100',
      semester: 'First',
      units: 3,
      questions: [
        {
          id: 'qm1',
          type: 'mcq',
          text: 'Find the derivative $\\frac{d}{dx}(\\sin(3x^2))$:',
          options: [
            '$6x \\cos(3x^2)$',
            '$\\cos(3x^2)$',
            '$-6x \\cos(3x^2)$',
            '$3x \\sin(3x)$'
          ],
          answer: '$6x \\cos(3x^2)$',
          explanation: 'By the chain rule: $\\frac{d}{dx}(\\sin u) = \\cos u \\cdot u\' = \\cos(3x^2) \\cdot 6x$.'
        },
        {
          id: 'qm2',
          type: 'mcq',
          text: 'Evaluate $\\lim_{x \\to 0} \\frac{\\sin x}{x}$:',
          options: ['0', '1', '$\\infty$', 'Undefined'],
          answer: '1',
          explanation: 'This is the standard fundamental trigonometric limit theorem.'
        }
      ]
    }
  ];

  const defaultUsers: User[] = [
    {
      id: 'u_admin',
      role: 'master_admin',
      name: 'Engr. D. Clement (Master Admin)',
      email: 'admin@ehub.ng',
      pass: 'Admin@12345'
    },
    {
      id: 'u_school',
      role: 'school_admin',
      name: 'Unilag Exam Officer',
      email: 'unilag@school.edu',
      pass: 'Unilag@123',
      schoolId: 'sch_1'
    },
    {
      id: 'u_dean',
      role: 'dean',
      name: 'Prof. K. Adeboye (Dean Science)',
      email: 'dean.science@unilag.edu',
      pass: 'Dean@12345',
      schoolId: 'sch_1',
      faculty: 'Science'
    },
    {
      id: 'u_lecturer',
      role: 'lecturer',
      name: 'Dr. Ade (CHM101 Convener)',
      email: 'ade@unilag.edu',
      pass: 'Lecturer@123',
      schoolId: 'sch_1',
      dept: 'Chemistry'
    },
    {
      id: 'u_student',
      role: 'student',
      name: 'Tunde Ojo',
      matric: '210408012',
      email: 'tunde@gmail.com',
      pass: 'Student@12345',
      schoolId: 'sch_1',
      dept: 'Chemistry',
      faculty: 'Science',
      level: '100'
    }
  ];

  const defaultNotices: Notice[] = [
    {
      id: 'n1',
      type: 'live',
      title: '🔴 Live Class: CHM101 Organic Principles',
      desc: 'Dr. Ade is hosting a live review session and past questions marathon now.',
      link: 'https://meet.jit.si/ehub-chm101-session',
      platform: 'jitsi',
      courseCode: 'CHM101'
    },
    {
      id: 'n2',
      type: 'soon',
      title: 'Upcoming Mock: MAT101 CBT Drill',
      desc: 'Mock exam begins tomorrow at 10:00 AM. Calculator and KaTeX scratchpad allowed.',
      courseCode: 'MAT101'
    },
    {
      id: 'n3',
      type: 'note',
      title: 'First Semester CBT Schedules & Biometrics',
      desc: 'Accreditation starts 30 minutes before your paper. Check matric registration.'
    }
  ];

  const defaultDocs: LibraryDoc[] = [
    {
      id: 'doc_1',
      courseCode: 'CHM101',
      title: 'CHM101 - Lecture Handout & Reaction Guide',
      subtitle: 'Atomic Structure, Bonding & Periodic Trends',
      size: '3.2 MB',
      content: `
### CHM101: General Chemistry I
**Module 1: Atomic Structure & Quantum Numbers**

1. **The Bohr Model and Rydberg Formula**:
   $$\\frac{1}{\\lambda} = R_H \\left(\\frac{1}{n_1^2} - \\frac{1}{n_2^2}\\right)$$
   Where $R_H = 1.097 \\times 10^7 \\text{ m}^{-1}$.

2. **Quantum Numbers**:
   - Principal quantum number $n \\in \\{1, 2, 3, \\dots\\}$
   - Azimuthal (angular momentum) quantum number $l \\in \\{0, 1, \\dots, n-1\\}$
   - Magnetic quantum number $m_l \\in \\{-l, \\dots, 0, \\dots, +l\\}$
   - Spin quantum number $m_s = \\pm \\frac{1}{2}$

3. **Hybridization**:
   - $sp^3$: Four equivalent tetrahedral hybrid orbitals with $109.5^\\circ$ angles (e.g., $CH_4$).
   - $sp^2$: Trigonal planar geometry with $120^\\circ$ angles (e.g., $BF_3$, $C_2H_4$).
   - $sp$: Linear geometry with $180^\\circ$ angles (e.g., $BeCl_2$, $C_2H_2$).

4. **Oxidation State Rules**:
   - Fluorine is always $-1$. Group 1 alkali metals are $+1$. Oxygen is typically $-2$ except in peroxides ($-1$) or OF2 ($+2$).
      `
    },
    {
      id: 'doc_2',
      courseCode: 'CSC101',
      title: 'CSC101 - Core Algorithms & Architecture',
      subtitle: 'Data representation, logic gates & asymptotic notation',
      size: '2.1 MB',
      content: `
### CSC101: Introduction to Computer Science
**Summary of Key Computer Systems Concepts**

- **Von Neumann Architecture**:
  Composed of CPU (ALU + Control Unit), Memory, Input/Output mechanisms, and Buses.
- **Binary Conversion**:
  To convert $(1011)_2$ to decimal:
  $$1 \\times 2^3 + 0 \\times 2^2 + 1 \\times 2^1 + 1 \\times 2^0 = 8 + 0 + 2 + 1 = 11$$
- **Time Complexity**:
  - Linear Search: $O(n)$
  - Binary Search: $O(\\log n)$
  - Bubble Sort: $O(n^2)$
  - Merge Sort: $O(n \\log n)$
      `
    },
    {
      id: 'doc_3',
      courseCode: 'MAT101',
      title: 'MAT101 - Calculus & Trigonometry Quick Sheet',
      subtitle: 'Essential formulas, limits, and derivative tables',
      size: '1.8 MB',
      content: `
### MAT101: Formula Quick Sheet

1. **Standard Limits**:
   $$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1, \\quad \\lim_{x \\to 0} \\frac{e^x - 1}{x} = 1$$

2. **Differentiation Rules**:
   - Product Rule: $(uv)' = u'v + uv'$
   - Quotient Rule: $\\left(\\frac{u}{v}\\right)' = \\frac{u'v - uv'}{v^2}$
   - Chain Rule: $\\frac{dy}{dx} = \\frac{dy}{du} \\cdot \\frac{du}{dx}$
      `
    }
  ];

  setDB('schools', defaultSchools);
  setDB('courses', defaultCourses);
  setDB('users', defaultUsers);
  setDB('records', [
    {
      id: 'rec_init_1',
      userId: 'u_student',
      courseCode: 'CHM101',
      courseTitle: 'General Chemistry I',
      score: 80,
      correct: 4,
      total: 5,
      date: '2026-10-20'
    }
  ]);
  setDB('notices', defaultNotices);
  setDB('docs', defaultDocs);
  setDB('seeded_v2', true);
}
