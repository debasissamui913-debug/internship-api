
const fs = require("fs");
const path = require("path");
const db = require("./db");

const file = path.join(__dirname, "data", "internships-seed.json");
const { internships } = JSON.parse(fs.readFileSync(file, "utf8"));

const insert = db.prepare(`
  INSERT OR IGNORE INTO internships (id, title, domain, mode, location, skills, openings)
  VALUES (@id, @title, @domain, @mode, @location, @skills, @openings)
`);

let added = 0;
for (const item of internships) {
  const result = insert.run({ ...item, skills: JSON.stringify(item.skills) });
  added += result.changes;
}

console.log(`Seed finished. ${added} new record(s) added.`);
