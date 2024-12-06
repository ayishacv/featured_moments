const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static("public"));

// Configure file upload
const storage = multer.diskStorage({
    destination: "./uploads",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

// SQLite Database Setup
const db = new sqlite3.Database("./moments.db");
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS moments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      category TEXT,
      status TEXT,
      imagePath TEXT
    )
  `);
});

// Routes
// 1. Add a new moment
app.post("/add-moment", upload.single("image"), (req, res) => {
    const { title, description, category, status } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    db.run(
        `INSERT INTO moments (title, description, category, status, imagePath) VALUES (?, ?, ?, ?, ?)`,
        [title, description, category, status, imagePath],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: "Moment added successfully!", id: this.lastID });
        }
    );
});
app.delete("/moments/:id", (req, res) => {
    const { id } = req.params;

    db.run("DELETE FROM moments WHERE id = ?", [id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: "Moment not found" });
        }

        res.json({ message: "Moment deleted successfully!" });
    });
});


// 2. Get all moments
app.get("/moments", (req, res) => {
    db.all("SELECT * FROM moments", (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});


