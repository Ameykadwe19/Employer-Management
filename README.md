
# Employer Management 👨‍💼📋

This project is a complete full-stack web application designed to help users efficiently manage employer records. It features a secure user authentication system that supports both traditional email/password login as well as Google OAuth integration for easy sign-in. The backend is powered by Node.js and Express.js, connecting to a PostgreSQL database where all employer and user data is stored reliably.

Users can perform CRUD (Create, Read, Update, Delete) operations on employer records through a responsive and user-friendly dashboard. Additionally, the app supports bulk uploading of employer data via CSV files, making it simple to add multiple records at once.

The backend exposes RESTful APIs that handle data processing and ensure smooth interaction between the frontend and database, while maintaining security best practices such as password hashing and session management..

---

## 🌐 Tech Stack

- **Frontend**: EJS, HTML5, CSS3 (Tailwind / Bootstrap)
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL
- **Authentication**: Passport.js (Local + Google OAuth2)
- **Others**: multer (CSV upload), csv-parser, connect-flash, express-session

---

## 🚀 How to Run the Project Locally

### 1. Clone the Repository

```bash
git clone https://github.com/Ameykadwe19/Employer-Management.git
cd Employer-Management
```

### 2. Install Node.js Dependencies

Make sure you have **Node.js** and **npm** installed.

```bash
npm install
```

### 3. Setup PostgreSQL Database

- Install PostgreSQL if not already installed.
- Create a new database. Example:

```sql
CREATE DATABASE employer_db;
```

- Create tables with these schemas:

```sql
-- Users table: store registered users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  google_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employers table: employer records linked to users
CREATE TABLE employers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  contact VARCHAR(20),
  position VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

- The `user_id` column in `employers` table is a **foreign key** referencing the `users` table. This creates a **one-to-many relationship**, where one user can manage many employers.

---

### 4. Setup `.env` File

Create a `.env` file in the root directory and add the following:

```
DATABASE_URL=postgresql://username:password@localhost:5432/employer_db
SESSION_SECRET=yourSecretKey
GOOGLE_CLIENT_ID=yourGoogleClientID
GOOGLE_CLIENT_SECRET=yourGoogleClientSecret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

👉 Replace the above values with your actual DB username, password, and Google credentials.

---

## 📡 Backend API Routes

| Method | Route                     | Function                          |
|--------|---------------------------|-----------------------------------|
| GET    | `/dashboard`              | Load user dashboard               |
| POST   | `/employers/add`          | Add new employer                  |
| POST   | `/employers/update/:id`   | Update existing employer          |
| POST   | `/employers/delete/:id`   | Delete single employer            |
| POST   | `/employers/delete-all`   | Delete all employer records       |
| POST   | `/upload`                 | Upload CSV file for bulk insert   |
| GET    | `/auth/google`            | Google login                      |
| GET    | `/auth/google/callback`   | Handle OAuth response             |
| POST   | `/register`               | Register with email & password    |
| POST   | `/login`                  | Login with email & password       |
| GET    | `/logout`                 | Logout user                       |

---

## 🔗 Example: How Join Works in Backend API

When fetching employer records for a user, the backend uses a SQL JOIN to get data like this:

```sql
SELECT employers.*, users.name AS user_name, users.email AS user_email
FROM employers
JOIN users ON employers.user_id = users.id
WHERE users.id = $1;
```

This query fetches all employers related to a specific user, along with user details.

---

## 📸 Screenshots

<!-- Optional: add screenshots here -->
- Login Page
- Dashboard
- Upload Section

---

## 📁 Folder Structure

```
Employer-Management/
├── public/          # Static files (CSS, JS)
├── views/           # EJS templates
├── routes/          # Express route handlers
├── models/          # PostgreSQL DB functions
├── uploads/         # Uploaded CSV files
├── .env             # Environment config
├── app.js           # Main Express app
└── package.json     # Node dependencies
```

---

## 🧩 Main Dependencies

| Package           | Purpose                                |
|-------------------|----------------------------------------|
| express           | Backend web server                     |
| ejs               | Templating engine                      |
| pg                | PostgreSQL client                      |
| passport          | Authentication middleware              |
| passport-local    | Email/password auth                    |
| passport-google-oauth20 | Google OAuth2 auth              |
| express-session   | Session management                     |
| bcrypt            | Password hashing                       |
| multer, csv-parser| File upload and CSV parsing            |
| connect-flash     | Flash message for forms                |
| dotenv            | Manage environment variables           |

---

## 🙋‍♂️ Author

**Amey Kadwe**  
📧 Email: [ameykadwe19@gmail.com]  
🌐 GitHub: [Ameykadwe19](https://github.com/Ameykadwe19)

---

## 📃 License

This project is licensed under the **MIT License**.

