# Architrack — Construction & Architectural Practice Management Platform

Architrack is a full-stack ERP platform designed for construction
and architectural practices. It centralizes workforce management,
project operations, site inspections, task tracking, and document
workflows through a React frontend, Node.js backend, and PostgreSQL
database.

---
## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Backend | Node.js |
| API | REST API |
| Database | PostgreSQL |
| Authentication | JWT |
| Package Manager | npm |

## Project Structure

```text
Architrack/
├── client/
│   ├── src/
│   └── package.json
│
├── server/
│   ├── ...
│   └── package.json
│
├── README.md
└── ...
## Prerequisites

Before running the application, make sure you have the following installed on your target machine:

1. **Node.js** (v18.0.0 or higher recommended)
2. **npm** (comes pre-packaged with Node.js)
3. **PostgreSQL** database (v13 or higher, running locally, in a VM, or as a Docker container)

---
## Key Features

- Workforce and employee management
- Project and task management
- Site inspection management
- Checklist tracking
- Attendance and time tracking
- Role-based access control
- JWT-based authentication
- PostgreSQL data management
- Automated document generation

  ## Architecture

Architrack follows a client-server architecture:

React Frontend
       ↓
REST API
       ↓
Node.js Backend
       ↓
PostgreSQL Database

The React client provides the user interface, while the Node.js
backend handles business logic, authentication, API requests and
database operations. PostgreSQL stores application data.

## Step-by-Step Setup Guide

### 1. Copy the Codebase
Clone or copy the project folder to the new machine.

### 2. Configure the Database
1. Ensure your PostgreSQL service is running.
2. Create a new empty database named `erp_system` (or any name you prefer):
   ```sql
   CREATE DATABASE erp_system;
   ```
   *(Note: You do not need to create tables manually. The backend will automatically run the schema and seed default credentials on its first run.)*

### 3. Setup Environment Variables
Navigate to the `server` directory and create or verify the `.env` file:
```bash
cd server
```
Create a file named `.env` containing the following values (adjust password/ports to match your database settings):
```ini
PORT=5001
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_system
JWT_SECRET=supersecretjwtkey_please_change
```

### 4. Install Dependencies
Install packages for both the server and the frontend client.

* **For the Server:**
  ```bash
  cd server
  npm install
  ```

* **For the Client (Frontend):**
  ```bash
  cd ../client
  npm install
  ```

---

## Running the Application

To start the software, you will run both the backend server and the frontend development server:

### 1. Start the Backend Server
From the `server` directory, run:
```bash
npm start
# OR for development auto-reloads (if nodemon is installed):
npm run dev
# OR simply start with node:
node server.js
```
*On start, you should see console logs confirming connection, table creations, and the seeding of the default admin account.*

### 2. Start the Frontend Client
Open a new terminal window, navigate to the `client` directory, and run:
```bash
cd client
npm run dev
```
*The React frontend will start running and display the access URL (usually `http://localhost:5173`).*


---

## Logging In (First-time Credentials)

Open `http://localhost:5173` in your browser. You can log in using the pre-seeded Owner Admin credentials:

* **Candidate Name:** `Yash`  *(or email: `yash.d@live-design.in`)*
* **Password:** `admin123`

You can then register new employees, assign designations, and configure checklists from the Admin dashboard.

## Troubleshooting

### Database connection failed

Check that:

- PostgreSQL is running.
- The database exists.
- `.env` contains the correct credentials.
- PostgreSQL is listening on the configured port.

### Port already in use

Change the configured backend port in `.env`.

### Frontend cannot connect to backend

Check that:

- The backend server is running.
- The frontend is using the correct API URL.
- The configured backend port matches the frontend configuration.
