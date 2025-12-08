# Clinic Management System - Complete Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Architecture](#project-architecture)
4. [Backend Documentation](#backend-documentation)
5. [Frontend Documentation](#frontend-documentation)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [Authentication & Authorization](#authentication--authorization)
9. [Setup & Installation](#setup--installation)
10. [Features by Role](#features-by-role)

---

## Project Overview

A comprehensive **Clinic Management System** built with a modern full-stack architecture. The system supports three distinct user roles (Admin, Doctor, Patient) with role-based access control and provides features for appointment scheduling, patient management, doctor schedules, and medical records.

### Key Features

- ✅ User authentication & authorization with JWT
- ✅ Role-based access control (Admin, Doctor, Patient)
- ✅ Appointment booking system with availability checking
- ✅ Doctor schedule management
- ✅ Patient profile management
- ✅ Medical records management
- ✅ Email notifications via Mailjet
- ✅ Responsive UI with dark mode support
- ✅ Real-time dashboard statistics
- ✅ Swagger API documentation

---

## Technology Stack

### Backend

- **Runtime**: Node.js
- **Framework**: Express.js v5.1.0
- **Database**: MySQL (Aiven hosted)
- **ORM**: Sequelize v6.37.7
- **Authentication**: JWT (jsonwebtoken v9.0.2)
- **Password Hashing**: bcryptjs v3.0.3
- **Email Service**: Mailjet (node-mailjet v6.0.11)
- **API Documentation**: Swagger (swagger-jsdoc v6.2.8, swagger-ui-express v5.0.1)
- **CORS**: cors v2.8.5

### Frontend

- **Framework**: Next.js v16.0.5
- **Language**: TypeScript v5
- **UI Framework**: React v19.2.0
- **Styling**: Tailwind CSS v4
- **State Management**: React Context API (for authentication)
- **Data Fetching**: TanStack Query (React Query) v5.90.11
- **HTTP Client**: Axios v1.13.2
- **Forms**: React Hook Form v7.66.1 + Zod v4.1.13
- **UI Components**: Radix UI primitives
- **Animations**: Framer Motion v12.23.24
- **Icons**: Lucide React v0.555.0
- **Theme**: next-themes v0.4.6

---

## Project Architecture

### Directory Structure

```
c-back-backup/
├── config/
│   ├── database.js          # Sequelize database configuration
│   ├── email.js             # Mailjet email service setup
│   └── swagger.js           # Swagger API documentation config
├── controllers/
│   ├── authController.js    # Authentication logic (login/register)
│   ├── doctorController.js  # Doctor-related operations
│   ├── patientController.js # Patient-related operations
│   ├── appointmentController.js # Appointment booking & availability
│   ├── adminController.js   # Admin operations
│   └── medicalRecordController.js # Medical records management
├── middleware/
│   └── authMiddleware.js    # JWT token verification
├── models/
│   ├── User.js              # User model (base for all roles)
│   ├── Doctor.js            # Doctor profile model
│   ├── Patient.js           # Patient profile model
│   ├── Appointment.js       # Appointment model
│   ├── Schedule.js          # Doctor schedule model
│   ├── MedicalRecord.js     # Medical record model
│   └── index.js             # Model associations
├── routes/
│   ├── authRoutes.js        # Authentication routes
│   ├── doctorRoutes.js      # Doctor endpoints
│   ├── patientRoutes.js     # Patient endpoints
│   ├── appointmentRoutes.js # Appointment endpoints
│   ├── adminRoutes.js       # Admin endpoints
│   └── medicalRecordRoutes.js # Medical record endpoints
├── frontend/clinic-frontend/
│   └── src/
│       ├── app/             # Next.js App Router pages
│       │   ├── login/       # Login page
│       │   ├── register/    # Registration page
│       │   ├── patient/     # Patient dashboard & features
│       │   ├── doctor/      # Doctor dashboard & features
│       │   └── admin/       # Admin dashboard & features
│       ├── components/      # Reusable UI components
│       ├── lib/
│       │   ├── api.ts       # API client & endpoints
│       │   └── utils.ts     # Utility functions
│       ├── store/
│       │   └── authStore.ts # Zustand auth state management
│       ├── types/
│       │   └── index.ts     # TypeScript type definitions
│       └── providers/
│           ├── AuthProvider.tsx    # Auth context provider
│           └── QueryProvider.tsx   # React Query provider
├── server.js                # Express server setup
├── index.js                 # Application entry point
└── package.json             # Backend dependencies
```

---

## Backend Documentation

### 1. Database Configuration (`config/database.js`)

The application uses **Sequelize ORM** to connect to a MySQL database hosted on Aiven.

```javascript
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  }
);
```

**Environment Variables Required:**

- `DB_NAME`: Database name
- `DB_USER`: Database username
- `DB_PASS`: Database password
- `DB_HOST`: Database host
- `DB_PORT`: Database port (not default 3306)

### 2. Email Service (`config/email.js`)

Uses **Mailjet** for sending emails (welcome emails, appointment confirmations).

**Environment Variables:**

- `MJ_APIKEY_PUBLIC`: Mailjet API public key
- `MJ_APIKEY_PRIVATE`: Mailjet API private key
- `MAIL_SENDER`: Verified sender email

### 3. Models

#### User Model

Base model for all users with role-based differentiation.

**Fields:**

- `userId` (PK, auto-increment)
- `fullName` (required)
- `email` (required, unique)
- `passwordHash` (required, bcrypt hashed)
- `role` (enum: 'admin', 'doctor', 'patient')
- `phoneNumber`
- `created_at` (timestamp)

#### Doctor Model

Extended profile for users with role 'doctor'.

**Fields:**

- `doctorId` (PK)
- `userId` (FK to User)
- `specialization` (required)
- `bio`
- `consultationFee` (required, decimal)
- `roomNumber`

**Associations:**

- Belongs to User
- Has many Appointments
- Has many Schedules

#### Patient Model

Extended profile for users with role 'patient'.

**Fields:**

- `patientId` (PK)
- `userId` (FK to User)
- `dateOfBirth` (required)
- `gender` (enum: 'Male', 'Female', 'Other')
- `bloodGroup`
- `address`

**Associations:**

- Belongs to User
- Has many Appointments
- Has many MedicalRecords (through Appointments)

#### Appointment Model

Tracks all appointments between patients and doctors.

**Fields:**

- `appointmentId` (PK)
- `patientId` (FK to Patient)
- `doctorId` (FK to Doctor)
- `appointmentDate` (date)
- `appointmentTime` (time)
- `status` (enum: 'scheduled', 'completed', 'cancelled', 'no_show')
- `reasonForVisit`
- `created_at` (timestamp)

#### Schedule Model (DoctorSchedule)

Defines doctor availability by day of week.

**Fields:**

- `scheduleId` (PK)
- `doctorId` (FK to Doctor)
- `dayOfWeek` (enum: Monday-Sunday)
- `startTime` (time)
- `endTime` (time)
- `isAvailable` (boolean, default: true)

#### MedicalRecord Model

Stores medical records created after appointments.

**Fields:**

- `recordId` (PK)
- `appointmentId` (FK to Appointment)
- `diagnosis` (required)
- `prescription`
- `treatmentPlan`
- `recordDate` (date)

### 4. Controllers Overview

#### AuthController

- `register`: Creates new user account with role-based profile creation
- `login`: Authenticates user and returns JWT token

#### DoctorController

- `getAllDoctors`: Public endpoint to list all doctors
- `getProfile`: Get authenticated doctor's profile
- `updateProfile`: Update doctor profile information
- `getDashboardStats`: Get statistics (appointments, earnings, patients)
- `getAppointments`: Get doctor's appointments with filters
- `updateAppointmentStatus`: Update appointment status
- `getSchedule`: Get doctor's weekly schedule
- `addSchedule`: Add new schedule slot
- `updateSchedule`: Modify existing schedule
- `deleteSchedule`: Remove schedule slot

#### PatientController

- `getProfile`: Get authenticated patient's profile
- `updateProfile`: Create/update patient profile
- `getAppointments`: Get patient's appointments with doctor info

#### AppointmentController

- `bookAppointment`: Book new appointment with validation
- `checkAvailability`: Get available time slots for a doctor on a date
- `getDoctorSchedule`: Get doctor's weekly schedule (public)

#### AdminController

- `getStats`: Dashboard statistics (users, doctors, appointments)
- `addDoctor`: Create new doctor account
- `deleteDoctor`: Remove doctor and associated user
- `getAllPatients`: List all patients
- `deletePatient`: Remove patient and associated user

#### MedicalRecordController

- `createOrUpdate`: Create/update medical record for appointment
- `getPatientHistory`: Get all medical records for a patient
- `getMyPatients`: Get list of doctor's patients
- `getRecordById`: Get specific medical record
- `updateRecord`: Update existing medical record
- `deleteRecord`: Delete medical record

### 5. Authentication Middleware

JWT-based authentication middleware that:

1. Extracts Bearer token from Authorization header
2. Verifies token using `JWT_SECRET`
3. Attaches decoded user info to `req.user`
4. Returns 401 for invalid/expired tokens

**Usage in routes:**

```javascript
router.get("/profile", authMiddleware, controller.getProfile);
```

**Token Payload:**

```javascript
{
    id: user.userId,
    role: user.role,
    exp: expirationTimestamp
}
```

---

## Frontend Documentation

### 1. Architecture

The frontend uses **Next.js 16** with the App Router, TypeScript, and modern React patterns.

### 2. State Management

#### React Context API

Global authentication state with persistence.

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}
```

Persisted to localStorage as `auth-storage`.

### 3. API Client (`lib/api.ts`)

Centralized Axios instance with:

- **Base URL**: `process.env.NEXT_PUBLIC_API_URL`
- **Request Interceptor**: Automatically adds JWT token from localStorage
- **Response Interceptor**: Handles 401 errors, clears auth, redirects to login

#### API Modules:

- `authAPI`: login, register
- `doctorsAPI`: CRUD operations for doctor features
- `patientsAPI`: Patient profile and appointments
- `appointmentsAPI`: Booking and availability
- `adminAPI`: Admin operations
- `medicalRecordsAPI`: Medical record management

### 4. Routing Structure

#### Public Routes

- `/` - Landing page with hero section
- `/login` - Login page
- `/register` - Registration page

#### Protected Routes (Role-based)

**Patient Routes** (`/patient/*`)

- `/patient/dashboard` - Dashboard with upcoming appointments
- `/patient/profile` - View/edit profile
- `/patient/appointments` - View all appointments
- `/patient/book` - Book new appointment
- `/patient/doctors` - Browse available doctors

**Doctor Routes** (`/doctor/*`)

- `/doctor/dashboard` - Dashboard with stats and today's appointments
- `/doctor/profile` - View/edit profile
- `/doctor/appointments` - Manage appointments
- `/doctor/schedule` - Manage weekly schedule
- `/doctor/patients` - View patient list and medical records

**Admin Routes** (`/admin/*`)

- `/admin/dashboard` - System-wide statistics
- `/admin/doctors` - Manage doctors
- `/admin/add-doctor` - Add new doctor
- `/admin/patients` - Manage patients

### 5. Key Components

#### AuthProvider (`providers/AuthProvider.tsx`)

- Wraps entire app
- Provides authentication context
- Handles hydration from persisted state
- Redirects based on authentication status

#### DashboardLayout (`components/DashboardLayout.tsx`)

- Shared layout for all dashboard pages
- Role-based navigation sidebar
- Logout functionality
- Theme toggle

#### UI Components (`components/ui/`)

Shadcn/ui components built on Radix UI:

- Button, Card, Input, Label
- Dialog, Dropdown, Avatar
- Form components with react-hook-form
- Calendar with date-fns
- Toast notifications with sonner

### 6. TypeScript Types (`types/index.ts`)

Comprehensive type definitions for:

- **Models**: User, Doctor, Patient, Appointment, Schedule, MedicalRecord
- **API Responses**: AuthResponse, ApiResponse<T>
- **Forms**: RegisterForm, LoginForm, PatientProfileForm, etc.

### 7. Styling

- **Tailwind CSS 4**: Utility-first CSS framework
- **CSS Variables**: Theme colors defined in `globals.css`
- **Dark Mode**: Implemented via `next-themes`
- **Animations**: Framer Motion for smooth transitions

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐
│    Users    │
├─────────────┤
│ userId (PK) │
│ fullName    │
│ email       │
│ passwordHash│
│ role        │
│ phoneNumber │
│ created_at  │
└──────┬──────┘
       │
       ├──────────────────┬──────────────────┐
       │                  │                  │
┌──────▼─────┐    ┌──────▼─────┐    ┌──────▼─────┐
│  Doctors   │    │  Patients  │    │   Admin    │
├────────────┤    ├────────────┤    └────────────┘
│doctorId(PK)│    │patientId   │
│userId (FK) │    │userId (FK) │
│specializ.. │    │dateOfBirth │
│bio         │    │gender      │
│consult...  │    │bloodGroup  │
│roomNumber  │    │address     │
└──────┬─────┘    └──────┬─────┘
       │                 │
       │        ┌────────▼────────┐
       │        │  Appointments   │
       └────────►├─────────────────┤
                │appointmentId(PK)│
                │doctorId (FK)    │
                │patientId (FK)   │
                │appointmentDate  │
                │appointmentTime  │
                │status           │
                │reasonForVisit   │
                └────────┬────────┘
                         │
                ┌────────▼────────┐
                │ MedicalRecords  │
                ├─────────────────┤
                │recordId (PK)    │
                │appointmentId(FK)│
                │diagnosis        │
                │prescription     │
                │treatmentPlan    │
                │recordDate       │
                └─────────────────┘

┌──────────────────┐
│ DoctorSchedules  │
├──────────────────┤
│scheduleId (PK)   │
│doctorId (FK)     │
│dayOfWeek         │
│startTime         │
│endTime           │
│isAvailable       │
└──────────────────┘
```

---

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/register`

Register a new user account.

**Request Body:**

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "patient"
}
```

**Response:**

```json
{
  "success": true,
  "message": "User created!"
}
```

**Side Effects:**

- Creates User record
- Creates Doctor/Patient profile (based on role)
- Sends welcome email via Mailjet

#### POST `/api/auth/login`

Authenticate user and get JWT token.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

### Doctor Endpoints

#### GET `/api/doctors`

Get all doctors (public).

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "doctorId": 1,
      "specialization": "Cardiology",
      "bio": "20 years experience",
      "consultationFee": 150.0,
      "roomNumber": "A-101",
      "User": {
        "fullName": "Dr. Jane Smith",
        "email": "jane@clinic.com",
        "phoneNumber": "+1234567890"
      }
    }
  ]
}
```

#### GET `/api/doctors/profile` 🔒

Get authenticated doctor's profile.

**Headers:** `Authorization: Bearer <token>`

#### POST `/api/doctors/profile` 🔒

Update doctor profile.

**Request Body:**

```json
{
  "specialization": "Cardiology",
  "bio": "Updated bio",
  "consultationFee": 200.0,
  "roomNumber": "B-202"
}
```

#### GET `/api/doctors/dashboard/stats` 🔒

Get doctor dashboard statistics.

**Response:**

```json
{
  "success": true,
  "data": {
    "todayAppointments": 5,
    "weeklyAppointments": 23,
    "monthlyEarnings": 4500.0,
    "totalPatients": 87
  }
}
```

#### GET `/api/doctors/appointments` 🔒

Get doctor's appointments.

**Query Parameters:**

- `status`: Filter by status (scheduled, completed, cancelled, no_show)
- `date`: Filter by specific date (YYYY-MM-DD)
- `upcoming`: Boolean to get upcoming appointments

#### PUT `/api/doctors/appointments/:appointmentId/status` 🔒

Update appointment status.

**Request Body:**

```json
{
  "status": "completed"
}
```

#### GET `/api/doctors/schedule` 🔒

Get doctor's weekly schedule.

#### POST `/api/doctors/schedule` 🔒

Add new schedule slot.

**Request Body:**

```json
{
  "dayOfWeek": "Monday",
  "startTime": "09:00:00",
  "endTime": "17:00:00",
  "isAvailable": true
}
```

#### PUT `/api/doctors/schedule/:scheduleId` 🔒

Update schedule slot.

#### DELETE `/api/doctors/schedule/:scheduleId` 🔒

Delete schedule slot.

### Patient Endpoints

#### GET `/api/patients/profile` 🔒

Get patient profile.

#### POST `/api/patients/profile` 🔒

Create or update patient profile.

**Request Body:**

```json
{
  "dateOfBirth": "1990-05-15",
  "gender": "Male",
  "bloodGroup": "O+",
  "address": "123 Main St, City, State"
}
```

#### GET `/api/patients/appointments` 🔒

Get patient's appointments.

**Query Parameters:**

- `status`: Filter by status

### Appointment Endpoints

#### POST `/api/appointments/book` 🔒

Book a new appointment.

**Request Body:**

```json
{
  "doctorId": 1,
  "date": "2024-12-15",
  "time": "10:00:00",
  "reasonForVisit": "Regular checkup"
}
```

**Validations:**

- Date not in past
- Doctor available on that day
- Time within doctor's schedule
- Slot not already booked

**Side Effects:**

- Sends confirmation email to patient

#### GET `/api/appointments/availability`

Check available slots for a doctor on a date.

**Query Parameters:**

- `doctorId`: Doctor ID (required)
- `date`: Date to check (YYYY-MM-DD, required)

**Response:**

```json
{
  "success": true,
  "data": {
    "availableSlots": ["09:00:00", "09:30:00", "10:00:00"],
    "bookedSlots": ["10:30:00", "11:00:00"],
    "scheduleStart": "09:00",
    "scheduleEnd": "17:00",
    "dayOfWeek": "Monday"
  }
}
```

**Logic:**

- Generates 30-minute slots from schedule
- Excludes already booked slots
- Excludes cancelled appointments

#### GET `/api/appointments/doctor/:doctorId/schedule`

Get doctor's weekly schedule (public).

### Admin Endpoints

#### GET `/api/admin/stats` 🔒

Get system-wide statistics.

**Response:**

```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "totalDoctors": 25,
    "totalAppointments": 480
  }
}
```

#### POST `/api/admin/doctors` 🔒

Add new doctor.

**Request Body:**

```json
{
  "fullName": "Dr. John Smith",
  "email": "john.smith@clinic.com",
  "password": "securePass123",
  "specialization": "Neurology",
  "consultationFee": 250.0,
  "bio": "15 years experience",
  "roomNumber": "C-305"
}
```

#### DELETE `/api/admin/doctors/:doctorId` 🔒

Delete doctor and associated user account.

#### GET `/api/admin/patients` 🔒

Get all patients.

#### DELETE `/api/admin/patients/:patientId` 🔒

Delete patient and associated user account.

### Medical Record Endpoints

#### POST `/api/medical-records/appointment/:appointmentId` 🔒

Create or update medical record for appointment.

**Request Body:**

```json
{
  "diagnosis": "Hypertension",
  "prescription": "Medication X, 10mg daily",
  "treatmentPlan": "Follow-up in 2 weeks"
}
```

#### GET `/api/medical-records/patient/:patientId` 🔒

Get patient's medical history.

#### GET `/api/medical-records/my-patients` 🔒

Get doctor's patient list.

#### GET `/api/medical-records/:recordId` 🔒

Get specific medical record.

#### PUT `/api/medical-records/:recordId` 🔒

Update medical record.

#### DELETE `/api/medical-records/:recordId` 🔒

Delete medical record.

---

## Authentication & Authorization

### JWT Token Structure

```javascript
{
    "id": 1,              // User ID
    "role": "doctor",     // User role
    "iat": 1234567890,    // Issued at
    "exp": 1234654290     // Expires in 1 day
}
```

### Authorization Flow

1. **User logs in** → Backend validates credentials
2. **Backend generates JWT** → Signs with `JWT_SECRET`
3. **Token sent to frontend** → Stored in Zustand + localStorage
4. **Frontend includes token** → In Authorization header for protected routes
5. **Backend validates token** → authMiddleware verifies signature and expiration
6. **Access granted/denied** → Based on role and endpoint permissions

### Role-Based Access Control

| Feature                      | Patient | Doctor | Admin |
| ---------------------------- | ------- | ------ | ----- |
| View all doctors             | ✅      | ✅     | ✅    |
| Book appointments            | ✅      | ❌     | ❌    |
| View own appointments        | ✅      | ✅     | ❌    |
| Manage schedule              | ❌      | ✅     | ❌    |
| Update appointment status    | ❌      | ✅     | ❌    |
| Create medical records       | ❌      | ✅     | ❌    |
| View patient medical history | ❌      | ✅     | ❌    |
| Add/delete doctors           | ❌      | ❌     | ✅    |
| Add/delete patients          | ❌      | ❌     | ✅    |
| View system stats            | ❌      | ❌     | ✅    |

---

## Setup & Installation

### Prerequisites

- Node.js v16+ and npm
- MySQL database (or Aiven account)
- Mailjet account for email service

### Backend Setup

1. **Clone and navigate:**

```bash
cd /home/abdelmoaty/Desktop/c-back-backup
```

2. **Install dependencies:**

```bash
npm install
```

3. **Create `.env` file:**

```env
# Database Configuration
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASS=your_database_password
DB_HOST=your_database_host
DB_PORT=your_database_port

# JWT Secret
JWT_SECRET=your_very_secure_random_string

# Mailjet Configuration
MJ_APIKEY_PUBLIC=your_mailjet_public_key
MJ_APIKEY_PRIVATE=your_mailjet_private_key
MAIL_SENDER=verified@email.com

# Server Port
PORT=3000
```

4. **Sync database:**

```bash
node -e "require('./models'); require('./config/database').sync({alter: true})"
```

5. **Start server:**

```bash
node index.js
```

Server will run on `http://localhost:3000`

6. **Access API documentation:**

```
http://localhost:3000/api-docs
```

### Frontend Setup

1. **Navigate to frontend:**

```bash
cd frontend/clinic-frontend
```

2. **Install dependencies:**

```bash
npm install
```

3. **Create `.env.local` file:**

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

4. **Run development server:**

```bash
npm run dev
```

Frontend will run on `http://localhost:3001`

5. **Build for production:**

```bash
npm run build
npm start
```

---

## Features by Role

### 👤 Patient Features

1. **Registration & Profile Management**

   - Create account with email/password
   - Complete profile (DOB, gender, blood group, address)
   - Update contact information

2. **Doctor Discovery**

   - Browse all available doctors
   - View doctor specializations, fees, and bios
   - Check doctor schedules

3. **Appointment Booking**

   - Select doctor and preferred date
   - View available time slots (30-min intervals)
   - Book appointments with reason for visit
   - Receive email confirmation

4. **Appointment Management**

   - View upcoming appointments
   - View appointment history
   - Filter by status (scheduled, completed, cancelled)
   - See doctor details for each appointment

5. **Dashboard**
   - Quick overview of upcoming appointments
   - Easy access to book new appointments
   - Profile summary

### 👨‍⚕️ Doctor Features

1. **Profile Management**

   - Complete professional profile
   - Set specialization and consultation fee
   - Update bio and room number

2. **Schedule Management**

   - Create weekly availability schedules
   - Set different hours for different days
   - Toggle availability on/off
   - Edit or delete schedule slots
   - Prevent overlapping schedules

3. **Appointment Management**

   - View today's appointments
   - View upcoming appointments
   - Filter by date or status
   - Update appointment status (scheduled, completed, cancelled, no_show)
   - See patient details for each appointment

4. **Patient Management**

   - View list of all patients
   - Access patient medical history
   - Create and manage medical records

5. **Medical Records**

   - Create records after appointments
   - Add diagnosis, prescription, and treatment plan
   - Update existing records
   - View complete patient history

6. **Dashboard**
   - Today's appointment count
   - Weekly appointment statistics
   - Monthly earnings calculation
   - Total patient count
   - Quick access to today's schedule

### 🔐 Admin Features

1. **System Overview**

   - Total user count
   - Total doctor count
   - Total appointment count
   - System-wide statistics

2. **Doctor Management**

   - View all doctors with details
   - Add new doctors to the system
   - Delete doctors (cascades to user account)
   - Assign specializations and fees

3. **Patient Management**

   - View all patients
   - View patient details
   - Delete patients (cascades to user account)

4. **User Management**
   - Monitor all user accounts
   - Role-based user creation
   - Account deletion with data cleanup

---

## Email Notifications

The system sends automated emails for:

### 1. Welcome Email (Registration)

- **Trigger**: New user registration
- **Recipients**: Newly registered user
- **Content**: Welcome message, account confirmation

### 2. Appointment Confirmation

- **Trigger**: Successful appointment booking
- **Recipients**: Patient
- **Content**: Doctor name, date, time, reason for visit

### Email Configuration

- **Service**: Mailjet
- **Sender**: Must be verified in Mailjet dashboard
- **Async Processing**: Emails sent after response to avoid blocking

---

## Best Practices Implemented

### Backend

1. ✅ **Password Security**: bcrypt hashing with salt rounds
2. ✅ **JWT Expiration**: Tokens expire after 24 hours
3. ✅ **Input Validation**: Server-side validation for all inputs
4. ✅ **Error Handling**: Comprehensive try-catch blocks
5. ✅ **SQL Injection Prevention**: Sequelize ORM parameterized queries
6. ✅ **CORS Configuration**: Controlled cross-origin requests
7. ✅ **Async Email Sending**: Non-blocking email operations
8. ✅ **Database Indexing**: Primary keys and foreign keys indexed
9. ✅ **Environment Variables**: Sensitive data in .env
10. ✅ **API Documentation**: Swagger for all endpoints

### Frontend

1. ✅ **TypeScript**: Type safety throughout
2. ✅ **Form Validation**: React Hook Form + Zod schemas
3. ✅ **Error Boundaries**: Graceful error handling
4. ✅ **Loading States**: User feedback during async operations
5. ✅ **Responsive Design**: Mobile-first approach
6. ✅ **Dark Mode**: User preference support
7. ✅ **Token Management**: Secure storage and automatic injection
8. ✅ **Route Protection**: Auth checks before rendering
9. ✅ **SEO Optimization**: Metadata and semantic HTML
10. ✅ **Accessibility**: ARIA labels and keyboard navigation

---

## API Response Format

### Success Response

```json
{
    "success": true,
    "message": "Operation successful",
    "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate entry)
- `500`: Server Error

---

## Testing Scripts

The project includes several test scripts:

- `test_full_flow.js`: Complete system workflow test
- `test_registration_fix.js`: User registration testing
- `test_patient_appointments.js`: Appointment booking flow
- `verify_doctors.js`: Doctor endpoints verification
- `verify_admin.js`: Admin functionality testing
- `test_mailjet.js`: Email service testing

---

## Future Enhancements

Potential improvements:

1. 📱 Mobile app (React Native)
2. 💳 Payment integration for consultation fees
3. �� Advanced analytics and reporting
4. 💬 In-app messaging between doctors and patients
5. 📹 Video consultation support
6. 🔔 Push notifications
7. 📝 Prescription management system
8. 🏥 Multi-clinic support
9. 🌍 Internationalization (i18n)
10. 📱 SMS notifications
11. 🔍 Advanced search and filtering
12. 📊 Patient health tracking
13. 🗓️ Recurring appointments
14. ⭐ Doctor ratings and reviews
15. 📄 Report generation (PDF)

---

## Support & Maintenance

### Logs

- **Server logs**: Console output in terminal
- **Error tracking**: Check `server.log` file
- **Database logs**: Set `logging: console.log` in database.js

### Common Issues

**Issue**: Database connection failed
**Solution**: Check Aiven credentials, SSL configuration, and network

**Issue**: JWT token invalid
**Solution**: Verify JWT_SECRET matches, check token expiration

**Issue**: Email not sending
**Solution**: Verify Mailjet API keys, check sender email verification

**Issue**: CORS errors
**Solution**: Ensure frontend URL is allowed in CORS config

---

## License

This project is proprietary software developed for clinic management purposes.

---

## Conclusion

This Clinic Management System provides a complete, production-ready solution for managing clinic operations with role-based access, secure authentication, appointment scheduling, and medical record management. The modern tech stack ensures scalability, maintainability, and excellent user experience across all devices.

For questions or support, please refer to the API documentation at `/api-docs` when the server is running.

**Last Updated**: December 8, 2025
