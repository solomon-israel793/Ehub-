import subprocess
import os

desktop_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <style>
      .txt { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      .bold { font-weight: 700; }
      .semi { font-weight: 600; }
      .med { font-weight: 500; }
      .shadow { filter: drop-shadow(0 4px 12px rgba(0,0,0,0.06)); }
    </style>
    <linearGradient id="navGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1C2541"/>
      <stop offset="100%" stop-color="#0B132B"/>
    </linearGradient>
    <linearGradient id="pillGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FF9800"/>
      <stop offset="100%" stop-color="#F57C00"/>
    </linearGradient>
    <linearGradient id="greenGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1280" height="720" fill="#F4F7FC"/>

  <!-- Top Navbar -->
  <rect width="1280" height="64" fill="url(#navGrad)"/>
  
  <!-- eHub Brand -->
  <text x="36" y="42" class="txt bold" font-size="28" fill="#2196F3" font-style="italic">e</text>
  <rect x="52" y="22" width="56" height="26" rx="13" fill="url(#pillGrad)"/>
  <text x="63" y="40" class="txt bold" font-size="16" fill="#FFFFFF">hub</text>
  <text x="122" y="40" class="txt semi" font-size="16" fill="#FFFFFF">Academic CBT Operating System</text>

  <!-- Top Nav Session Pill -->
  <rect x="490" y="16" width="300" height="32" rx="16" fill="rgba(255,255,255,0.1)"/>
  <circle cx="508" cy="32" r="5" fill="#10B981"/>
  <text x="522" y="38" class="txt med" font-size="13" fill="#E2E8F0">First Semester Exam Session 2024/2025</text>

  <!-- Top Timer & Profile -->
  <rect x="980" y="14" width="130" height="36" rx="8" fill="#EF4444"/>
  <text x="996" y="38" class="txt bold" font-size="15" fill="#FFFFFF">⏱ 00:44:18</text>

  <circle cx="1140" cy="32" r="18" fill="#3B82F6"/>
  <text x="1134" y="38" class="txt bold" font-size="14" fill="#FFFFFF">JD</text>
  <text x="1168" y="38" class="txt semi" font-size="13" fill="#FFFFFF">Matric: 2024/0912</text>

  <!-- Left Sidebar -->
  <rect x="24" y="84" width="220" height="612" rx="16" fill="#FFFFFF" class="shadow"/>
  <text x="44" y="122" class="txt bold" font-size="12" fill="#94A3B8" letter-spacing="1">PORTAL NAVIGATION</text>

  <!-- Active Item -->
  <rect x="36" y="140" width="196" height="42" rx="10" fill="#EFF6FF"/>
  <rect x="36" y="140" width="4" height="42" rx="2" fill="#2563EB"/>
  <text x="56" y="166" class="txt semi" font-size="14" fill="#1D4ED8">📊 CBT Dashboard</text>

  <text x="56" y="214" class="txt med" font-size="14" fill="#475569">📝 My Tests &amp; Exams</text>
  <text x="56" y="260" class="txt med" font-size="14" fill="#475569">📚 Course Library</text>
  <text x="56" y="306" class="txt med" font-size="14" fill="#475569">🎓 Academic Records</text>
  <text x="56" y="352" class="txt med" font-size="14" fill="#475569">📹 Live Lectures</text>
  <text x="56" y="398" class="txt med" font-size="14" fill="#475569">⚙️ System Settings</text>

  <!-- Offline status indicator card in sidebar -->
  <rect x="38" y="550" width="192" height="126" rx="12" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1"/>
  <circle cx="58" cy="576" r="6" fill="#10B981"/>
  <text x="72" y="580" class="txt bold" font-size="13" fill="#0F172A">PWA Service Worker</text>
  <text x="52" y="604" class="txt" font-size="12" fill="#64748B">Status: Fully Cached &amp; Offline Ready</text>
  <rect x="52" y="626" width="164" height="32" rx="6" fill="#2563EB"/>
  <text x="82" y="647" class="txt bold" font-size="12" fill="#FFFFFF">✓ Installed &amp; Synced</text>

  <!-- Center Stage: Examination -->
  <rect x="264" y="84" width="690" height="612" rx="16" fill="#FFFFFF" class="shadow"/>

  <!-- Exam Header -->
  <path d="M 264 100 Q 264 84 280 84 L 938 84 Q 954 84 954 100 L 954 148 L 264 148 Z" fill="#F8FAFC"/>
  <text x="292" y="116" class="txt bold" font-size="18" fill="#0F172A">CSC 201: Data Structures and Algorithms</text>
  <text x="292" y="138" class="txt med" font-size="13" fill="#64748B">Department of Computer Science • Official Continuous Assessment Test</text>

  <!-- Progress bar -->
  <rect x="292" y="164" width="634" height="6" rx="3" fill="#E2E8F0"/>
  <rect x="292" y="164" width="420" height="6" rx="3" fill="#2563EB"/>
  <text x="292" y="196" class="txt bold" font-size="13" fill="#2563EB">QUESTION 24 OF 50 (Multiple Choice)</text>

  <!-- Question Content -->
  <text x="292" y="234" class="txt semi" font-size="17" fill="#1E293B">In a balanced AVL Tree with n elements, what is the maximum time complexity</text>
  <text x="292" y="260" class="txt semi" font-size="17" fill="#1E293B">to search, insert, and delete a node in the worst-case scenario?</text>

  <!-- Formula callout -->
  <rect x="292" y="280" width="634" height="44" rx="8" fill="#F1F5F9" stroke="#E2E8F0"/>
  <text x="312" y="308" class="txt bold" font-size="15" fill="#0F172A">Formula:  T(n) = O(log₂ n)  where height  h &lt; 1.4404 · log₂(n + 2)</text>

  <!-- Options -->
  <!-- Option A -->
  <rect x="292" y="342" width="634" height="52" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
  <circle cx="320" cy="368" r="12" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.5"/>
  <text x="314" y="373" class="txt bold" font-size="13" fill="#475569">A</text>
  <text x="348" y="373" class="txt med" font-size="15" fill="#334155">O(1) constant time</text>

  <!-- Option B (Selected) -->
  <rect x="292" y="406" width="634" height="52" rx="10" fill="#EFF6FF" stroke="#2563EB" stroke-width="2"/>
  <circle cx="320" cy="432" r="12" fill="#2563EB"/>
  <text x="314" y="437" class="txt bold" font-size="13" fill="#FFFFFF">B</text>
  <text x="348" y="437" class="txt semi" font-size="15" fill="#1D4ED8">O(log n) logarithmic time for all three operations</text>
  <circle cx="896" cy="432" r="10" fill="#2563EB"/>
  <path d="M 891 432 L 895 436 L 902 429" stroke="#FFFFFF" stroke-width="2" fill="none"/>

  <!-- Option C -->
  <rect x="292" y="470" width="634" height="52" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
  <circle cx="320" cy="496" r="12" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.5"/>
  <text x="314" y="501" class="txt bold" font-size="13" fill="#475569">C</text>
  <text x="348" y="501" class="txt med" font-size="15" fill="#334155">O(n) linear search worst-case</text>

  <!-- Option D -->
  <rect x="292" y="534" width="634" height="52" rx="10" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.5"/>
  <circle cx="320" cy="560" r="12" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.5"/>
  <text x="314" y="565" class="txt bold" font-size="13" fill="#475569">D</text>
  <text x="348" y="565" class="txt med" font-size="15" fill="#334155">O(n log n) quadratic factor</text>

  <!-- Bottom Action Bar -->
  <rect x="292" y="618" width="120" height="42" rx="8" fill="#F1F5F9"/>
  <text x="318" y="644" class="txt semi" font-size="14" fill="#475569">◀ Previous</text>

  <rect x="424" y="618" width="110" height="42" rx="8" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1"/>
  <text x="444" y="644" class="txt semi" font-size="14" fill="#B45309">★ Flag</text>

  <rect x="546" y="618" width="120" height="42" rx="8" fill="#2563EB"/>
  <text x="580" y="644" class="txt semi" font-size="14" fill="#FFFFFF">Next ▶</text>

  <rect x="760" y="618" width="166" height="42" rx="8" fill="url(#greenGrad)"/>
  <text x="786" y="644" class="txt bold" font-size="14" fill="#FFFFFF">✓ Submit Test</text>

  <!-- Right Sidebar: Question Palette & AI Proctor -->
  <rect x="976" y="84" width="280" height="612" rx="16" fill="#FFFFFF" class="shadow"/>
  <text x="996" y="122" class="txt bold" font-size="13" fill="#0F172A">QUESTION PALETTE</text>
  <text x="1190" y="122" class="txt semi" font-size="12" fill="#10B981">24 / 50 Done</text>

  <!-- Question Grid 5x5 sample -->
  <!-- Row 1 -->
  <rect x="996" y="142" width="40" height="36" rx="6" fill="#10B981"/><text x="1011" y="165" class="txt bold" font-size="12" fill="#FFF">1</text>
  <rect x="1046" y="142" width="40" height="36" rx="6" fill="#10B981"/><text x="1061" y="165" class="txt bold" font-size="12" fill="#FFF">2</text>
  <rect x="1096" y="142" width="40" height="36" rx="6" fill="#10B981"/><text x="1111" y="165" class="txt bold" font-size="12" fill="#FFF">3</text>
  <rect x="1146" y="142" width="40" height="36" rx="6" fill="#F59E0B"/><text x="1161" y="165" class="txt bold" font-size="12" fill="#FFF">4</text>
  <rect x="1196" y="142" width="40" height="36" rx="6" fill="#10B981"/><text x="1211" y="165" class="txt bold" font-size="12" fill="#FFF">5</text>

  <!-- Row 2 -->
  <rect x="996" y="186" width="40" height="36" rx="6" fill="#10B981"/><text x="1011" y="209" class="txt bold" font-size="12" fill="#FFF">6</text>
  <rect x="1046" y="186" width="40" height="36" rx="6" fill="#10B981"/><text x="1061" y="209" class="txt bold" font-size="12" fill="#FFF">7</text>
  <rect x="1096" y="186" width="40" height="36" rx="6" fill="#10B981"/><text x="1111" y="209" class="txt bold" font-size="12" fill="#FFF">8</text>
  <rect x="1146" y="186" width="40" height="36" rx="6" fill="#10B981"/><text x="1161" y="209" class="txt bold" font-size="12" fill="#FFF">9</text>
  <rect x="1196" y="186" width="40" height="36" rx="6" fill="#10B981"/><text x="1208" y="209" class="txt bold" font-size="12" fill="#FFF">10</text>

  <!-- AI Proctoring Card -->
  <rect x="996" y="340" width="240" height="320" rx="12" fill="#0B132B"/>
  <text x="1016" y="374" class="txt bold" font-size="13" fill="#38BDF8">🛡️ eHub AI PROCTOR MONITOR</text>
  
  <rect x="1016" y="394" width="200" height="130" rx="8" fill="#1E293B"/>
  <circle cx="1116" cy="450" r="30" fill="#334155"/>
  <circle cx="1116" cy="442" r="14" fill="#94A3B8"/>
  <path d="M 1098 472 Q 1116 462 1134 472" fill="#94A3B8"/>
  <circle cx="1032" cy="410" r="4" fill="#10B981"/>
  <text x="1044" y="414" class="txt semi" font-size="10" fill="#10B981">LIVE STREAM</text>

  <text x="1016" y="550" class="txt semi" font-size="12" fill="#E2E8F0">Student Face: Verified ✓</text>
  <text x="1016" y="574" class="txt semi" font-size="12" fill="#E2E8F0">Tab Lock: No violations</text>
  <text x="1016" y="598" class="txt semi" font-size="12" fill="#E2E8F0">Background Noise: Silent</text>
  <text x="1016" y="628" class="txt bold" font-size="12" fill="#10B981">Integrity Score: 100%</text>
</svg>"""

mobile_svg = """<svg xmlns="http://www.w3.org/2000/svg" width="750" height="1334" viewBox="0 0 750 1334">
  <defs>
    <style>
      .txt { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      .bold { font-weight: 700; }
      .semi { font-weight: 600; }
      .med { font-weight: 500; }
      .shadow { filter: drop-shadow(0 4px 16px rgba(0,0,0,0.08)); }
    </style>
    <linearGradient id="mNavGrad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1C2541"/>
      <stop offset="100%" stop-color="#0B132B"/>
    </linearGradient>
    <linearGradient id="pillGradM" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FF9800"/>
      <stop offset="100%" stop-color="#F57C00"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="750" height="1334" fill="#F4F7FC"/>

  <!-- Mobile Status Bar -->
  <rect width="750" height="44" fill="#1C2541"/>
  <text x="44" y="30" class="txt bold" font-size="16" fill="#FFFFFF">09:41</text>
  <text x="630" y="30" class="txt semi" font-size="16" fill="#FFFFFF">5G  100%</text>

  <!-- App Bar -->
  <rect y="44" width="750" height="74" fill="url(#mNavGrad)"/>
  
  <!-- eHub Brand -->
  <text x="32" y="92" class="txt bold" font-size="32" fill="#2196F3" font-style="italic">e</text>
  <rect x="52" y="68" width="64" height="30" rx="15" fill="url(#pillGradM)"/>
  <text x="64" y="90" class="txt bold" font-size="18" fill="#FFFFFF">hub</text>

  <!-- Timer badge -->
  <rect x="520" y="64" width="190" height="36" rx="8" fill="#EF4444"/>
  <text x="544" y="88" class="txt bold" font-size="16" fill="#FFFFFF">⏱ 00:44:18</text>

  <!-- Subject Title Bar -->
  <rect y="118" width="750" height="64" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
  <text x="32" y="146" class="txt bold" font-size="18" fill="#0F172A">GST 101: Use of English &amp; Communication</text>
  <text x="32" y="168" class="txt med" font-size="13" fill="#64748B">Question 14 of 40 • Continuous Assessment</text>

  <!-- Progress bar -->
  <rect x="32" y="196" width="686" height="8" rx="4" fill="#E2E8F0"/>
  <rect x="32" y="196" width="240" height="8" rx="4" fill="#2563EB"/>

  <!-- Question Card -->
  <rect x="32" y="224" width="686" height="720" rx="20" fill="#FFFFFF" class="shadow"/>

  <!-- Question Tag -->
  <rect x="64" y="254" width="130" height="28" rx="6" fill="#EFF6FF"/>
  <text x="76" y="273" class="txt bold" font-size="12" fill="#2563EB">MCQ QUESTION</text>

  <text x="64" y="324" class="txt semi" font-size="22" fill="#0F172A">Choose the option that best completes</text>
  <text x="64" y="358" class="txt semi" font-size="22" fill="#0F172A">the sentence below:</text>

  <rect x="64" y="386" width="622" height="72" rx="12" fill="#F8FAFC" stroke="#E2E8F0"/>
  <text x="88" y="430" class="txt semi" font-size="20" fill="#1E293B">"Neither the lecturer nor the students ______</text>
  <text x="88" y="456" class="txt semi" font-size="20" fill="#1E293B">present at the orientation hall yesterday."</text>

  <!-- Option A -->
  <rect x="64" y="482" width="622" height="74" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
  <circle cx="106" cy="519" r="16" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1.5"/>
  <text x="98" y="525" class="txt bold" font-size="17" fill="#475569">A</text>
  <text x="144" y="526" class="txt med" font-size="19" fill="#1E293B">was</text>

  <!-- Option B (Selected) -->
  <rect x="64" y="574" width="622" height="74" rx="14" fill="#EFF6FF" stroke="#2563EB" stroke-width="2.5"/>
  <circle cx="106" cy="611" r="16" fill="#2563EB"/>
  <text x="98" y="617" class="txt bold" font-size="17" fill="#FFFFFF">B</text>
  <text x="144" y="618" class="txt bold" font-size="19" fill="#1D4ED8">were</text>
  <circle cx="636" cy="611" r="12" fill="#2563EB"/>
  <path d="M 630 611 L 634 615 L 642 607" stroke="#FFFFFF" stroke-width="2.5" fill="none"/>

  <!-- Option C -->
  <rect x="64" y="666" width="622" height="74" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
  <circle cx="106" cy="703" r="16" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1.5"/>
  <text x="98" y="709" class="txt bold" font-size="17" fill="#475569">C</text>
  <text x="144" y="710" class="txt med" font-size="19" fill="#1E293B">is</text>

  <!-- Option D -->
  <rect x="64" y="758" width="622" height="74" rx="14" fill="#FFFFFF" stroke="#CBD5E1" stroke-width="1.5"/>
  <circle cx="106" cy="795" r="16" fill="#F1F5F9" stroke="#94A3B8" stroke-width="1.5"/>
  <text x="98" y="801" class="txt bold" font-size="17" fill="#475569">D</text>
  <text x="144" y="802" class="txt med" font-size="19" fill="#1E293B">are</text>

  <!-- Explanation note -->
  <text x="64" y="874" class="txt med" font-size="13" fill="#64748B">Rule of Proximity: The verb agrees with the closer subject ("students" -&gt; plural).</text>

  <!-- PWA Install Banner -->
  <rect x="32" y="964" width="686" height="74" rx="14" fill="#1C2541"/>
  <circle cx="72" cy="1001" r="20" fill="#2196F3"/>
  <text x="66" y="1007" class="txt bold" font-size="16" fill="#FFFFFF">📥</text>
  <text x="108" y="995" class="txt bold" font-size="15" fill="#FFFFFF">Install eHub App</text>
  <text x="108" y="1017" class="txt" font-size="13" fill="#94A3B8">PWA 100% Offline Capable • Fast Access</text>
  <rect x="560" y="981" width="136" height="40" rx="8" fill="#10B981"/>
  <text x="590" y="1006" class="txt bold" font-size="14" fill="#FFFFFF">INSTALL</text>

  <!-- Floating Action Buttons -->
  <rect x="32" y="1058" width="140" height="54" rx="12" fill="#E2E8F0"/>
  <text x="64" y="1092" class="txt semi" font-size="17" fill="#334155">◀ Prev</text>

  <rect x="188" y="1058" width="120" height="54" rx="12" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1"/>
  <text x="220" y="1092" class="txt semi" font-size="17" fill="#B45309">★ Flag</text>

  <rect x="324" y="1058" width="180" height="54" rx="12" fill="#2563EB"/>
  <text x="372" y="1092" class="txt semi" font-size="17" fill="#FFFFFF">Next ▶</text>

  <rect x="520" y="1058" width="198" height="54" rx="12" fill="#10B981"/>
  <text x="554" y="1092" class="txt bold" font-size="17" fill="#FFFFFF">✓ Submit</text>

  <!-- Bottom Mobile Nav Tabbar -->
  <rect y="1234" width="750" height="100" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
  <text x="80" y="1275" class="txt bold" font-size="24" fill="#2563EB">📊</text>
  <text x="68" y="1302" class="txt semi" font-size="12" fill="#2563EB">Dashboard</text>

  <text x="260" y="1275" class="txt bold" font-size="24" fill="#64748B">📝</text>
  <text x="252" y="1302" class="txt med" font-size="12" fill="#64748B">Records</text>

  <text x="440" y="1275" class="txt bold" font-size="24" fill="#64748B">📚</text>
  <text x="435" y="1302" class="txt med" font-size="12" fill="#64748B">Library</text>

  <text x="620" y="1275" class="txt bold" font-size="24" fill="#64748B">👤</text>
  <text x="612" y="1302" class="txt med" font-size="12" fill="#64748B">Account</text>
</svg>"""

os.makedirs("public", exist_ok=True)

with open("public/screenshot-desktop.svg", "w") as f:
    f.write(desktop_svg)

with open("public/screenshot-mobile.svg", "w") as f:
    f.write(mobile_svg)

print("SVG screenshots generated in public/")
