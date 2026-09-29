/**
 * CampusConnect – script.js
 * Web Services & SOA Lab – Assignment 1
 *
 * JavaScript Features Implemented:
 *  1. Theme Switch (Dark / Light)
 *  2. Greeting based on time of day
 *  3. Live Current Date & Time display
 *  4. Global Search / Filter with dropdown
 *  5. Expand / Collapse Announcements
 *  6. Notification counter & panel
 *  7. Show / Hide sections (toggle)
 *  8. Service Modal popup
 *  9. Toast notifications
 * 10. Active nav-link on scroll
 * 11. Navbar scroll shadow
 * 12. Hamburger mobile menu
 * 13. Timetable day label (dynamic)
 */

'use strict';

/* ====================================================
   1. THEME SWITCH
   ==================================================== */
const themeToggle = document.getElementById('theme-toggle');
const themeIcon   = document.getElementById('theme-icon');
const html        = document.documentElement;

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('cc-theme', theme);
  if (theme === 'dark') {
    themeIcon.className = 'fas fa-sun';
    themeToggle.style.color = '#ffd700';
  } else {
    themeIcon.className = 'fas fa-moon';
    themeToggle.style.color = '#6c63ff';
  }
}

// Load saved theme or default dark
applyTheme(localStorage.getItem('cc-theme') || 'dark');

themeToggle.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  const next    = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  showToast(`Switched to ${next === 'dark' ? '🌙 Dark' : '☀️ Light'} Mode`);
});

/* ====================================================
   2. GREETING BASED ON TIME
   ==================================================== */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5  && hour < 12) return { text: '🌅 Good Morning',  icon: 'fa-sun' };
  if (hour >= 12 && hour < 17) return { text: '☀️ Good Afternoon', icon: 'fa-cloud-sun' };
  if (hour >= 17 && hour < 21) return { text: '🌆 Good Evening',  icon: 'fa-sunset' };
  return { text: '🌙 Good Night', icon: 'fa-moon' };
}

const greetingEl = document.getElementById('greeting-tag');
function updateGreeting() {
  const g = getGreeting();
  greetingEl.innerHTML = `<i class="fas ${g.icon}"></i> ${g.text}`;
}
updateGreeting();

/* ====================================================
   3. LIVE DATE & TIME
   ==================================================== */
const liveDate = document.getElementById('live-date');
const liveTime = document.getElementById('live-time');
const liveDay  = document.getElementById('live-day');

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function pad(n) { return String(n).padStart(2, '0'); }

function updateClock() {
  const now = new Date();
  const h   = now.getHours();
  const m   = now.getMinutes();
  const s   = now.getSeconds();
  const ampm= h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;

  liveDate.textContent = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  liveTime.textContent = `${pad(h12)}:${pad(m)}:${pad(s)} ${ampm}`;
  liveDay.textContent  = DAYS[now.getDay()];
}

updateClock();
setInterval(updateClock, 1000);

// Dynamic timetable day label
const ttDayLabel = document.getElementById('timetable-day-label');
if (ttDayLabel) {
  ttDayLabel.textContent = `${DAYS[new Date().getDay()]} Schedule`;
}

/* ====================================================
   4. GLOBAL SEARCH / FILTER
   ==================================================== */
const searchInput    = document.getElementById('global-search');
const searchDropdown = document.getElementById('search-dropdown');

const SEARCH_DATA = [
  { icon: 'fa-clipboard-list',  label: 'Attendance',          section: '#timetable',     api: 'GET /attendance' },
  { icon: 'fa-book-open',       label: 'Courses',             section: '#dashboard',     api: 'GET /courses' },
  { icon: 'fa-tasks',           label: 'Assignments',         section: '#dashboard',     api: 'GET /assignments' },
  { icon: 'fa-file-signature',  label: 'Exams Schedule',      section: '#announcements', api: 'GET /exams' },
  { icon: 'fa-star',            label: 'CGPA / Results',      section: '#dashboard',     api: 'GET /results' },
  { icon: 'fa-credit-card',     label: 'Fee Payment',         section: '#services',      api: 'POST /payment' },
  { icon: 'fa-scroll',          label: 'Transcript Download', section: '#services',      api: 'GET /transcript' },
  { icon: 'fa-book',            label: 'Library Portal',      section: '#services',      api: 'GET /library' },
  { icon: 'fa-calendar-week',   label: 'Timetable',           section: '#timetable',     api: 'GET /timetable' },
  { icon: 'fa-bullhorn',        label: 'Announcements',       section: '#announcements', api: 'GET /announcements' },
  { icon: 'fa-calendar-alt',    label: 'Upcoming Events',     section: '#events',        api: 'GET /events' },
  { icon: 'fa-user-plus',       label: 'Course Registration', section: '#services',      api: 'POST /register' },
  { icon: 'fa-building',        label: 'Hostel Services',     section: '#services',      api: 'GET /hostel' },
];

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  if (!q) { searchDropdown.classList.remove('active'); return; }

  const matches = SEARCH_DATA.filter(d => d.label.toLowerCase().includes(q));
  if (!matches.length) { searchDropdown.classList.remove('active'); return; }

  searchDropdown.innerHTML = matches
    .slice(0, 6)
    .map(d => `
      <div class="search-result-item" onclick="goToSection('${d.section}')">
        <i class="fas ${d.icon}"></i>
        <div>
          <div>${d.label}</div>
          <small style="color:var(--text-muted);font-family:monospace">${d.api}</small>
        </div>
      </div>
    `).join('');
  searchDropdown.classList.add('active');
});

function goToSection(sectionId) {
  const el = document.querySelector(sectionId);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  searchDropdown.classList.remove('active');
  searchInput.value = '';
}

// Close dropdown on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('#nav-search-container')) {
    searchDropdown.classList.remove('active');
  }
});

/* ====================================================
   5. EXPAND / COLLAPSE ANNOUNCEMENTS
   ==================================================== */
window.toggleAnnouncement = function(cardId) {
  const card    = document.getElementById(cardId);
  const body    = card.querySelector('.ann-body');
  const header  = card.querySelector('.ann-header');
  const chevron = card.querySelector('.ann-chevron');
  const isOpen  = !body.classList.contains('collapsed');

  if (isOpen) {
    body.classList.add('collapsed');
    header.setAttribute('aria-expanded', 'false');
    chevron.style.transform = 'rotate(0deg)';
  } else {
    body.classList.remove('collapsed');
    header.setAttribute('aria-expanded', 'true');
    chevron.style.transform = 'rotate(180deg)';
  }
};

// Initialize chevron state on page load
document.querySelectorAll('.announcement-card').forEach(card => {
  const body    = card.querySelector('.ann-body');
  const chevron = card.querySelector('.ann-chevron');
  if (!body.classList.contains('collapsed')) {
    chevron.style.transform = 'rotate(180deg)';
  }
});

// Keyboard accessibility for announcement headers
document.querySelectorAll('.ann-header').forEach(header => {
  header.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      header.click();
    }
  });
});

/* ====================================================
   6. NOTIFICATION COUNTER & PANEL
   ==================================================== */
let notifCount = 4;

function updateNotifBadge() {
  const badge    = document.getElementById('notif-badge');
  const cardVal  = document.getElementById('notif-count-card');
  if (notifCount > 0) {
    badge.textContent  = notifCount;
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
  if (cardVal) cardVal.textContent = notifCount;
}

// Toggle notification panel
const navNotif  = document.getElementById('nav-notifications');
const notifPanel= document.getElementById('notif-panel');

navNotif.addEventListener('click', (e) => {
  e.preventDefault();
  const isOpen = notifPanel.classList.contains('open');
  notifPanel.classList.toggle('open');
  notifPanel.setAttribute('aria-hidden', String(isOpen));
});

// Mark all as read
document.getElementById('mark-all-read').addEventListener('click', () => {
  document.querySelectorAll('.notif-item.unread').forEach(item => item.classList.remove('unread'));
  notifCount = 0;
  updateNotifBadge();
  showToast('✅ All notifications marked as read');
});

// Close notif panel on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.nav-notif') && !e.target.closest('#notif-panel')) {
    notifPanel.classList.remove('open');
  }
});

updateNotifBadge();

/* ====================================================
   7. SHOW / HIDE SECTIONS (Toggle)
   ==================================================== */
const toggleMap = {
  'toggle-dashboard':     'dashboard-grid',
  'toggle-students':      'students-list-grid',
  'toggle-timetable':     'timetable-body',
  'toggle-announcements': 'announcements-list',
  'toggle-events':        'events-list',
  'toggle-services':      'services-grid',
};

Object.entries(toggleMap).forEach(([btnId, targetId]) => {
  const btn    = document.getElementById(btnId);
  const target = document.getElementById(targetId);
  if (!btn || !target) return;

  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    target.classList.toggle('hidden');
    const label = expanded ? 'Expand' : 'Collapse';
    showToast(`Section ${label === 'Expand' ? 'collapsed' : 'expanded'}`);
  });
});

/* ====================================================
   8. SERVICE MODAL
   ==================================================== */
const SERVICE_INFO = {
  'svc-attendance':   { icon: 'fa-clipboard-list', title: 'Attendance Tracker',    desc: 'View your subject-wise attendance, percentage, and detailed logs. Alerts for below 75% threshold.',     api: 'GET /api/v1/attendance?studentId={id}' },
  'svc-registration': { icon: 'fa-user-plus',      title: 'Course Registration',   desc: 'Register for elective courses, add/drop subjects, and manage your academic schedule for this semester.', api: 'POST /api/v1/register' },
  'svc-fee':          { icon: 'fa-credit-card',    title: 'Fee Payment Portal',    desc: 'Pay semester fees, view receipts, and check outstanding dues. Supports UPI, Net Banking & Cards.',       api: 'POST /api/v1/payment' },
  'svc-transcript':   { icon: 'fa-scroll',         title: 'Transcript Download',   desc: 'Generate and download official academic transcripts, grade cards and semester mark sheets as PDF.',      api: 'GET /api/v1/transcript?studentId={id}' },
  'svc-library':      { icon: 'fa-book',           title: 'Library Portal',        desc: 'Search books, renew issued books, reserve resources, access e-journals and study materials online.',     api: 'GET /api/v1/library/search' },
  'svc-timetable':    { icon: 'fa-calendar-week',  title: 'Full Timetable',        desc: 'View your complete weekly class schedule, lab sessions, and exam timetable for the current semester.',    api: 'GET /api/v1/timetable?studentId={id}' },
  'svc-results':      { icon: 'fa-poll-h',         title: 'Exam Results',          desc: 'Check semester-wise results, SGPA, CGPA, backlogs, and subject-level performance analytics.',           api: 'GET /api/v1/results?studentId={id}' },
  'svc-hostel':       { icon: 'fa-building',       title: 'Hostel Services',       desc: 'View hostel allotment, pay hostel fees, raise maintenance complaints and view room details.',            api: 'GET /api/v1/hostel?studentId={id}' },
};

const modalOverlay = document.getElementById('modal-overlay');
const modalClose   = document.getElementById('modal-close');
const modalIcon    = document.getElementById('modal-icon');
const modalTitle   = document.getElementById('modal-title');
const modalBody    = document.getElementById('modal-body');
const modalApiLabel= document.getElementById('modal-api-label');
const modalActBtn  = document.getElementById('modal-action-btn');

function openModal(svcId) {
  const info = SERVICE_INFO[svcId];
  if (!info) return;
  modalIcon.innerHTML   = `<i class="fas ${info.icon}"></i>`;
  modalTitle.textContent = info.title;
  modalBody.textContent  = info.desc;
  modalApiLabel.textContent = `🔗 Future API: ${info.api}`;
  modalOverlay.classList.add('open');
  modalOverlay.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modalOverlay.classList.remove('open');
  modalOverlay.setAttribute('aria-hidden', 'true');
}

// Attach modal to service cards
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('click', () => openModal(card.id));
});

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

modalActBtn.addEventListener('click', () => {
  showToast('🚀 Service launching... (Mock — Backend integration pending)');
  closeModal();
});

/* ====================================================
   9. TOAST NOTIFICATIONS
   ==================================================== */
let toastTimer;
const toastEl = document.getElementById('toast');

function showToast(message, duration = 3000) {
  clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.classList.add('show');
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), duration);
}

/* ====================================================
   10. ACTIVE NAV LINK ON SCROLL
   ==================================================== */
const sections    = document.querySelectorAll('section[id], main[id]');
const navLinksAll = document.querySelectorAll('.nav-links .nav-link');

const observerOptions = { root: null, rootMargin: '-40% 0px -55% 0px', threshold: 0 };
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinksAll.forEach(link => link.classList.remove('active'));
      const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, observerOptions);

sections.forEach(sec => sectionObserver.observe(sec));

/* ====================================================
   11. NAVBAR SCROLL SHADOW
   ==================================================== */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

/* ====================================================
   12. HAMBURGER / MOBILE MENU
   ==================================================== */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');

hamburger.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', String(isOpen));
  // Animate hamburger
  const spans = hamburger.querySelectorAll('span');
  if (isOpen) {
    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
    spans[1].style.opacity   = '0';
    spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
  } else {
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  }
});

// Close mobile nav on link click
navLinksAll.forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    const spans = hamburger.querySelectorAll('span');
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
  });
});

/* ====================================================
   13. DYNAMIC WELCOME — update greeting each minute
   ==================================================== */
setInterval(updateGreeting, 60 * 1000);

/* ====================================================
   14. LAB 3: STUDENT MANAGEMENT REST API MODULE (Express.js)
   Connected Endpoints (Port 3000):
     - GET    /students       (List all students)
     - GET    /students/:id   (Get student details)
     - POST   /students       (Create new student)
     - PUT    /students/:id   (Replace student)
     - PATCH  /students/:id   (Partial update)
     - DELETE /students/:id   (Delete student)
   ==================================================== */

const API_BASE = (window.location.protocol.startsWith('http') && window.location.port === '3000')
  ? window.location.origin
  : 'http://localhost:3000';

let studentsData = [];
let pollingInterval = null;
let isPollingActive = true;
let lastStudentsSignature = '';

// --- A. FETCH & RENDER ALL STUDENTS (GET /students) ---
async function fetchStudents(silent = false) {
  const container       = document.getElementById('students-list-grid');
  const statusIndicator = document.getElementById('api-status-indicator');
  const statusText      = document.getElementById('api-status-text');
  const summaryVal      = document.getElementById('students-summary-val');
  const summarySub      = document.getElementById('students-summary-sub');
  const summaryTag      = document.getElementById('students-summary-tag');

  if (!silent && container) {
    container.innerHTML = `
      <div class="api-loading-state" style="grid-column: 1 / -1;">
        <i class="fas fa-circle-notch spinner-icon"></i>
        <p>Connecting to REST API: GET ${API_BASE}/students...</p>
      </div>
    `;
  }

  try {
    const response = await fetch(`${API_BASE}/students`);

    if (!response.ok) {
      throw new Error(`API Error: Status ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    const list = json.data || [];

    // Check if data actually changed (to avoid unnecessary DOM re-renders during live polling)
    const currentSignature = JSON.stringify(list);
    const hasChanged = currentSignature !== lastStudentsSignature;

    if (hasChanged || !silent) {
      const prevLength = studentsData.length;
      studentsData = list;
      lastStudentsSignature = currentSignature;

      // Update Summary card
      if (summaryVal) summaryVal.textContent = list.length;
      if (summarySub) summarySub.textContent = `Live: GET /students (${list.length} records)`;
      if (summaryTag) {
        summaryTag.textContent = '● Live API';
        summaryTag.style.color = 'var(--success)';
      }

      // Update API status badge
      if (statusIndicator) {
        statusIndicator.className = 'api-endpoint-badge live-badge';
        if (statusText) statusText.innerHTML = `Connected: GET ${API_BASE}/students (200 OK)`;
      }

      renderStudents(studentsData);

      if (silent && prevLength > 0 && list.length > prevLength) {
        showToast(`🎉 New student detected from Swagger / REST API! (${list.length} total)`);
      } else if (!silent) {
        showToast(`🎓 Loaded ${list.length} students from REST API`);
      }
    }
  } catch (error) {
    console.error('Error fetching students:', error);
    if (statusIndicator) {
      statusIndicator.className = 'api-endpoint-badge';
      statusIndicator.style.background = 'rgba(255, 107, 107, 0.15)';
      statusIndicator.style.borderColor = 'rgba(255, 107, 107, 0.3)';
      statusIndicator.style.color = 'var(--danger)';
      if (statusText) statusText.innerHTML = `<i class="fas fa-exclamation-triangle"></i> REST API Offline: Ensure 'node server.js' is running on port 3000`;
    }
    if (summaryTag) {
      summaryTag.textContent = '● Offline';
      summaryTag.style.color = 'var(--danger)';
    }

    if (!silent && container) {
      container.innerHTML = `
        <div class="api-error-box" style="grid-column: 1 / -1;">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Unable to connect to Student REST API at <code>${API_BASE}/students</code>.</p>
          <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:1rem;">
            Make sure the server is started with <code>node server.js</code> in the <code>student-api</code> folder.
          </p>
          <button class="retry-btn" onclick="fetchStudents()">
            <i class="fas fa-sync-alt"></i> Retry Connection
          </button>
        </div>
      `;
    }
  }
}

// Render student cards
function renderStudents(list) {
  const container = document.getElementById('students-list-grid');
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="api-loading-state" style="grid-column: 1 / -1;">
        <i class="fas fa-user-slash" style="font-size:2rem;color:var(--text-muted);margin-bottom:0.5rem;"></i>
        <p>No students found matching your criteria.</p>
        <button class="btn-primary-sm" style="margin-top:0.75rem;" onclick="openAddStudentModal()">
          <i class="fas fa-plus"></i> Add Student
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(s => {
    const initials = s.name
      ? s.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
      : 'ST';

    return `
      <div class="student-card" id="student-card-${s.id}">
        <div>
          <div class="student-card-header">
            <div class="student-avatar">${escapeHTML(initials)}</div>
            <div class="student-info-top">
              <div class="student-name-row">
                <span class="student-card-name" title="${escapeHTML(s.name)}">${escapeHTML(s.name)}</span>
                <span class="student-id-pill">ID #${s.id}</span>
              </div>
              <span class="student-card-email" title="${escapeHTML(s.email)}">
                <i class="fas fa-envelope"></i> ${escapeHTML(s.email)}
              </span>
            </div>
          </div>

          <div class="student-card-body">
            <div class="student-card-course">
              <i class="fas fa-graduation-cap" style="color:var(--primary-light)"></i>
              <span>${escapeHTML(s.course)}</span>
            </div>
            <span class="student-sem-badge">Sem ${s.semester}</span>
          </div>
        </div>

        <div class="student-card-footer">
          <span class="student-endpoint-label">/students/${s.id}</span>
          <div class="student-action-btns">
            <button class="btn-edit-student" title="Edit Student (PUT /students/${s.id})" onclick="openEditStudentModal(${s.id})">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn-delete-student" title="Delete Student (DELETE /students/${s.id})" onclick="handleDeleteStudent(${s.id}, '${escapeHTML(s.name).replace(/'/g, "\\'")}')">
              <i class="fas fa-trash-alt"></i> Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// --- B. STUDENT SEARCH FILTER ---
const studentsSearchInput = document.getElementById('students-search-input');
if (studentsSearchInput) {
  studentsSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      renderStudents(studentsData);
      return;
    }
    const filtered = studentsData.filter(s =>
      (s.name && s.name.toLowerCase().includes(query)) ||
      (s.email && s.email.toLowerCase().includes(query)) ||
      (s.course && s.course.toLowerCase().includes(query)) ||
      (String(s.semester) === query) ||
      (String(s.id) === query)
    );
    renderStudents(filtered);
  });
}

// --- C. STUDENT PROFILE API (GET /students/1) ---
async function fetchStudentProfile() {
  const profileBadgeBox = document.getElementById('profile-api-badge');
  const studentNameEl    = document.getElementById('student-name');
  const emailChip        = document.getElementById('profile-email');
  const courseChip       = document.getElementById('profile-course');
  const semChip          = document.getElementById('profile-semester');

  try {
    if (profileBadgeBox) {
      profileBadgeBox.innerHTML = `<i class="fas fa-sync-alt fa-spin"></i> Fetching /students/1...`;
      profileBadgeBox.style.color = 'var(--warning)';
    }

    const response = await fetch(`${API_BASE}/students/1`);

    if (!response.ok) {
      throw new Error(`Profile API error: Status ${response.status}`);
    }

    const json = await response.json();
    const student = json.data;

    if (student) {
      if (studentNameEl) studentNameEl.textContent = student.name;
      if (emailChip) emailChip.innerHTML = `<i class="fas fa-envelope"></i> Email: <strong>${escapeHTML(student.email)}</strong>`;
      if (courseChip) courseChip.innerHTML = `<i class="fas fa-graduation-cap"></i> Course: <strong>${escapeHTML(student.course)}</strong>`;
      if (semChip) semChip.innerHTML = `<i class="fas fa-circle"></i> Semester ${student.semester}`;
      if (profileBadgeBox) {
        profileBadgeBox.innerHTML = `<i class="fas fa-check-circle" style="color:var(--success)"></i> REST API 200 OK: GET /students/1`;
        profileBadgeBox.style.color = 'var(--accent)';
      }
    }
  } catch (error) {
    console.error('Error fetching student profile:', error);
    if (profileBadgeBox) {
      profileBadgeBox.innerHTML = `<i class="fas fa-info-circle"></i> Local Profile (REST API /students/1)`;
    }
  }
}

// --- D. ADD / EDIT STUDENT MODAL CONTROLS ---
const studentModalOverlay = document.getElementById('student-modal-overlay');
const studentModalClose   = document.getElementById('student-modal-close');
const studentForm         = document.getElementById('student-form');
const studentFormCancel   = document.getElementById('student-form-cancel-btn');
const studentFormError    = document.getElementById('student-form-error');

function openAddStudentModal() {
  if (!studentModalOverlay) return;
  document.getElementById('student-modal-title').textContent = 'Add New Student';
  document.getElementById('student-modal-subtitle').innerHTML = 'Will trigger <span class="method-tag post">POST</span> <code>' + API_BASE + '/students</code>';
  document.getElementById('student-form-id').value = '';
  document.getElementById('student-form-name').value = '';
  document.getElementById('student-form-email').value = '';
  document.getElementById('student-form-course').value = '';
  document.getElementById('student-form-semester').value = '';
  document.getElementById('student-submit-btn-text').textContent = 'Create Student';
  if (studentFormError) {
    studentFormError.style.display = 'none';
    studentFormError.textContent = '';
  }

  studentModalOverlay.classList.add('open');
  studentModalOverlay.setAttribute('aria-hidden', 'false');
  setTimeout(() => document.getElementById('student-form-name')?.focus(), 100);
}

function openEditStudentModal(id) {
  const student = studentsData.find(s => s.id === id);
  if (!student || !studentModalOverlay) return;

  document.getElementById('student-modal-title').textContent = `Edit Student #${student.id}`;
  document.getElementById('student-modal-subtitle').innerHTML = `Will trigger <span class="method-tag put">PUT</span> <code>${API_BASE}/students/${student.id}</code>`;
  document.getElementById('student-form-id').value = student.id;
  document.getElementById('student-form-name').value = student.name;
  document.getElementById('student-form-email').value = student.email;
  document.getElementById('student-form-course').value = student.course;
  document.getElementById('student-form-semester').value = student.semester;
  document.getElementById('student-submit-btn-text').textContent = 'Save Changes';
  if (studentFormError) {
    studentFormError.style.display = 'none';
    studentFormError.textContent = '';
  }

  studentModalOverlay.classList.add('open');
  studentModalOverlay.setAttribute('aria-hidden', 'false');
  setTimeout(() => document.getElementById('student-form-name')?.focus(), 100);
}

function closeStudentModal() {
  if (studentModalOverlay) {
    studentModalOverlay.classList.remove('open');
    studentModalOverlay.setAttribute('aria-hidden', 'true');
  }
}

if (studentModalClose) studentModalClose.addEventListener('click', closeStudentModal);
if (studentFormCancel) studentFormCancel.addEventListener('click', closeStudentModal);
if (studentModalOverlay) {
  studentModalOverlay.addEventListener('click', (e) => {
    if (e.target === studentModalOverlay) closeStudentModal();
  });
}

// Handle Form Submit (POST / PUT)
if (studentForm) {
  studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (studentFormError) studentFormError.style.display = 'none';

    const id       = document.getElementById('student-form-id').value;
    const name     = document.getElementById('student-form-name').value.trim();
    const email    = document.getElementById('student-form-email').value.trim();
    const course   = document.getElementById('student-form-course').value.trim();
    const semester = parseInt(document.getElementById('student-form-semester').value);

    const payload = { name, email, course, semester };
    const isEdit  = Boolean(id);
    const url     = isEdit ? `${API_BASE}/students/${id}` : `${API_BASE}/students`;
    const method  = isEdit ? 'PUT' : 'POST';

    const submitBtn = document.getElementById('student-form-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Saving...`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = (result.errors && Array.isArray(result.errors))
          ? result.errors.join('<br>')
          : (result.message || 'Failed to save student');
        throw new Error(errorMsg);
      }

      closeStudentModal();
      showToast(isEdit ? `✏️ Student "${name}" updated successfully (PUT 200 OK)` : `🎉 Student "${name}" created successfully (POST 201 Created)`);
      fetchStudents();
      fetchStudentProfile();
    } catch (err) {
      console.error('Save student error:', err);
      if (studentFormError) {
        studentFormError.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${err.message}`;
        studentFormError.style.display = 'block';
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fas fa-save"></i> <span id="student-submit-btn-text">${isEdit ? 'Save Changes' : 'Create Student'}</span>`;
      }
    }
  });
}

// --- E. DELETE STUDENT (DELETE /students/:id) ---
async function handleDeleteStudent(id, name) {
  const confirmed = window.confirm(`Are you sure you want to delete student "${name}" (ID #${id})?\nThis will send a DELETE request to ${API_BASE}/students/${id}.`);
  if (!confirmed) return;

  try {
    const response = await fetch(`${API_BASE}/students/${id}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `Failed to delete student ID ${id}`);
    }

    showToast(`🗑️ Student "${name}" deleted successfully (DELETE 200 OK)`);
    fetchStudents();
    fetchStudentProfile();
  } catch (err) {
    console.error('Delete student error:', err);
    showToast(`⚠️ Delete failed: ${err.message}`, 4000);
  }
}

// --- F. LIVE SYNC POLLING (Auto-detects Swagger UI additions) ---
function startLiveSync() {
  if (pollingInterval) clearInterval(pollingInterval);
  // Poll every 3.5 seconds
  pollingInterval = setInterval(() => {
    if (isPollingActive) {
      fetchStudents(true); // Silent sync
    }
  }, 3500);
}

function togglePolling() {
  isPollingActive = !isPollingActive;
  const pollStatus = document.getElementById('polling-status');
  const pollBtn    = document.getElementById('toggle-polling-btn');

  if (isPollingActive) {
    if (pollStatus) {
      pollStatus.textContent = 'Active (Auto-updates)';
      pollStatus.style.color = 'var(--success)';
    }
    if (pollBtn) pollBtn.innerHTML = `<i class="fas fa-pause"></i> <span>Pause Sync</span>`;
    showToast('📡 Live Auto-Sync Resumed');
    fetchStudents();
  } else {
    if (pollStatus) {
      pollStatus.textContent = 'Paused';
      pollStatus.style.color = 'var(--warning)';
    }
    if (pollBtn) pollBtn.innerHTML = `<i class="fas fa-play"></i> <span>Resume Sync</span>`;
    showToast('⏸️ Live Auto-Sync Paused');
  }
}

// --- G. LAB 2 COMPATIBILITY: ANNOUNCEMENTS & ASSIGNMENTS ---
let announcementsData = [];
async function fetchAnnouncements() {
  const container = document.getElementById('announcements-list');
  if (!container) return;

  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
    if (!response.ok) throw new Error(`Announcements API status ${response.status}`);
    announcementsData = await response.json();
    renderAnnouncements(announcementsData);
  } catch (error) {
    console.error('Error fetching announcements:', error);
  }
}

function renderAnnouncements(posts) {
  const container = document.getElementById('announcements-list');
  if (!container || !posts) return;
  const categoryTags = ['Exam', 'Event', 'Academic', 'Notice', 'General'];
  const tagClasses   = ['tag-exam', 'tag-event', 'tag-fee', 'tag-placement', 'tag-cultural'];

  container.innerHTML = posts.map((post, idx) => {
    const tag = categoryTags[idx % categoryTags.length];
    const tagClass = tagClasses[idx % tagClasses.length];
    const cardId = `ann-api-${post.id}`;
    const bodyId = `ann-body-api-${post.id}`;

    return `
      <article class="announcement-card" id="${cardId}">
        <div class="ann-header" role="button" tabindex="0" aria-expanded="true" aria-controls="${bodyId}" onclick="toggleAnnouncement('${cardId}')">
          <div class="ann-left">
            <span class="ann-tag ${tagClass}">${tag}</span>
            <span class="ann-title">${escapeHTML(post.title)}</span>
          </div>
          <i class="fas fa-chevron-down ann-chevron" aria-hidden="true" style="transform: rotate(180deg)"></i>
        </div>
        <div class="ann-body" id="${bodyId}">
          <p>${escapeHTML(post.body)}</p>
          <span class="ann-date">
            <i class="fas fa-network-wired"></i> REST API: GET /posts/${post.id}
          </span>
        </div>
      </article>
    `;
  }).join('');
}

const annSearchInput = document.getElementById('announcements-search-input');
if (annSearchInput) {
  annSearchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = announcementsData.filter(post =>
      post.title.toLowerCase().includes(query) ||
      post.body.toLowerCase().includes(query)
    );
    renderAnnouncements(filtered);
  });
}

let assignmentsData = [];
let activeAssignmentFilter = 'all';

async function fetchAssignments() {
  const container  = document.getElementById('assignments-list');
  const summaryVal = document.getElementById('assignments-summary-val');
  const summarySub = document.getElementById('assignments-summary-sub');
  const summarySt  = document.getElementById('assignments-summary-status');

  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos?userId=1&_limit=5');
    if (!response.ok) throw new Error(`Assignments status ${response.status}`);
    assignmentsData = await response.json();

    const completedCount = assignmentsData.filter(item => item.completed).length;
    const pendingCount   = assignmentsData.length - completedCount;

    if (summaryVal) summaryVal.innerHTML = `${pendingCount} <span class="card-value-small">/ ${assignmentsData.length}</span>`;
    if (summarySub) summarySub.textContent = `${pendingCount} pending assignments`;
    if (summarySt) {
      summarySt.className = pendingCount > 0 ? 'card-status status-warn' : 'card-status status-good';
      summarySt.innerHTML = pendingCount > 0
        ? `<i class="fas fa-clock"></i> ${pendingCount} Pending`
        : `<i class="fas fa-check-circle"></i> All Done`;
    }

    renderAssignments();
  } catch (error) {
    console.error('Error fetching assignments:', error);
  }
}

function renderAssignments() {
  const container = document.getElementById('assignments-list');
  if (!container) return;

  let filtered = assignmentsData;
  if (activeAssignmentFilter === 'completed') {
    filtered = assignmentsData.filter(item => item.completed);
  } else if (activeAssignmentFilter === 'pending') {
    filtered = assignmentsData.filter(item => !item.completed);
  }

  if (filtered.length === 0) {
    container.innerHTML = `<div class="api-loading-state" style="grid-column: 1 / -1;"><p>No assignments found.</p></div>`;
    return;
  }

  container.innerHTML = filtered.map(item => `
    <div class="assignment-item-card" role="article">
      <div class="assignment-title">
        <i class="fas ${item.completed ? 'fa-check-circle' : 'fa-clock'}" style="color: ${item.completed ? 'var(--success)' : 'var(--warning)'}; margin-right: 0.4rem;"></i>
        ${escapeHTML(item.title)}
      </div>
      <div class="assignment-meta">
        <span class="assignment-status-tag ${item.completed ? 'completed' : 'pending'}">
          <i class="fas ${item.completed ? 'fa-check' : 'fa-hourglass-half'}"></i>
          ${item.completed ? 'Completed' : 'Pending'}
        </span>
        <span class="assignment-id-tag">GET /todos/${item.id}</span>
      </div>
    </div>
  `).join('');
}

document.querySelectorAll('.filter-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filter-tab').forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    activeAssignmentFilter = tab.getAttribute('data-filter') || 'all';
    renderAssignments();
  });
});

// Helper HTML Escaper
function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// --- H. ATTACH EVENT LISTENERS ---
document.getElementById('add-student-btn')?.addEventListener('click', openAddStudentModal);
document.getElementById('refresh-students-btn')?.addEventListener('click', () => {
  fetchStudents();
  showToast('🔄 Refreshing Student REST API data...');
});
document.getElementById('toggle-polling-btn')?.addEventListener('click', togglePolling);
document.getElementById('refresh-profile-btn')?.addEventListener('click', () => {
  fetchStudentProfile();
  showToast('🔄 Refreshing student profile...');
});
document.getElementById('refresh-all-apis-btn')?.addEventListener('click', () => {
  showToast('🔄 Refreshing all REST APIs...');
  fetchStudents();
  fetchStudentProfile();
  fetchAnnouncements();
  fetchAssignments();
});

/* ====================================================
   INIT — Page load & API start
   ==================================================== */
window.addEventListener('load', () => {
  const g = getGreeting();
  setTimeout(() => showToast(`${g.text}, Jagrat! Connected to CampusConnect REST API 🚀`), 600);

  // Initialize REST APIs
  setTimeout(() => {
    fetchStudents();
    fetchStudentProfile();
    fetchAnnouncements();
    fetchAssignments();
    startLiveSync();
  }, 200);
});


