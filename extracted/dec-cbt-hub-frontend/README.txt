Dec Academic CBT Hub - Front end (runs fully offline in your browser)
====================================================================

HOW TO RUN
1. Unzip this folder.
2. Easiest: double-click index.html (opens in Chrome, Edge or Firefox).
   Better: open the folder in VS Code, install the "Live Server" extension,
   right-click index.html and choose "Open with Live Server".
   Or in a terminal inside the folder:  python -m http.server 5500
   then visit http://localhost:5500

LOGIN
Master Admin: use the email and password you gave me.
Students can register on the login screen. Use the Master Admin to create
staff and admins.

FILES
index.html       Page shell
style.css        Original design
theme.css        Blue theme, animations, dark mode
app.js           All screens and app logic (your original front end)
mock-backend.js  Fake back end that runs in the browser (replaces Express/MongoDB)

HOW THE FAKE BACK END WORKS
- mock-backend.js defines an api(path, options) function with the same
  endpoints as your real server (/auth/login, /exams/start, /courses, ...).
- Everything is saved in your browser (localStorage), so data stays on this
  computer and in this browser only. Large PDFs may not be kept after reload.
- To reset all data: browser DevTools > Application > Local Storage > clear
  the keys starting with "cbt_".

NEEDS INTERNET (optional): the Google Fonts and the PDF reader library load
from the web. Without internet the site still works but uses fallback fonts
and the PDF opens with the browser's own viewer.

MOVING TO A REAL BACK END LATER
Delete mock-backend.js, keep a small api() helper that calls fetch('/api' + path)
with the Authorization header, and run your Node/Express server from the
original project. The front end code in app.js does not change.

BULK QUESTION FORMAT (Admin > Courses & questions > Bulk-add)
Pick the course and topic from the dropdowns, then paste:

Q: Your question
A) option
B) option
C) option
D) option
Answer: B
Explanation: optional
Image: https://... (optional)
Marks: 2 (optional)

Start every question with Q:. No options + Answer: text = a typed (theory) question.

WHAT IS NEW (v3)
- Notifications: Admin/Master Admin > Send notification (tick Users, Staff, Admins or Everyone). Users see a bell on the dashboard.
- Help & Support chat: Account > Contact support. Staff/admins reply from Account > Support inbox (one chat per user).
- Scientific calculator inside any exam or quiz. Tap outside it to close.
- Library: thumbnails for PDFs and images, read PDF/Word/PowerPoint/Excel/text/image files on the site, download only with the Download button.
- Profile photo: Account > Change photo.
- Scheduled quizzes: Dashboard > Scheduled quizzes. Staff/admins create a quiz (start, end, minutes per person, join window), add questions one by one or in bulk,
  then publish results. Users only see results after publishing and get a notification.

TESTING WITH TWO PEOPLE ON ONE COMPUTER
Open index.html in two browser tabs. Each tab keeps its own login but they share the same data,
so you can be Master Admin in one tab and a student in the other and watch chats, notifications and quizzes update.
(Open both from the same browser, not a private window.)

NOTE: PDF thumbnails, the PDF reader and the Word/Excel/PowerPoint viewers load helper libraries from the internet.

WHAT IS NEW (v4)
- AI assistant (Google Gemini). Three places: (1) "Ask AI" button on every document you read (type, speak, or tap the camera button to show it the page),
  (2) AI study assistant on the dashboard, (3) AI marking of theory answers.
  HOW TO CONNECT GEMINI (once):
    1. Go to https://aistudio.google.com/apikey and sign in with your Google account.
    2. Create an API key and copy it (usually starts with AIza).
    3. Open the site, log in as Master Admin > Account > AI assistant > paste the key > Save > Test.
    The key stays in that browser only. For real students, run the ai-proxy folder (npm install; set GEMINI_API_KEY; node server.js)
    and put its address in config.js (CBT_AI_PROXY) so the key never reaches student phones.
- Question types: Multiple choice, Fill in the gap (write ____ in the question; answers separated by | ; or list questions),
  Theory (students write on paper and upload photos; AI compares MEANING with your expected answer: full, partial or no marks).
  Staff/admins can open any submission and change a mark with a reason. Works in practice exams and scheduled quizzes.
  Bulk format: add "Type: gap" or "Type: theory" under a question. Theory "Answer:" can be several lines.
- Scheduled quiz notifications: when a quiz is created, one day before, 20 minutes before and 5 minutes before.
  (In this browser-only demo, reminders appear when someone has the site open. A real server would send them on its own.)
- Results as PDF: quiz results page, each student's profile, and Dashboard > Download all results (PDF).
- Documents never download by themselves. Only the Download button saves a file.
- Login is remembered on this device until you log out. To test two accounts at once, open a second tab with index.html?session=tab
- Performance charts and analytics now show immediately after login.

WHAT IS NEW (v5: schools, lecturers, assignments, live classes, matric login)
WHO CAN DO WHAT
- Master Admin (you): creates schools (name, logo, type, school email + password), your own platform Admins, and your Staff who work inside a school.
- School account (the school's official login, by email): creates courses, creates Lecturers and approves which courses each one handles.
- Staff (yours, assigned to a school): helps run that school like an admin under it.
- Lecturer: only works on approved courses. Sets quizzes/tests, schedules live classes, posts assignments, marks student submissions, uploads study materials.
- Students: sign up with School > Faculty > Department > Level, log in with MATRIC NUMBER + password (email is used only to send them emails).
  Master Admin and school accounts log in with their email.
- Password rule everywhere: at least 6 characters with a capital letter, a small letter, a number and a special character.
- Levels: universities show 100 to 400 or 500 level depending on the department's years. Polytechnic and College of Education show ND1, ND2, HND.
- Dashboard shows live classes and important notices first, then My Performance and My Courses.
- Live classes: the lecturer schedules a class with a meeting link (Google Meet, Zoom, YouTube Live) or tap "Create room" for a free Jitsi room. Students tap Join.
- Assignments: lecturer posts one, students snap photos and upload, the lecturer marks it and the student is notified.
BULK FORMAT FOR SCHOOLS (Master Admin > Schools > Bulk add). One line per item, paste all at once:
  SCHOOL: University of Lagos | university | unilag@school.edu | Unilag@123
  FACULTY: Science
  DEPT: Chemistry | 4
  DEPT: Medicine | 5
  SCHOOL: Federal Polytechnic Ilaro | polytechnic | fpi@school.edu | Poly@12345
  FACULTY: Engineering
  DEPT: Computer Engineering
  SCHOOL: College of Education Oyo | college | coe@school.edu | Coe@123456
  FACULTY: Arts
  DEPT: English Education
(The number after a department is its years: 4 or 5. Logos can be added to each school afterwards.)

WHAT IS NEW (v7)
- Desktop mode: on a computer the app shows a side menu and multi-column pages. On a phone it keeps the fixed bottom menu.
- Courses can belong to one department, several, or all (tick them when creating the course; bulk: Chemistry / Biochemistry).
- School accounts and school staff only see their own school's students, lecturers, staff and profiles. Master Admin and platform admins see everything.
- Everyone can practise: students (their courses), lecturers/staff/school accounts (any course in their school), Master Admin (choose a school first).
- Practice exams: choose the question type. Only the types that exist for that topic are offered (Multiple choice, Fill in the gap, Theory).
  Lecturers set how many questions and how many minutes for Gap and Theory exams: open the course > Exam settings.
- Theory exams: the clock starts when the student starts. A question paper PDF (with the eHub watermark) can be downloaded to write offline.
  Photos can be uploaded and the exam can be left and resumed (Dashboard > Resume) until time runs out. After the deadline it cannot be submitted.
- Assignments: the lecturer adds an expected answer, taps Mark all with AI (or marks by hand) and publishes the results when ready. Students only see scores after publishing.
- Delete buttons for live classes, quizzes and assignments (only for whoever created them, plus the school account and Master Admin). Old notifications stay.
- School account: Account > Change school logo (the picture becomes the school's logo).
- Every PDF the app generates carries a faint eHub watermark.

WHAT IS NEW (v8)
- Semesters: the school account declares First or Second semester (school page). Students only see courses of the declared semester; changing it notifies them.
  Every course has a semester and units (single form, or bulk line: CODE | Title | Department(s) | Level | Semester | Units).
- Deans: each faculty can have a dean account (school page > Faculties, departments and deans > Add dean). Deans log in with email + password.
  Quiz notifications: a lecturer's quiz goes to that course's students, a dean's quiz to the faculty's students, the school account's quiz to every student of the school.
- Lecturer ranks: Professor, Reader, Senior Lecturer, Lecturer (chosen when creating the lecturer, shown on their portal). A lecturer requests a change in Account;
  the dean of their faculty or the school account approves under Rank requests.
- The AI key menu is only on the Master Admin portal. Other users never see the provider's name; errors are generic and students are never told the AI marked their work.
- Send email (Master Admin): choose school, faculty and roles, then send. Add CBT_MAIL_URL in config.js (ai-proxy/server.js has the /mail endpoint) to send from the site; without it the app opens your email app with everyone in BCC.
- Question bank: courses and questions pages are short now. Tap "View, edit or delete questions" to search, edit or delete any question.
- Exams have a Cancel button. Theory exams and scheduled quizzes can be left and resumed until time is up.
- Loading screen at start, a progress bar while the app works, and a "Signing you in" overlay when logging in or signing up.
- Emoji are replaced by clean SVG icons.

WHAT IS NEW (v9)
- Landing page: new visitors land on it first (logo, features, live numbers, how it works, contact, Sign in / Sign up). Master Admin > Landing page edits the contact details.
- Forgot password: a 6-digit code is emailed (valid 15 minutes, 5 tries). On the sign-in page tap "I have a code" to come back later and finish. Without a mail server the demo shows the code on screen.
- Deleting a school is deliberately hard: it lists what will be deleted, offers a backup download, then you must type a sentence exactly and press Enter. Only Master Admin and platform admins can do it.
- Sending email from the site: read EMAIL-SETUP.txt (also inside Master Admin > Send email).

WHAT IS NEW (v10)
- Maths (KaTeX): type or paste LaTeX in questions, options and explanations and it renders everywhere (exams, review, question bank, quizzes, AI chat).
  Write $\sqrt{x+1}$ for inline maths and $$\frac{a}{b}$$ for display maths. Bare commands such as \sqrt[3]{8} or \frac{1}{2} also work.
  While typing a question a maths keyboard appears (square root, cube root, any root, fraction, powers, pi, sums, integrals...) with a live preview.
  Use \$ for a real dollar sign. Question PDFs show maths as plain text, for example sqrt(x+1).
- Quizzes: only the person who set a quiz can manage its questions, see submissions, publish and change marks. Everyone else waits for the release.
- Master Admin (and your own admin): courses of all schools no longer fill your dashboard. Choose the school, department and level to show (Dashboard > "Viewing")
  and the courses, live classes and quizzes of that scope appear. You can still practise any course in any school.
- Landing page slideshow: Master Admin > Landing page: add up to 4 pictures and the seconds each stays. They fade and zoom into each other. Without pictures, built-in illustrations play.

WHAT IS NEW (v11)
- Course lists are collapsed: school, dean, staff and admin dashboards show a count and a "View courses" button. The list opens paged and searchable, with Open, Edit and Delete.
- Courses can be corrected: code, title, description, units, semester, level and departments. Available to the school account, deans (own faculty), staff, admins and lecturers (own courses). Open a course > Edit course, or use Edit in the course list.
- Photos: wherever you upload a picture (theory answers, assignments, profile photo, question images, landing pictures) you can Take photo with the camera or pick From gallery.
- Dashboard cards (live class, important notice, assignment due) have a Dismiss button in the bottom-right corner. Dismissed cards stay hidden on that device.
