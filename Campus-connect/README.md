# CampusConnect – Smart University Service Portal

> **Web Services & SOA Laboratory – Lab 1 + Lab 2**  
> Lab 1: Frontend prototype with mock data.  
> Lab 2: REST API Integration using JSONPlaceholder (`fetch()` + `async/await`).

---

## 📁 Project Structure

```
CampusConnect/
├── index.html          ← Main HTML page (semantic, accessible)
├── css/
│   └── style.css       ← External CSS (dark/light themes, responsive + Lab 2 API styles)
├── js/
│   └── script.js       ← JavaScript (Lab 1: 13 UI features + Lab 2: REST API fetch module)
├── assets/
│   └── logo.png        ← App logo image
└── README.md           ← This file
```

---

## 🎯 Features Implemented (Lab 1)

### UI Sections
| # | Section | Description |
|---|---------|-------------|
| 1 | **Navigation Bar** | Logo, CampusConnect branding, Home/Services/Dashboard/Notifications/Profile links, Search, Theme Toggle |
| 2 | **Welcome Section** | Student name (Jagrat Jani), Dept (CSE-AIML), Semester 4, REST API profile data |
| 3 | **Summary Cards** | Attendance, Courses, Assignments (live API), Exams, CGPA, Notifications |
| 4 | **Today's Timetable** | Dynamic day label, 6 class slots with room/faculty info, NOW/NEXT/LAB badges |
| 5 | **Announcements** | REST API-powered (GET /posts), search/filter, expand/collapse accordion |
| 6 | **Upcoming Events** | 5 events with date blocks and category tags |
| 7 | **Assignments** | REST API-powered (GET /todos), filter tabs (All/Pending/Completed) |
| 8 | **Quick Services** | 8 service cards (Attendance, Registration, Fee, Transcript, Library, Timetable, Results, Hostel) |
| 9 | **Footer** | Contact, Help Desk, Privacy Policy, Social links |

### JavaScript Features (13 UI + Lab 2 REST API module)
| # | Feature | Description |
|---|---------|-------------|
| 1 | **Theme Switch** | Dark/Light mode with localStorage persistence |
| 2 | **Greeting by Time** | Morning/Afternoon/Evening/Night greeting |
| 3 | **Live Date & Time** | Real-time clock updating every second |
| 4 | **Global Search/Filter** | Dropdown search across all sections |
| 5 | **Expand/Collapse** | Announcement accordion with keyboard support |
| 6 | **Notification Counter** | Badge count, panel toggle, mark-all-read |
| 7 | **Show/Hide Sections** | Toggle collapse buttons on all sections |
| 8 | **Service Modal** | Popup with service details |
| 9 | **Toast Notifications** | Auto-dismissing status messages |
| 10 | **Active Nav Highlight** | IntersectionObserver-based scroll detection |
| 11 | **Navbar Scroll Shadow** | Elevation effect on scroll |
| 12 | **Mobile Hamburger** | Animated hamburger for responsive nav |
| 13 | **Dynamic Day Label** | Timetable shows current day name |
| 14 | **REST API Module** | fetch() integration for 3 JSONPlaceholder endpoints |

---

## 🌐 Lab 2: REST API Integration

### API Mapping Table

| CampusConnect Section | HTTP Method | JSONPlaceholder Endpoint | JSON Fields Used | Description |
|-----------------------|-------------|--------------------------|------------------|-------------|
| **Student Profile** | `GET` | `https://jsonplaceholder.typicode.com/users/1` | `name`, `username`, `email`, `phone` | Displays API user profile in the Welcome section |
| **Announcements** | `GET` | `https://jsonplaceholder.typicode.com/posts?_limit=5` | `id`, `title`, `body`, `userId` | Renders 5 announcement cards dynamically from API |
| **Assignments** | `GET` | `https://jsonplaceholder.typicode.com/todos?userId=1&_limit=5` | `id`, `title`, `completed` | Shows 5 assignment todos with completed/pending status |

### API Flow Diagram

```
CampusConnect JavaScript  ──fetch()──►  JSONPlaceholder API  ──JSON──►  UI Update

Student Profile  → fetch GET /users/1              → name, username, email, phone  → Profile Card
Announcements    → fetch GET /posts?_limit=5       → title, body                   → Announcement Cards
Assignments      → fetch GET /todos?userId=1&_limit=5 → title, completed           → Assignment List
```

### JavaScript Approach (async/await)

```javascript
// Student Profile API
async function fetchStudentProfile() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/users/1');
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const user = await response.json();
    // Update DOM with user.name, user.username, user.email, user.phone
  } catch (error) {
    console.error(error);
    // Show 'Unable to load data. Please try again.'
  }
}

// Announcements API
async function fetchAnnouncements() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5');
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const posts = await response.json();
    renderAnnouncements(posts);  // Dynamically update DOM
  } catch (error) {
    console.error(error);
    // Show error box with retry button
  }
}

// Assignments API
async function fetchAssignments() {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos?userId=1&_limit=5');
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    const todos = await response.json();
    renderAssignments(todos);  // Dynamically update DOM
  } catch (error) {
    console.error(error);
    // Show error box with retry button
  }
}
```

### One Simple Interaction Implemented

**Two interactions were implemented (bonus):**

1. **Announcements Search**: Real-time search/filter by title or body text — `input` event listener filters `announcementsData` array and re-renders results dynamically.
2. **Assignments Filter Tabs**: Three-tab UI (All / Pending / Completed) — clicking a tab filters `assignmentsData` by `item.completed` boolean and re-renders the assignment grid.

### Error Handling

All three API calls are wrapped in `try/catch` blocks:
- If `response.ok` is `false` → throws an Error with status code
- If network fails → error is caught
- UI shows: `"Unable to load data. Please try again."` with a **Retry** button
- Toast notification alerts the user

### Refresh Buttons

- Each API section has an individual **Refresh** button to re-call the API
- A **"Refresh All REST APIs"** button in the hero section re-fetches all three simultaneously

---

## 🔌 API Design Exercise

| # | Question | Answer |
|---|----------|--------|
| 1 | What is REST? | Representational State Transfer — an architectural style using HTTP to expose resources |
| 2 | What HTTP method is used? | `GET` — read-only, no side effects |
| 3 | What status code means success? | `200 OK` |
| 4 | What format is returned? | JSON (JavaScript Object Notation) |
| 5 | How is JSON parsed in JS? | `response.json()` — returns a Promise resolving to a JavaScript object |
| 6 | What is JSONPlaceholder? | A free fake REST API for prototyping and testing, hosted at jsonplaceholder.typicode.com |
| 7 | What is `async/await`? | Syntax that makes asynchronous Promise-based code appear synchronous and easier to read |
| 8 | What is error handling? | `try/catch` block — catches network failures, bad status codes, and shows fallback UI |

---

## 🛠️ Tech Stack

| Technology | Usage |
|------------|-------|
| **HTML5** | Semantic structure (`<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`) |
| **CSS3** | External stylesheet, CSS Variables, Flexbox, Grid, Animations, Media Queries |
| **JavaScript (ES6+)** | DOM Manipulation, `fetch()`, `async/await`, Promises, Event Listeners, `IntersectionObserver`, `localStorage` |
| **JSONPlaceholder** | Free REST API for testing: `https://jsonplaceholder.typicode.com` |
| **Google Fonts** | Inter + Outfit for modern typography |
| **Font Awesome 6** | Icon library (CDN) |

---

## 🚀 How to Run

1. Open the project folder in any browser:
   ```
   Open index.html in Chrome / Firefox / Edge
   ```
2. No build step required — pure HTML/CSS/JS.
3. For a live server (optional):
   ```bash
   npx live-server .
   ```
4. Make sure you have an active internet connection so `fetch()` calls to JSONPlaceholder work.

---

## 📚 Learning Outcomes

- ✅ Semantic HTML5 structure with ARIA accessibility
- ✅ External CSS with variables, Grid, Flexbox, responsive breakpoints
- ✅ DOM manipulation and event-driven JavaScript
- ✅ REST API integration with `fetch()` and `async/await`
- ✅ JSON response parsing with `response.json()`
- ✅ Error handling with `try/catch` and fallback UI
- ✅ Dynamic DOM rendering without manual HTML copy-paste
- ✅ Search/filter and refresh interactions on API data
- ✅ Project organization following real-world conventions

---

## 👤 Student Info

| Field | Value |
|-------|-------|
| **Name** | Jagrat Jani |
| **Student ID** | 23CS0101 |
| **Department** | CSE (AIML) |
| **Semester** | 4th |
| **Subject** | Web Services & SOA |
| **Lab 1** | CampusConnect Frontend (Mock Data) |
| **Lab 2** | CampusConnect REST API Integration (JSONPlaceholder) |

---

*© 2026 CampusConnect · Web Services & SOA Lab · All rights reserved.*
