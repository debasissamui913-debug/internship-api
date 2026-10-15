const express = require("express");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const MODES = ["Remote", "Hybrid", "On-site"];

app.use(express.json());


function toInternship(row) {
  return { ...row, skills: JSON.parse(row.skills) };
}

function sendError(res, status, code, message, details) {
  const error = { code, message };
  if (details) error.details = details;
  res.status(status).json({ success: false, error });
}

function validate(body) {
  const errors = [];
  const isText = (v, min, max) => typeof v === "string" && v.trim().length >= min && v.trim().length <= max;

  if (!isText(body.title, 3, 100)) errors.push("title must be text between 3 and 100 characters");
  if (!isText(body.domain, 2, 60)) errors.push("domain must be text between 2 and 60 characters");
  if (!MODES.includes(body.mode)) errors.push("mode must be one of: " + MODES.join(", "));
  if (!isText(body.location, 2, 60)) errors.push("location must be text between 2 and 60 characters");

  const skillsOk = Array.isArray(body.skills) && body.skills.length > 0 &&
    body.skills.every(s => isText(s, 1, 40));
  if (!skillsOk) errors.push("skills must be a non-empty array of text values");

  if (!Number.isInteger(body.openings) || body.openings < 0) {
    errors.push("openings must be a whole number, 0 or more");
  }
  return errors;
}


function cleanBody(body) {
  return {
    title: String(body.title).trim(),
    domain: String(body.domain).trim(),
    mode: body.mode,
    location: String(body.location).trim(),
    skills: JSON.stringify(body.skills.map(s => s.trim())),
    openings: body.openings
  };
}


function nextId() {
  const row = db.prepare("SELECT MAX(CAST(SUBSTR(id, 5) AS INTEGER)) AS maxNum FROM internships").get();
  return "INT-" + ((row.maxNum || 100) + 1);
}



app.get("/", (req, res) => {
  res.json({ success: true, data: { message: "Internship API is running. Try GET /api/internships" } });
});


app.get("/api/internships", (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 10);

  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 50) {
    return sendError(res, 400, "INVALID_QUERY", "page must be 1 or more and limit must be between 1 and 50");
  }
  if (req.query.mode && !MODES.includes(req.query.mode)) {
    return sendError(res, 400, "INVALID_QUERY", "mode must be one of: " + MODES.join(", "));
  }

  const conditions = [];
  const params = [];
  if (req.query.domain) { conditions.push("domain = ?"); params.push(req.query.domain); }
  if (req.query.mode) { conditions.push("mode = ?"); params.push(req.query.mode); }
  if (req.query.q) { conditions.push("title LIKE ?"); params.push("%" + req.query.q + "%"); }
  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  const total = db.prepare(`SELECT COUNT(*) AS count FROM internships ${where}`).get(...params).count;
  const rows = db.prepare(`SELECT * FROM internships ${where} ORDER BY id LIMIT ? OFFSET ?`)
    .all(...params, limit, (page - 1) * limit);

  res.json({
    success: true,
    data: rows.map(toInternship),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
});

app.get("/api/internships/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM internships WHERE id = ?").get(req.params.id);
  if (!row) return sendError(res, 404, "NOT_FOUND", "Internship " + req.params.id + " was not found");
  res.json({ success: true, data: toInternship(row) });
});


app.post("/api/internships", (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return sendError(res, 400, "VALIDATION_ERROR", "Invalid internship data", errors);

  const id = nextId();
  db.prepare(`INSERT INTO internships (id, title, domain, mode, location, skills, openings)
              VALUES (@id, @title, @domain, @mode, @location, @skills, @openings)`)
    .run({ id, ...cleanBody(req.body) });

  const row = db.prepare("SELECT * FROM internships WHERE id = ?").get(id);
  res.status(201).json({ success: true, data: toInternship(row) });
});


app.put("/api/internships/:id", (req, res) => {
  const exists = db.prepare("SELECT id FROM internships WHERE id = ?").get(req.params.id);
  if (!exists) return sendError(res, 404, "NOT_FOUND", "Internship " + req.params.id + " was not found");

  const errors = validate(req.body);
  if (errors.length) return sendError(res, 400, "VALIDATION_ERROR", "Invalid internship data", errors);

  db.prepare(`UPDATE internships
              SET title=@title, domain=@domain, mode=@mode, location=@location,
                  skills=@skills, openings=@openings, updated_at=datetime('now')
              WHERE id=@id`)
    .run({ id: req.params.id, ...cleanBody(req.body) });

  const row = db.prepare("SELECT * FROM internships WHERE id = ?").get(req.params.id);
  res.json({ success: true, data: toInternship(row) });
});


app.delete("/api/internships/:id", (req, res) => {
  const result = db.prepare("DELETE FROM internships WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return sendError(res, 404, "NOT_FOUND", "Internship " + req.params.id + " was not found");
  res.json({ success: true, data: { message: "Internship " + req.params.id + " deleted" } });
});




app.use((req, res) => sendError(res, 404, "NOT_FOUND", "Route " + req.method + " " + req.path + " does not exist"));


app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return sendError(res, 400, "INVALID_JSON", "Request body is not valid JSON");
  }
  console.error(err);
  sendError(res, 500, "SERVER_ERROR", "Something went wrong on the server");
});

app.listen(PORT, () => console.log("API running at http://localhost:" + PORT));
