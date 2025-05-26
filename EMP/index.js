import env from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import session from "express-session";
import flash from "connect-flash";
import multer from "multer";
import readline from "readline";
import { Readable } from "stream";
import csv from "csv-parser";
import fs from "fs";
import path from "path";

const app = express();
const port = process.env.PORT || 3000;


const saltRounds = 10;
env.config();

// Multer setup for file upload (memory storage)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB limit
});

// Middleware setup

app.set("view engine", "ejs");

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use((req, res, next) => {
  res.set(
    "Cache-Control",
    "no-cache, no-store, must-revalidate, private, max-age=0"
  );
  next();
});


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(passport.initialize());
app.use(passport.session());

// DB setup
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

// Routes

app.get("/download-csv", async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/login");

  try {
    const result = await db.query(
      "SELECT * FROM employers WHERE user_id = $1",
      [req.user.id]
    );

    const csvRows = ["name,age,email,job_role,salary"];
    result.rows.forEach((emp) => {
      csvRows.push(
        `${emp.name},${emp.age},${emp.email},${emp.job_role},${emp.salary}`
      );
    });

    const csvData = csvRows.join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=employers.csv");
    res.send(csvData);
  } catch (err) {
    console.error("CSV download error:", err);
    res.status(500).send("Failed to generate CSV");
  }
});

app.get("/", (req, res) => {
  const message = req.session.message;
  delete req.session.message;
  res.render("home", { message });
});

app.get("/login", (req, res) => {
  const error =
    req.query.error === "invalid" ? "Invalid email or password." : undefined;
  res.render("login", { error });
});

app.get("/register", (req, res) => res.render("register.ejs", { error: null }));

// Get all employers (for API)
app.get("/employers", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM employers ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error fetching employers" });
  }
});

// Get one employer by id (API)
app.get("/employers/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query("SELECT * FROM employers WHERE id=$1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Employer not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error fetching employer" });
  }
});

// Register
app.post("/register", async (req, res) => {
  const { name, username: email, password } = req.body;

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      return res.render("register", {
        error:
          "Email already registered. Please login or use a different email.",
      });
    }

    bcrypt.hash(password, saltRounds, async (err, hash) => {
      if (err) {
        console.error("Error hashing password:", err);
        return res.render("register", {
          error: "Server error while processing your request.",
        });
      }

      const result = await db.query(
        "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
        [name, email, hash]
      );
      const user = result.rows[0];

      req.login(user, (err) => {
        if (err) {
          console.error(err);
          return res.render("register", {
            error: "Error logging in after registration.",
          });
        }
        res.redirect("/dashboard");
      });
    });
  } catch (err) {
    console.log(err);
    res.render("register", { error: "Server error. Please try again later." });
  }
});

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login?error=invalid",
    failureFlash: false,
  })
);

// Logout
app.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.message = {
      type: "danger",
      text: "You have been logged out successfully.",
    };
    req.session.save(() => {
      res.redirect("/");
    });
  });
});

// Dashboard (Read)
app.get("/dashboard", async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/login");

  try {
    const result = await db.query(
      "SELECT * FROM employers WHERE user_id = $1",
      [req.user.id]
    );
    res.render("dashboard.ejs", {
      employers: result.rows,
      user: req.user,
    });
  } catch (err) {
    console.error("Error fetching employers:", err);
    res.status(500).send("Internal Server Error");
  }
});

// CREATE: Add new employer
app.post("/employers", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");

  const { name, age, email, job_role, salary } = req.body;
  if (!name || !age || !email || !job_role || salary === undefined) {
    return res.status(400).send("Missing required fields");
  }

  try {
    const insertQuery = `
      INSERT INTO employers (name, age, email, job_role, salary, user_id) 
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
    const values = [name, age, email, job_role, salary, req.user.id];
    const result = await db.query(insertQuery, values);
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error creating employer");
  }
});

// READ: Employer details by id (only if owned by user)
app.get("/employers/:id", async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/login");

  const id = req.params.id;
  try {
    const result = await db.query(
      "SELECT * FROM employers WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      req.session.message = { type: "error", text: "Employer data not found!" };
      return res.redirect("/dashboard");
    }
    res.render("employer-details.ejs", { employer: result.rows[0] });
  } catch (err) {
    console.error(err);
    req.session.message = {
      type: "error",
      text: "Error fetching employer data.",
    };
    res.redirect("/dashboard");
  }
});

// UPDATE: Show edit form
app.get("/employers/:id/edit", async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/login");

  const id = req.params.id;
  try {
    const result = await db.query(
      "SELECT * FROM employers WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).send("Employer not found or access denied");
    }
    res.render("edit-employer.ejs", { employer: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error loading employer");
  }
});

// UPDATE: Save edited employer
app.post("/employers/:id/update", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");

  const id = req.params.id;
  const { name, age, email, job_role, salary } = req.body;
  if (!name || !age || !email || !job_role || salary === undefined) {
    return res.status(400).send("Missing required fields");
  }

  try {
    const updateQuery = `
      UPDATE employers 
      SET name=$1, age=$2, email=$3, job_role=$4, salary=$5 
      WHERE id=$6 AND user_id=$7 RETURNING *`;
    const values = [name, age, email, job_role, salary, id, req.user.id];

    const result = await db.query(updateQuery, values);
    if (result.rows.length === 0) {
      return res.status(404).send("Employer not found or access denied");
    }
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error updating employer");
  }
});

// DELETE: Delete employer
app.post("/employers/:id/delete", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).send("Not authenticated");

  const id = req.params.id;
  try {
    const deleteQuery =
      "DELETE FROM employers WHERE id=$1 AND user_id=$2 RETURNING *";
    const result = await db.query(deleteQuery, [id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).send("Employer not found or access denied");
    }
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error deleting employer");
  }
});

// ========== AUTH ========== //

passport.use(
  "local",
  new Strategy(async (username, password, cb) => {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [
        username,
      ]);
      if (result.rows.length === 0) return cb(null, false);
      const user = result.rows[0];
      bcrypt.compare(password, user.password, (err, valid) => {
        if (err) return cb(err);
        return cb(null, valid ? user : false);
      });
    } catch (err) {
      return cb(err);
    }
  })
);
passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;
        const googleId = profile.id;

        let result = await db.query(
          "SELECT * FROM users WHERE google_id = $1 OR email = $2",
          [googleId, email]
        );

        if (result.rows.length > 0) {
          return cb(null, result.rows[0]);
        } else {
          const insertResult = await db.query(
            "INSERT INTO users (name, email, google_id) VALUES ($1, $2, $3) RETURNING *",
            [name, email, googleId]
          );
          return cb(null, insertResult.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    if (result.rows.length === 0) return done(null, false);
    done(null, result.rows[0]);
  } catch (err) {
    done(err);
  }
});

// Google OAuth route
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    successRedirect: "/dashboard",
    failureRedirect: "/login?error=notregistered",
  })
);
app.get("/dashboard", async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/login");

  try {
    const result = await db.query(
      "SELECT * FROM employers WHERE user_id = $1",
      [req.user.id]
    );
    console.log("Fetched employers:", result.rows);

    const message = req.session.message;
    delete req.session.message;

    res.render("dashboard.ejs", {
      employers: result.rows,
      user: req.user,
      message: message || null, // Yahan message pass karna zaroori hai
    });
  } catch (err) {
    console.error("Error fetching employers:", err);
    res.status(500).send("Internal Server Error");
  }
});

// ========== New Route for Bulk Upload Employers via Text File ========== //

app.post("/upload-employers", upload.single("file"), async (req, res) => {
  try {
    console.log("Upload route hit");

    if (!req.file) {
      console.log("No file uploaded");
      return res.status(400).send("No file uploaded");
    }
    console.log("File received:", req.file.originalname);

    const employers = [];

    // Create a readable stream from the buffer
    const readable = Readable.from(req.file.buffer);

    readable
      .pipe(csv())
      .on("data", (row) => {
        console.log("CSV row:", row);
        const age = parseInt(row.age, 10);
        const salary = parseInt(row.salary, 10);

        if (isNaN(age) || isNaN(salary)) {
          console.log("Invalid age or salary:", row);
          return; // skip invalid row
        }

        employers.push({
          name: row.name,
          age,
          email: row.email,
          jobRole: row.job_role,
          salary,
        });
      })
      .on("end", async () => {
        console.log("CSV parsing finished. Employers:", employers.length);

        try {
          for (const emp of employers) {
            console.log("Inserting employer:", emp);
            await db.query(
              "INSERT INTO employers (name, age, email, job_role, salary, user_id) VALUES ($1, $2, $3, $4, $5, $6)",
              [
                emp.name,
                emp.age,
                emp.email,
                emp.jobRole,
                emp.salary,
                req.user.id,
              ]
            );
          }
          console.log("All inserts done");
          req.session.message = {
            type: "success",
            text: "Employers uploaded successfully!",
          };
          res.redirect("/dashboard");
        } catch (dbErr) {
          console.error("Database insert error:", dbErr);
          res.status(500).send("Database error");
        }
      })
      .on("error", (err) => {
        console.error("CSV stream error:", err);
        res.status(500).send("File parsing error");
      });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).send("Unexpected server error");
  }
});
app.post("/employers/delete-all", async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/login");

  try {
    await db.query("DELETE FROM employers WHERE user_id = $1", [req.user.id]);
    req.session.message = {
      type: "success",
      text: "All employers deleted successfully!",
    };
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Error deleting all employers:", err);
    req.session.message = {
      type: "error",
      text: "Failed to delete employers.",
    };
    res.redirect("/dashboard");
  }
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
