-- skills is stored as a JSON text, for example '["Node.js","SQL"]'
CREATE TABLE IF NOT EXISTS internships (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  domain     TEXT NOT NULL,
  mode       TEXT NOT NULL CHECK (mode IN ('Remote', 'Hybrid', 'On-site')),
  location   TEXT NOT NULL,
  skills     TEXT NOT NULL,
  openings   INTEGER NOT NULL CHECK (openings >= 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
