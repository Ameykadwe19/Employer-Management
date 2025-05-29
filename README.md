
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
- Hompage
![Screenshot (19)](https://github.com/user-attachments/assets/9c2529a0-a44c-4ce1-a769-9c2a561d8827)

- Register page
  ![Screenshot (20)](https://github.com/user-attachments/assets/88d29dbb-a0c5-4d30-9058-1591a7154bfb)

- Login Page
  ![Screenshot (21)](https://github.com/user-attachments/assets/b319c248-42fd-49e8-a917-94b0fe540c5d)

- Dashboard
  ![Screenshot (22)](https://github.com/user-attachments/assets/cef21972-eaaa-4dc4-879f-4b61d3769121)

- Add employer
  ![Screenshot (23)](https://github.com/user-attachments/assets/0e28a149-5f1b-41d3-8f56-7be796f2329f)

- Edit employer
  ![Screenshot (24)](https://github.com/user-attachments/assets/6064f819-ccc9-4910-8cd4-eaff8947bad9)

- Instructions
  ![Screenshot (25)](https://github.com/user-attachments/assets/41dd3559-021d-432c-9d6b-2e3fffed9f63)


  

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

