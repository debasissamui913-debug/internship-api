 
const { DatabaseSync } = require("node:sqlite");
const fs = require("fs");
const path = require("path");


const db = new DatabaseSync(path.join(__dirname, "data", "internships.db"));


db.exec(fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8"));

module.exports = db;
