import subprocess

# Generate Desktop Screenshot (1280x720)
desktop_cmd = [
    "convert",
    "-size", "1280x720", "xc:#F4F7FC",
    # Top nav
    "-fill", "#1C2541", "-draw", "rectangle 0,0 1280,64",
    "-fill", "#2196F3", "-pointsize", "28", "-font", "DejaVu-Sans-Bold", "-draw", "text 36,44 'e'",
    "-fill", "#FF9800", "-draw", "roundrectangle 54,20 110,48 14,14",
    "-fill", "#FFFFFF", "-pointsize", "16", "-font", "DejaVu-Sans-Bold", "-draw", "text 65,40 'hub'",
    "-fill", "#FFFFFF", "-pointsize", "16", "-font", "DejaVu-Sans", "-draw", "text 125,40 'Academic CBT Hub Operating System'",
    "-fill", "rgba(255,255,255,0.15)", "-draw", "roundrectangle 500,16 800,48 16,16",
    "-fill", "#10B981", "-draw", "circle 520,32 524,32",
    "-fill", "#FFFFFF", "-pointsize", "13", "-font", "DejaVu-Sans", "-draw", "text 535,37 'Active Academic Exam Session 2024/2025'",
    "-fill", "#EF4444", "-draw", "roundrectangle 980,14 1110,50 8,8",
    "-fill", "#FFFFFF", "-pointsize", "15", "-font", "DejaVu-Sans-Bold", "-draw", "text 995,38 'Time: 00:44:18'",
    "-fill", "#3B82F6", "-draw", "circle 1145,32 1162,32",
    "-fill", "#FFFFFF", "-pointsize", "14", "-font", "DejaVu-Sans-Bold", "-draw", "text 1135,38 'JD'",
    "-fill", "#FFFFFF", "-pointsize", "13", "-font", "DejaVu-Sans", "-draw", "text 1170,38 'Matric: 2024/0912'",
    
    # Left sidebar
    "-fill", "#FFFFFF", "-draw", "roundrectangle 24,84 244,696 16,16",
    "-fill", "#94A3B8", "-pointsize", "12", "-font", "DejaVu-Sans-Bold", "-draw", "text 44,120 'PORTAL NAVIGATION'",
    "-fill", "#EFF6FF", "-draw", "roundrectangle 36,140 232,182 10,10",
    "-fill", "#2563EB", "-draw", "rectangle 36,140 40,182",
    "-fill", "#1D4ED8", "-pointsize", "14", "-font", "DejaVu-Sans-Bold", "-draw", "text 56,166 'CBT Dashboard'",
    "-fill", "#475569", "-pointsize", "14", "-font", "DejaVu-Sans", "-draw", "text 56,214 'Tests & Exams'",
    "-fill", "#475569", "-pointsize", "14", "-font", "DejaVu-Sans", "-draw", "text 56,260 'Course Library'",
    "-fill", "#475569", "-pointsize", "14", "-font", "DejaVu-Sans", "-draw", "text 56,306 'Academic Records'",
    "-fill", "#475569", "-pointsize", "14", "-font", "DejaVu-Sans", "-draw", "text 56,352 'Live Classrooms'",
    "-fill", "#475569", "-pointsize", "14", "-font", "DejaVu-Sans", "-draw", "text 56,398 'System Settings'",
    
    # PWA Status in sidebar
    "-fill", "#F8FAFC", "-stroke", "#E2E8F0", "-strokewidth", "1", "-draw", "roundrectangle 38,540 230,670 12,12",
    "-stroke", "none",
    "-fill", "#10B981", "-draw", "circle 56,564 61,564",
    "-fill", "#0F172A", "-pointsize", "13", "-font", "DejaVu-Sans-Bold", "-draw", "text 70,568 'PWA Offline Ready'",
    "-fill", "#64748B", "-pointsize", "11", "-font", "DejaVu-Sans", "-draw", "text 50,592 'Service Worker Active'",
    "-fill", "#2563EB", "-draw", "roundrectangle 48,614 220,654 6,6",
    "-fill", "#FFFFFF", "-pointsize", "12", "-font", "DejaVu-Sans-Bold", "-draw", "text 72,638 'Installed PWA App'",

    # Center Exam Stage
    "-fill", "#FFFFFF", "-draw", "roundrectangle 264,84 954,696 16,16",
    "-fill", "#F8FAFC", "-draw", "roundrectangle 264,84 954,148 16,16",
    "-fill", "#0F172A", "-pointsize", "18", "-font", "DejaVu-Sans-Bold", "-draw", "text 292,116 'CSC 201: Data Structures and Algorithms'",
    "-fill", "#64748B", "-pointsize", "13", "-font", "DejaVu-Sans", "-draw", "text 292,138 'Department of Computer Science - Continuous Assessment Test'",
    
    # Progress
    "-fill", "#E2E8F0", "-draw", "roundrectangle 292,164 926,170 3,3",
    "-fill", "#2563EB", "-draw", "roundrectangle 292,164 650,170 3,3",
    "-fill", "#2563EB", "-pointsize", "13", "-font", "DejaVu-Sans-Bold", "-draw", "text 292,196 'QUESTION 24 OF 50 (Multiple Choice)'",
    "-fill", "#1E293B", "-pointsize", "16", "-font", "DejaVu-Sans-Bold", "-draw", "text 292,234 'In a balanced AVL Tree with n elements, what is the maximum time complexity'",
    "-fill", "#1E293B", "-pointsize", "16", "-font", "DejaVu-Sans-Bold", "-draw", "text 292,260 'to search, insert, and delete a node in the worst-case scenario?'",
    
    # Formula Box
    "-fill", "#F1F5F9", "-stroke", "#CBD5E1", "-strokewidth", "1", "-draw", "roundrectangle 292,280 926,324 8,8",
    "-stroke", "none",
    "-fill", "#0F172A", "-pointsize", "14", "-font", "DejaVu-Sans-Bold", "-draw", "text 312,308 'KaTeX: T(n) = O(log2 n) with maximum height h < 1.4404 log2(n + 2)'",

    # Options
    "-fill", "#FFFFFF", "-stroke", "#E2E8F0", "-strokewidth", "1", "-draw", "roundrectangle 292,342 926,394 10,10",
    "-stroke", "none",
    "-fill", "#F1F5F9", "-draw", "circle 320,368 332,368",
    "-fill", "#475569", "-pointsize", "13", "-font", "DejaVu-Sans-Bold", "-draw", "text 315,373 'A'",
    "-fill", "#334155", "-pointsize", "15", "-font", "DejaVu-Sans", "-draw", "text 348,373 'O(1) constant time across operations'",

    # Option B (Selected)
    "-fill", "#EFF6FF", "-stroke", "#2563EB", "-strokewidth", "2", "-draw", "roundrectangle 292,406 926,458 10,10",
    "-stroke", "none",
    "-fill", "#2563EB", "-draw", "circle 320,432 332,432",
    "-fill", "#FFFFFF", "-pointsize", "13", "-font", "DejaVu-Sans-Bold", "-draw", "text 315,437 'B'",
    "-fill", "#1D4ED8", "-pointsize", "15", "-font", "DejaVu-Sans-Bold", "-draw", "text 348,437 'O(log n) logarithmic time for search, insertion, and deletion'",
    "-fill", "#2563EB", "-draw", "circle 896,432 906,432",

    # Option C
    "-fill", "#FFFFFF", "-stroke", "#E2E8F0", "-strokewidth", "1", "-draw", "roundrectangle 292,470 926,522 10,10",
    "-stroke", "none",
    "-fill", "#F1F5F9", "-draw", "circle 320,496 332,496",
    "-fill", "#475569", "-pointsize", "13", "-font", "DejaVu-Sans-Bold", "-draw", "text 315,501 'C'",
    "-fill", "#334155", "-pointsize", "15", "-font", "DejaVu-Sans", "-draw", "text 348,501 'O(n) linear search worst-case'",

    # Option D
    "-fill", "#FFFFFF", "-stroke", "#E2E8F0", "-strokewidth", "1", "-draw", "roundrectangle 292,534 926,586 10,10",
    "-stroke", "none",
    "-fill", "#F1F5F9", "-draw", "circle 320,560 332,560",
    "-fill", "#475569", "-pointsize", "13", "-font", "DejaVu-Sans-Bold", "-draw", "text 315,565 'D'",
    "-fill", "#334155", "-pointsize", "15", "-font", "DejaVu-Sans", "-draw", "text 348,565 'O(n log n) quadratic factor'",

    # Buttons
    "-fill", "#F1F5F9", "-draw", "roundrectangle 292,618 412,660 8,8",
    "-fill", "#475569", "-pointsize", "14", "-font", "DejaVu-Sans-Bold", "-draw", "text 320,644 'Previous'",
    "-fill", "#FEF3C7", "-stroke", "#F59E0B", "-strokewidth", "1", "-draw", "roundrectangle 424,618 534,660 8,8",
    "-stroke", "none",
    "-fill", "#B45309", "-pointsize", "14", "-font", "DejaVu-Sans-Bold", "-draw", "text 446,644 'Flag'",
    "-fill", "#2563EB", "-draw", "roundrectangle 546,618 666,660 8,8",
    "-fill", "#FFFFFF", "-pointsize", "14", "-font", "DejaVu-Sans-Bold", "-draw", "text 578,644 'Next'",
    "-fill", "#10B981", "-draw", "roundrectangle 760,618 926,660 8,8",
    "-fill", "#FFFFFF", "-pointsize", "14", "-font", "DejaVu-Sans-Bold", "-draw", "text 790,644 'Submit Test'",

    # Right Sidebar
    "-fill", "#FFFFFF", "-draw", "roundrectangle 976,84 1256,696 16,16",
    "-fill", "#0F172A", "-pointsize", "13", "-font", "DejaVu-Sans-Bold", "-draw", "text 996,122 'QUESTION PALETTE'",
    "-fill", "#10B981", "-pointsize", "12", "-font", "DejaVu-Sans-Bold", "-draw", "text 1180,122 '24 / 50 Done'",

    # Sample Grid
    "-fill", "#10B981", "-draw", "roundrectangle 996,142 1036,178 6,6",
    "-fill", "#10B981", "-draw", "roundrectangle 1046,142 1086,178 6,6",
    "-fill", "#10B981", "-draw", "roundrectangle 1096,142 1136,178 6,6",
    "-fill", "#F59E0B", "-draw", "roundrectangle 1146,142 1186,178 6,6",
    "-fill", "#10B981", "-draw", "roundrectangle 1196,142 1236,178 6,6",

    "-fill", "#0B132B", "-draw", "roundrectangle 996,320 1236,670 12,12",
    "-fill", "#38BDF8", "-pointsize", "13", "-font", "DejaVu-Sans-Bold", "-draw", "text 1014,352 'eHub AI PROCTOR MONITOR'",
    "-fill", "#1E293B", "-draw", "roundrectangle 1014,374 1218,510 8,8",
    "-fill", "#10B981", "-draw", "circle 1034,394 1038,394",
    "-fill", "#10B981", "-pointsize", "11", "-font", "DejaVu-Sans-Bold", "-draw", "text 1046,398 'LIVE STREAM ACTIVE'",
    "-fill", "#E2E8F0", "-pointsize", "12", "-font", "DejaVu-Sans", "-draw", "text 1016,540 'Student Face: Verified'",
    "-fill", "#E2E8F0", "-pointsize", "12", "-font", "DejaVu-Sans", "-draw", "text 1016,566 'Screen Integrity: Locked'",
    "-fill", "#E2E8F0", "-pointsize", "12", "-font", "DejaVu-Sans", "-draw", "text 1016,592 'Background Audio: Normal'",
    "-fill", "#10B981", "-pointsize", "13", "-font", "DejaVu-Sans-Bold", "-draw", "text 1016,630 'Integrity Score: 100%'",

    "public/screenshot-desktop.png"
]

subprocess.run(desktop_cmd, check=True)
print("Desktop screenshot generated successfully.")

# Generate Mobile Screenshot (750x1334)
mobile_cmd = [
    "convert",
    "-size", "750x1334", "xc:#F4F7FC",
    # Status bar
    "-fill", "#1C2541", "-draw", "rectangle 0,0 750,44",
    "-fill", "#FFFFFF", "-pointsize", "16", "-font", "DejaVu-Sans-Bold", "-draw", "text 44,30 '09:41'",
    "-fill", "#FFFFFF", "-pointsize", "16", "-font", "DejaVu-Sans", "-draw", "text 630,30 '5G  100%'",
    # App header
    "-fill", "#1C2541", "-draw", "rectangle 0,44 750,118",
    "-fill", "#2196F3", "-pointsize", "32", "-font", "DejaVu-Sans-Bold", "-draw", "text 32,94 'e'",
    "-fill", "#FF9800", "-draw", "roundrectangle 52,68 116,98 15,15",
    "-fill", "#FFFFFF", "-pointsize", "18", "-font", "DejaVu-Sans-Bold", "-draw", "text 64,90 'hub'",
    "-fill", "#EF4444", "-draw", "roundrectangle 520,64 710,100 8,8",
    "-fill", "#FFFFFF", "-pointsize", "16", "-font", "DejaVu-Sans-Bold", "-draw", "text 544,88 'Time: 00:44:18'",

    # Exam banner
    "-fill", "#FFFFFF", "-stroke", "#E2E8F0", "-strokewidth", "1", "-draw", "rectangle 0,118 750,182",
    "-stroke", "none",
    "-fill", "#0F172A", "-pointsize", "18", "-font", "DejaVu-Sans-Bold", "-draw", "text 32,148 'GST 101: Use of English & Communication'",
    "-fill", "#64748B", "-pointsize", "13", "-font", "DejaVu-Sans", "-draw", "text 32,170 'Question 14 of 40 - Continuous Assessment'",

    # Progress
    "-fill", "#E2E8F0", "-draw", "roundrectangle 32,196 718,204 4,4",
    "-fill", "#2563EB", "-draw", "roundrectangle 32,196 280,204 4,4",

    # Question Box
    "-fill", "#FFFFFF", "-draw", "roundrectangle 32,224 718,940 20,20",
    "-fill", "#EFF6FF", "-draw", "roundrectangle 64,254 194,282 6,6",
    "-fill", "#2563EB", "-pointsize", "12", "-font", "DejaVu-Sans-Bold", "-draw", "text 76,273 'MCQ QUESTION'",

    "-fill", "#0F172A", "-pointsize", "22", "-font", "DejaVu-Sans-Bold", "-draw", "text 64,324 'Choose the option that best completes'",
    "-fill", "#0F172A", "-pointsize", "22", "-font", "DejaVu-Sans-Bold", "-draw", "text 64,358 'the sentence below:'",

    "-fill", "#F8FAFC", "-stroke", "#E2E8F0", "-strokewidth", "1", "-draw", "roundrectangle 64,386 686,458 12,12",
    "-stroke", "none",
    "-fill", "#1E293B", "-pointsize", "20", "-font", "DejaVu-Sans-Bold", "-draw", "text 88,430 'Neither the lecturer nor the students ______'",
    "-fill", "#1E293B", "-pointsize", "20", "-font", "DejaVu-Sans-Bold", "-draw", "text 88,456 'present at the orientation hall yesterday.'",

    # Option A
    "-fill", "#FFFFFF", "-stroke", "#CBD5E1", "-strokewidth", "1.5", "-draw", "roundrectangle 64,482 686,556 14,14",
    "-stroke", "none",
    "-fill", "#F1F5F9", "-draw", "circle 106,519 122,519",
    "-fill", "#475569", "-pointsize", "17", "-font", "DejaVu-Sans-Bold", "-draw", "text 98,525 'A'",
    "-fill", "#1E293B", "-pointsize", "19", "-font", "DejaVu-Sans", "-draw", "text 144,526 'was'",

    # Option B (Selected)
    "-fill", "#EFF6FF", "-stroke", "#2563EB", "-strokewidth", "2.5", "-draw", "roundrectangle 64,574 686,648 14,14",
    "-stroke", "none",
    "-fill", "#2563EB", "-draw", "circle 106,611 122,611",
    "-fill", "#FFFFFF", "-pointsize", "17", "-font", "DejaVu-Sans-Bold", "-draw", "text 98,617 'B'",
    "-fill", "#1D4ED8", "-pointsize", "19", "-font", "DejaVu-Sans-Bold", "-draw", "text 144,618 'were'",
    "-fill", "#2563EB", "-draw", "circle 636,611 648,611",

    # Option C
    "-fill", "#FFFFFF", "-stroke", "#CBD5E1", "-strokewidth", "1.5", "-draw", "roundrectangle 64,666 686,740 14,14",
    "-stroke", "none",
    "-fill", "#F1F5F9", "-draw", "circle 106,703 122,703",
    "-fill", "#475569", "-pointsize", "17", "-font", "DejaVu-Sans-Bold", "-draw", "text 98,709 'C'",
    "-fill", "#1E293B", "-pointsize", "19", "-font", "DejaVu-Sans", "-draw", "text 144,710 'is'",

    # Option D
    "-fill", "#FFFFFF", "-stroke", "#CBD5E1", "-strokewidth", "1.5", "-draw", "roundrectangle 64,758 686,832 14,14",
    "-stroke", "none",
    "-fill", "#F1F5F9", "-draw", "circle 106,795 122,795",
    "-fill", "#475569", "-pointsize", "17", "-font", "DejaVu-Sans-Bold", "-draw", "text 98,801 'D'",
    "-fill", "#1E293B", "-pointsize", "19", "-font", "DejaVu-Sans", "-draw", "text 144,802 'are'",

    "-fill", "#64748B", "-pointsize", "13", "-font", "DejaVu-Sans", "-draw", "text 64,880 'Rule of Proximity: Verb agrees with closer plural subject (students -> were)'",

    # PWA Install Prompt Banner
    "-fill", "#1C2541", "-draw", "roundrectangle 32,964 718,1038 14,14",
    "-fill", "#2196F3", "-draw", "circle 72,1001 92,1001",
    "-fill", "#FFFFFF", "-pointsize", "15", "-font", "DejaVu-Sans-Bold", "-draw", "text 108,995 'Install eHub Mobile App'",
    "-fill", "#94A3B8", "-pointsize", "13", "-font", "DejaVu-Sans", "-draw", "text 108,1018 'PWA Offline Capable - Full Exam Support'",
    "-fill", "#10B981", "-draw", "roundrectangle 560,981 696,1021 8,8",
    "-fill", "#FFFFFF", "-pointsize", "14", "-font", "DejaVu-Sans-Bold", "-draw", "text 596,1006 'INSTALL'",

    # Floating Action Buttons
    "-fill", "#E2E8F0", "-draw", "roundrectangle 32,1058 172,1112 12,12",
    "-fill", "#334155", "-pointsize", "17", "-font", "DejaVu-Sans-Bold", "-draw", "text 60,1092 'Prev'",

    "-fill", "#FEF3C7", "-stroke", "#F59E0B", "-strokewidth", "1", "-draw", "roundrectangle 188,1058 308,1112 12,12",
    "-stroke", "none",
    "-fill", "#B45309", "-pointsize", "17", "-font", "DejaVu-Sans-Bold", "-draw", "text 218,1092 'Flag'",

    "-fill", "#2563EB", "-draw", "roundrectangle 324,1058 504,1112 12,12",
    "-fill", "#FFFFFF", "-pointsize", "17", "-font", "DejaVu-Sans-Bold", "-draw", "text 382,1092 'Next'",

    "-fill", "#10B981", "-draw", "roundrectangle 520,1058 718,1112 12,12",
    "-fill", "#FFFFFF", "-pointsize", "17", "-font", "DejaVu-Sans-Bold", "-draw", "text 564,1092 'Submit'",

    # Bottom Nav Bar
    "-fill", "#FFFFFF", "-stroke", "#E2E8F0", "-strokewidth", "1", "-draw", "rectangle 0,1234 750,1334",
    "-stroke", "none",
    "-fill", "#2563EB", "-pointsize", "14", "-font", "DejaVu-Sans-Bold", "-draw", "text 64,1290 'Dashboard'",
    "-fill", "#64748B", "-pointsize", "14", "-font", "DejaVu-Sans", "-draw", "text 256,1290 'Records'",
    "-fill", "#64748B", "-pointsize", "14", "-font", "DejaVu-Sans", "-draw", "text 446,1290 'Library'",
    "-fill", "#64748B", "-pointsize", "14", "-font", "DejaVu-Sans", "-draw", "text 626,1290 'Account'",

    "public/screenshot-mobile.png"
]

subprocess.run(mobile_cmd, check=True)
print("Mobile screenshot generated successfully.")
