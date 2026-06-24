# BlueprintERP — Construction & Architectural Practice Management Platform

A full-stack Enterprise Resource Planning (ERP) platform built with React, Node.js, and PostgreSQL for real-time workforce allocation, site inspections, task checklist tracking, and automated document generation.

---

## Prerequisites

Before running the application, make sure you have the following installed on your target machine:

1. **Node.js** (v18.0.0 or higher recommended)
2. **npm** (comes pre-packaged with Node.js)
3. **PostgreSQL** database (v13 or higher, running locally, in a VM, or as a Docker container)

---

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
