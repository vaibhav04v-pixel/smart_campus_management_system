# 🎓 Smart Campus Management System

A full-stack, responsive **MERN (MongoDB, Express.js, React.js, Node.js)** campus management platform engineered as a **NoSQL Database Project**.

Built with a **dark navy & teal theme**, role-based access control (Student vs. Admin), real-time MongoDB Aggregation statistics, full student records CRUD, grievance tracking, campus event registration, and an official university notice board.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19 + Vite | Fast, responsive single-page application (SPA) |
| **Routing** | React Router v7 | Client-side declarative routing and protected routes |
| **HTTP Client** | Axios | Configured with automatic JWT request & 401 response interceptors |
| **Backend** | Node.js + Express.js | RESTful API server with modular controllers & route guards |
| **Database** | MongoDB Atlas (Cloud) | Scalable NoSQL document store |
| **ODM** | Mongoose | Strict schema validation, compound indexing, pre-save middleware |
| **Security** | Bcrypt.js + JWT | Salted password hashing (10 rounds) and stateless token auth |
| **Styling** | Vanilla CSS3 | Modern dark navy (`#0a1128`, `#1b263b`) & teal (`#00b4d8`, `#48cae4`) tokens |

---

## 🍃 NoSQL Database Architecture & Concepts

This project was specifically designed to demonstrate the strengths of a **NoSQL document database** over traditional relational SQL:

### 1. Document Collections Schema
- **`users`**: Manages campus identity with password hashes (`select: false`) and roles (`admin`, `student`).
- **`students`**: Stores comprehensive student enrollment records with unique compound indexes on `rollNumber` and `email`.
- **`courses`**: Academic catalog with instructor, credits, and student enrollment array (`enrolledStudents: [ObjectId -> Student]`).
- **`attendances`**: Daily roll-call records with **compound unique index** (`{ student: 1, course: 1, date: 1 }`) guaranteeing zero duplicate attendance entries for any student on a given date.
- **`complaints`**: Grievance records linked by reference (`submittedBy: ObjectId -> User`) with status lifecycle (`Pending` ➔ `In Review` ➔ `Resolved`).
- **`events`**: Demonstrates **Embedded Document Arrays** (`registeredStudents: [{ user, name, email, registeredAt }]`). Eliminates the need for SQL `JOIN` bridge tables for event registrations.
- **`announcements`**: Official notices and bulletins with priority levels and audience targeting.

### 2. MongoDB Aggregation Pipelines
Instead of calculating statistics on the client or running expensive SQL `JOIN` and `COUNT` loops, the system leverages native server-side **MongoDB Aggregation Pipelines**:
```javascript
// Example: Live Department Breakdown Aggregation
Student.aggregate([
  { $group: { _id: "$department", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);

// Example: Complaints Status Distribution
Complaint.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
]);
```

### 3. Indexing Strategy
Compound and single-field indexes are placed on frequently queried fields (`rollNumber`, `email`, `department`, `status`, `createdAt`) to guarantee $O(\log N)$ query performance.

---

## 🔐 Role-Based Access Control (RBAC) Matrix

| Feature / Action | Student Role | Admin Role |
|---|:---:|:---:|
| View Live Dashboard Metrics | ✅ | ✅ |
| Browse Student Directory | ✅ (Read Only) | ✅ (Full Access) |
| Create / Edit / Delete Students | ❌ (HTTP 403 Forbidden) | ✅ |
| Search & Filter Students | ✅ | ✅ |
| Lodge Complaint | ✅ | ✅ |
| View Complaints | ✅ (Own submissions only) | ✅ (All campus complaints) |
| Update Complaint Resolution Status | ❌ (HTTP 403 Forbidden) | ✅ |
| Browse Campus Events | ✅ | ✅ |
| Register / Cancel Event Registration | ✅ | ✅ |
| Create / Edit / Delete Events | ❌ (HTTP 403 Forbidden) | ✅ |
| View Campus Notices | ✅ | ✅ |
| Publish / Delete Notices | ❌ (HTTP 403 Forbidden) | ✅ |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or newer)
- npm (v9 or newer)
- Active MongoDB Atlas cluster (configured in `backend/.env`)

### 1. Backend Setup
```powershell
cd "backend"

# Start Express server with auto-restart nodemon
npm run dev
```
> Server runs at: **`http://localhost:5000`**  
> Health check: **`http://localhost:5000/api/health`**

### 2. Frontend Setup
In a new terminal window:
```powershell
cd "frontend"

# Start Vite React development server
npm run dev
```
> Application opens at: **`http://localhost:5173`**

### 3. Optional: Seed Sample Data
The optional seed is non-destructive and creates clearly marked demo records (`isDemo: true`). Configure the required credentials in `backend/.env`; the demo student email must use the reserved `@demo.smart-campus.invalid` domain.
```powershell
cd "backend"
npm run seed:demo
```

---

## 👥 Default Demo Credentials

Public registration creates student accounts only. No default credentials are included in source.

To create or update an administrator account, set `ADMIN_EMAIL`, `ADMIN_NAME`, and a unique `ADMIN_PASSWORD` (at least 12 characters) in `backend/.env`, then run:
```powershell
cd "backend"
npm run admin:create
```
This explicit command will not promote a non-admin account, does not print the password, and does not run automatically during server startup. Demo seeding additionally requires `DEMO_STUDENT_EMAIL` (ending in `@demo.smart-campus.invalid`) and `DEMO_STUDENT_PASSWORD`.

The demo seed uses upserts and only adds demo-marked records; it never clears collections. Existing account passwords are not changed by demo seeding.

---

## 🧪 Automated Testing Commands

Comprehensive automated test suites test the live MongoDB Atlas database and Express middleware:

```powershell
cd "backend"

# Test Authentication, JWT & Password Hashing
npm run test:auth

# Test Student Management CRUD, Search, Filter & Role Permissions
npm run test:students

# Test Complaints, Events, Notices & MongoDB Aggregations
npm run test:stage4

# Test Courses, Attendance Duplicate Prevention & Percentage Aggregations
npm run test:stage5

# End-to-end role, dashboard, and complaint workflow (isolated temporary DB)
npm run test:portals
```

---

## 🧭 Step-by-Step Demonstration Walkthrough for Professor

### Step 1: Live Aggregation Dashboard (`/`)
1. Log in as the administrator account configured through `npm run admin:create`.
2. Show the **Overview Counters** (Total Enrolled, Pending Complaints, Resolved Complaints, Upcoming Events). Point out that these are **not hardcoded**, but computed via MongoDB `$group` and count queries.
3. Show the **Department Distribution Bars** — explain that MongoDB dynamically aggregated the student count by department.
4. Scroll down to the **Role-Based Authorization Verifier** box and click:
   - *"Verify User Profile"* ➔ Shows HTTP 200 with decoded JWT session.
   - *"Verify Admin Route Guard"* ➔ Shows HTTP 200 confirming admin clearance.

### Step 2: Student Management CRUD (`/students`)
1. Click **Students** in the navigation bar.
2. Demonstrate real-time searching: type `CS` or a student's name into the search bar.
3. Filter by **Department** (e.g. `Information Technology`) or **Course** (e.g. `MCA`).
4. Click **"➕ Add New Student"**:
   - Add a student with Roll Number `CS2026999`.
   - Try adding another student with the **same roll number** to showcase MongoDB duplicate key protection (HTTP 409 Conflict).
5. Click **"✏️ Edit"** on any student and update their semester.
6. Click **"🗑️"** and demonstrate the safe deletion confirmation modal.

### Step 3: Grievance & Complaints Tracking (`/complaints`)
1. Show the complaints list with priority badges (`High`, `Urgent`, `Low`) and statuses.
2. As an Admin, click **"⚙️ Status"** on a pending complaint, change it to `Resolved`, and add an administrative note (e.g., *"Maintenance technician dispatched"*).
3. Sign out and log in as a registered student account:
   - Notice that students **only see their own filed complaints**, proving backend data isolation.
   - Click **"📝 Lodge New Complaint"** and submit a new ticket.

### Step 4: Campus Events & Registrations (`/events`)
1. Show the event cards with seat availability (`🎟️ X seats left`).
2. As a student, click **"Register for Event"** on an upcoming hackathon or seminar.
   - Notice the button instantly turns into **"Cancel Registration"** and the seat count increments.
   - Explain to your professor that this uses **MongoDB Embedded Arrays** (`registeredStudents`), saving registration timestamps without needing a separate relational SQL table.

### Step 5: Campus Notices & Circulars (`/announcements`)
1. Browse official campus circulars categorized by `Exam`, `Academic`, `Holiday`, etc.
2. As Admin, click **"📢 Post Notice"** to publish a new critical bulletin to the student body.

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a student user (public admin creation is blocked)
- `POST /api/auth/login` — Authenticate and receive JWT
- `GET /api/auth/me` — Retrieve logged-in profile *(Protected)*
- `GET /api/auth/admin-check` — Verify admin permissions *(Admin Only)*

The frontend provides `/login` and `/register`; failed login and registration requests display the API's error message when available.

### Student Management (`/api/students`)
- `GET /api/students` — Paginated, searchable, filterable student directory *(Protected)*
- `GET /api/students/stats` — MongoDB aggregation metrics *(Protected)*
- `GET /api/students/:id` — Retrieve student details *(Protected)*
- `POST /api/students` — Create student record *(Admin Only)*
- `PUT /api/students/:id` — Update student record *(Admin Only)*
- `DELETE /api/students/:id` — Remove student record *(Admin Only)*

### Complaints (`/api/complaints`)
- `GET /api/complaints` — List complaints (role-filtered) *(Protected)*
- `POST /api/complaints` — Submit grievance ticket *(Protected)*
- `PUT /api/complaints/:id/status` — Update resolution status *(Admin Only)*
- `DELETE /api/complaints/:id` — Remove complaint *(Admin Only)*

### Events (`/api/events`)
- `GET /api/events` — List campus events with registration flag *(Protected)*
- `POST /api/events` — Schedule new event *(Admin Only)*
- `PUT /api/events/:id` — Update event details *(Admin Only)*
- `DELETE /api/events/:id` — Delete event *(Admin Only)*
- `POST /api/events/:id/register` — Register for event *(Protected)*
- `POST /api/events/:id/unregister` — Cancel registration *(Protected)*

### Announcements (`/api/announcements`)
- `GET /api/announcements` — List active bulletins *(Protected)*
- `POST /api/announcements` — Publish bulletin *(Admin Only)*
- `PUT /api/announcements/:id` — Update notice *(Admin Only)*
- `DELETE /api/announcements/:id` — Remove notice *(Admin Only)*

### Courses (`/api/courses`)
- `GET /api/courses` — Browse academic course catalog *(Protected)*
- `GET /api/courses/:id` — Course details & enrolled students *(Protected)*
- `POST /api/courses` — Create new course *(Admin Only)*
- `PUT /api/courses/:id` — Update course details *(Admin Only)*
- `DELETE /api/courses/:id` — Delete course & cascade attendance *(Admin Only)*
- `POST /api/courses/:id/enroll` — Assign students to course *(Admin Only)*
- `DELETE /api/courses/:id/enroll/:studentId` — Remove student from course *(Admin Only)*

### Attendance (`/api/attendance`)
- `POST /api/attendance/mark` — Mark daily roll call with duplicate prevention *(Admin Only)*
- `GET /api/attendance/course/:courseId` — Course attendance records *(Protected)*
- `GET /api/attendance/reports` — Aggregated percentage reports via MongoDB Pipeline *(Protected)*

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard/stats` — Live multi-collection aggregation analytics *(Protected)*

---

## 🔒 Security & Best Practices
- **No Credentials in Code**: Database URI and JWT secrets are loaded via `dotenv` and kept strictly within `backend/.env`.
- **Git Safety**: Root `.gitignore` explicitly blocks all `.env` variants and `node_modules/`.
- **Input Sanitization**: Mongoose schemas enforce types, regex patterns, enum constraints, and string trimming.
- **Registration Role Control**: Public registration cannot create admin accounts.
- **Timing-Attack Resistance**: The login controller compares passwords using `bcrypt.compare` and checks user existence in a combined branch to prevent user-enumeration timing leaks.
