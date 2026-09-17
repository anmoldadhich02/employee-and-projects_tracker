
````markdown
# Architrack — Construction & Architectural Practice Management Platform

A full-stack Enterprise Resource Planning (ERP) platform built with React, Node.js, and PostgreSQL for real-time workforce allocation, site inspections, task checklist tracking, and automated document generation.

Architrack provides a centralized platform for managing important operational activities within construction and architectural practices. It combines workforce management, site-related activities, checklist tracking, and administrative functionality into a single web-based application.

---

## Key Features

### Workforce Allocation
- Manage workforce information from a centralized platform.
- Assign employees based on their roles and designations.
- Maintain employee-related information for administrative use.

### Site Inspections
- Manage site inspection activities.
- Maintain inspection-related information within the application.
- Provide a structured workflow for handling site-level operations.

### Task Checklist Tracking
- Create and manage task checklists.
- Configure checklist items through the administrative dashboard.
- Track checklist-related activities.

### Automated Document Generation
- Generate documents based on application data.
- Reduce repetitive manual documentation work.
- Keep generated information organized within the application workflow.

### Employee Management
- Register new employees.
- Manage employee details.
- Assign designations to employees.
- Access employee information through the administrative dashboard.

### Administrative Dashboard
- Centralized interface for administrative operations.
- Manage employees and designations.
- Configure checklists.
- Access the different management modules provided by the application.

### Authentication
- Secure user authentication using JWT.
- Authentication is handled by the backend server.
- Protected application functionality is available to authorized users.

---

## Technology Stack

### Frontend
- React
- JavaScript
- HTML
- CSS
- Vite

### Backend
- Node.js
- Express.js
- JavaScript

### Database
- PostgreSQL

### Authentication
- JSON Web Token (JWT)

### Development Tools
- npm
- Git
- GitHub

---

## Application Architecture

Architrack follows a client-server architecture consisting of a React frontend, Node.js backend, and PostgreSQL database.

```text
                    ┌─────────────────────┐
                    │       User          │
                    │      Browser        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │       Client        │
                    └──────────┬──────────┘
                               │
                          HTTP Requests
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Node.js Server   │
                    │       Backend       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     PostgreSQL      │
                    │      Database       │
                    └─────────────────────┘
````

### Application Flow

1. The user interacts with the React frontend.
2. The frontend sends requests to the Node.js backend.
3. The backend processes the request and handles authentication where required.
4. The backend communicates with the PostgreSQL database.
5. The requested data is returned to the frontend.
6. The React application displays the result to the user.

---

## Project Structure

The project is divided into separate frontend and backend directories:

```text
Architrack/
│
├── client/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── server/
│   ├── ...
│   ├── package.json
│   └── .env
│
└── README.md
```

The `client` directory contains the React frontend, while the `server` directory contains the Node.js backend and database-related functionality.

---

## Prerequisites

Before running the application, make sure you have the following installed on your target machine:

1. **Node.js** (v18.0.0 or higher recommended)
2. **npm** (comes pre-packaged with Node.js)
3. **PostgreSQL** database (v13 or higher, running locally, in a VM, or as a Docker container)
4. **Git** (recommended for cloning the repository)

You can verify the installed versions using:

```bash
node --version
npm --version
psql --version
git --version
```

---

## Step-by-Step Setup Guide

### 1. Copy the Codebase

Clone or copy the project folder to the new machine.

If using Git:

```bash
git clone <repository-url>
```

Then navigate into the project directory:

```bash
cd Architrack
```

---

### 2. Configure the Database

1. Ensure your PostgreSQL service is running.

2. Create a new empty database named `erp_system` (or any name you prefer):

   ```sql
   CREATE DATABASE erp_system;
   ```

3. Make sure the PostgreSQL username, password, host, and port match the values that will be provided in the server `.env` file.

> **Note:** You do not need to create tables manually. The backend will automatically run the schema and seed default credentials on its first run.

---

### 3. Setup Environment Variables

Navigate to the `server` directory and create or verify the `.env` file:

```bash
cd server
```

Create a file named `.env` containing the following values:

```ini
PORT=5001
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
DB_NAME=erp_system
JWT_SECRET=supersecretjwtkey_please_change
```

Adjust the database password, database name, host, and ports to match your local PostgreSQL configuration.

### Environment Variable Description

| Variable      | Description                            |
| ------------- | -------------------------------------- |
| `PORT`        | Port on which the backend server runs  |
| `DB_USER`     | PostgreSQL database user               |
| `DB_PASSWORD` | PostgreSQL database password           |
| `DB_HOST`     | PostgreSQL database host               |
| `DB_PORT`     | PostgreSQL database port               |
| `DB_NAME`     | PostgreSQL database name               |
| `JWT_SECRET`  | Secret key used for JWT authentication |

> **Important:** Do not commit the `.env` file to GitHub. Keep database credentials and JWT secrets private.

---

### 4. Install Dependencies

Install packages for both the server and the frontend client.

#### For the Server

```bash
cd server
npm install
```

#### For the Client

```bash
cd ../client
npm install
```

---

## Running the Application

To start the software, you will run both the backend server and the frontend development server.

### 1. Start the Backend Server

From the `server` directory, run:

```bash
npm start
```

For development auto-reloads, if `nodemon` is installed:

```bash
npm run dev
```

Alternatively, you can start the server directly with Node.js:

```bash
node server.js
```

On start, you should see console logs confirming the database connection, table creations, and the seeding of the default admin account.

The backend runs on:

```text
http://localhost:5001
```

---

### 2. Start the Frontend Client

Open a new terminal window and navigate to the `client` directory:

```bash
cd client
```

Start the frontend development server:

```bash
npm run dev
```

The React frontend will start running and display the access URL, usually:

```text
http://localhost:5173
```

Open the displayed URL in your browser to access Architrack.

---

## Logging In (First-time Credentials)

Open:

```text
http://localhost:5173
```

You can log in using the pre-seeded Owner Admin credentials:

```text
Candidate Name: Yash
Email:          yash.d@live-design.in
Password:       admin123
```

You can then register new employees, assign designations, and configure checklists from the Admin dashboard.

> **Security Note:** These credentials are intended for development and initial setup. The default password should be changed before deploying the application in a production environment.

---

## Application Workflow

After successfully starting the application and logging in, the general workflow is:

```text
Login
  │
  ▼
Authentication
  │
  ▼
Admin Dashboard
  │
  ├── Employee Management
  │
  ├── Designation Management
  │
  ├── Workforce Allocation
  │
  ├── Site Inspections
  │
  ├── Task Checklists
  │
  └── Document Generation
```

The available functionality depends on the modules implemented in the current version of the application.

---

## Database

Architrack uses PostgreSQL for persistent application data.

The default configuration uses:

```text
Host:     localhost
Port:     5432
Database: erp_system
User:     postgres
```

The backend is responsible for establishing the database connection and initializing the required schema.

No manual table creation is required during the initial setup when using the configured application initialization process.

---

## API

The React frontend communicates with the Node.js backend through HTTP requests.

The backend is available locally at:

```text
http://localhost:5001
```

The API is responsible for handling application operations such as:

* Authentication
* Employee management
* Designation management
* Workforce-related operations
* Site inspection operations
* Checklist management
* Document-related operations

Authentication-protected requests require the appropriate JWT authentication token.

> **Note:** For the exact API endpoints, HTTP methods, request formats, and response structures, refer to the route definitions implemented in the `server` directory.

---

## Troubleshooting

### PostgreSQL Connection Error

If the backend cannot connect to PostgreSQL, verify:

* PostgreSQL is running.
* The database `erp_system` exists.
* `DB_USER` is correct.
* `DB_PASSWORD` is correct.
* `DB_HOST` is correct.
* `DB_PORT` is correct.

You can verify the PostgreSQL connection using:

```bash
psql -U postgres -h localhost -p 5432
```

---

### Port Already in Use

If port `5001` is already being used, either stop the process using that port or change the backend port in `.env`.

For example:

```ini
PORT=5002
```

Make sure the frontend is also configured to communicate with the updated backend port if required.

---

### Dependencies Not Installed

If the application reports missing packages, run:

```bash
cd server
npm install
```

and:

```bash
cd ../client
npm install
```

Then restart both servers.

---

### Frontend Does Not Load

Make sure the frontend development server is running:

```bash
npm run dev
```

Then open the URL displayed in the terminal, normally:

```text
http://localhost:5173
```

---

### Frontend Cannot Communicate with Backend

Make sure both services are running:

```text
Frontend → http://localhost:5173
Backend  → http://localhost:5001
```

If the backend is running on a different port, verify that the frontend is using the correct backend URL.

---

### Environment Variables Are Not Working

Check that:

* The `.env` file is located inside the `server` directory.
* All variable names are spelled correctly.
* PostgreSQL credentials are correct.
* The backend has been restarted after changing `.env`.
* `.env` has not been accidentally renamed to `.env.txt`.

---

## Security

Before using Architrack in a production environment:

* Change the default admin password.
* Replace the example `JWT_SECRET` with a strong, unique secret.
* Never commit `.env` files to the repository.
* Do not expose database credentials publicly.
* Use HTTPS for production deployments.
* Keep project dependencies updated.
* Restrict database access to trusted hosts.
* Review authentication and authorization configuration before deployment.

---

## Development

For development, it is recommended to keep the frontend and backend running in separate terminal windows.

### Terminal 1 — Backend

```bash
cd server
npm start
```

### Terminal 2 — Frontend

```bash
cd client
npm run dev
```

Before committing changes:

1. Test the modified functionality.
2. Check that the frontend starts correctly.
3. Check that the backend connects to PostgreSQL.
4. Verify that existing functionality still works.
5. Avoid committing `.env` files or other sensitive information.

---

## Contributing

Contributions and improvements are welcome.

To contribute:

1. Clone the repository.
2. Create a new branch for your changes.
3. Make and test your changes locally.
4. Commit your changes with a clear commit message.
5. Push the branch to your repository.
6. Create a pull request.

Example:

```bash
git checkout -b feature/your-feature-name
```

```bash
git add .
git commit -m "feat: describe your change"
```

```bash
git push origin feature/your-feature-name
```

Please make sure that changes do not unintentionally break existing functionality.

---



## Project Status

Architrack is an actively developed ERP platform for construction and architectural practice management.

The current implementation includes functionality for workforce management, site inspections, task checklist tracking, employee management, administrative operations, authentication, and automated document generation.

```
