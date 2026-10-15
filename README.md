# Internship API

A REST API for internship records, built for Task 02 of the EdVyro Full-Stack Development Internship (REST API and Persistent Data). It uses Node.js, Express and SQLite, so the data stays saved even after the server restarts.

## Features

- List, detail, create, update and delete endpoints
- Validation for all inputs, with clear error messages
- Pagination (`page`, `limit`) and simple filters (`domain`, `mode`, `q`)
- SQLite database with a schema file and seed data
- Same response format and proper status codes everywhere

## Built with

Node.js, Express, SQLite (the `node:sqlite` module that comes with Node.js)

## Setup

You need Node.js 22.13 or newer (the SQLite module is built in, so only Express gets installed).

```bash
npm install
npm run seed
npm start
```

The API runs at `http://localhost:3000`. The database file (`data/internships.db`) is created automatically. `npm run seed` adds the 5 sample records, and running it again will not create duplicates.

## Folder structure

```
internship-api/
├── server.js                  routes, validation, error handling
├── db.js                      database connection
├── seed.js                    adds sample data
├── schema.sql                 table structure
├── data/internships-seed.json sample records
├── package.json
└── README.md
```

## Data model (schema)

| Field | Type | Rules |
|---|---|---|
| id | text | Made by the server, like `INT-106` |
| title | text | 3 to 100 characters |
| domain | text | 2 to 60 characters |
| mode | text | `Remote`, `Hybrid` or `On-site` |
| location | text | 2 to 60 characters |
| skills | array of text | At least 1 skill |
| openings | integer | 0 or more |
| created_at, updated_at | text | Set by the database |

The full table is in `schema.sql`.

## Endpoints

| Method | URL | What it does | Success code |
|---|---|---|---|
| GET | `/api/internships` | List internships (paginated) | 200 |
| GET | `/api/internships/:id` | Get one internship | 200 |
| POST | `/api/internships` | Create an internship | 201 |
| PUT | `/api/internships/:id` | Update an internship (send all fields) | 200 |
| DELETE | `/api/internships/:id` | Delete an internship | 200 |

### Query options for the list

- `page` (default 1) and `limit` (default 10, max 50)
- `domain`: exact match, for example `domain=UI/UX`
- `mode`: `Remote`, `Hybrid` or `On-site`
- `q`: search in the title

## Response format

Success:

```json
{ "success": true, "data": { }, "meta": { } }
```

`meta` is only added for the list (page, limit, total, totalPages).

Error:

```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Invalid internship data", "details": ["..."] } }
```

| Status | Code | When |
|---|---|---|
| 400 | VALIDATION_ERROR | Body has wrong or missing fields |
| 400 | INVALID_QUERY | Bad `page`, `limit` or `mode` in the URL |
| 400 | INVALID_JSON | Body is not valid JSON |
| 404 | NOT_FOUND | Internship or route does not exist |
| 500 | SERVER_ERROR | Unexpected problem on the server |

## API examples (curl)

On Windows, use Git Bash or write the commands in one line.

List, page 1 with 2 items:

```bash
curl "http://localhost:3000/api/internships?page=1&limit=2"
```

Filter by mode:

```bash
curl "http://localhost:3000/api/internships?mode=Remote"
```

Get one:

```bash
curl http://localhost:3000/api/internships/INT-102
```

Create:

```bash
curl -X POST http://localhost:3000/api/internships \
  -H "Content-Type: application/json" \
  -d '{"title":"Backend Intern","domain":"Full Stack Development","mode":"Remote","location":"Kolkata","skills":["Node.js","SQL"],"openings":2}'
```

Update:

```bash
curl -X PUT http://localhost:3000/api/internships/INT-106 \
  -H "Content-Type: application/json" \
  -d '{"title":"Backend Intern II","domain":"Full Stack Development","mode":"Hybrid","location":"Kolkata","skills":["Node.js"],"openings":4}'
```

Delete:

```bash
curl -X DELETE http://localhost:3000/api/internships/INT-106
```

Example of a validation error (response code 400):

```bash
curl -X POST http://localhost:3000/api/internships \
  -H "Content-Type: application/json" \
  -d '{"title":"a","mode":"x","skills":[],"openings":-1}'
```

## Author

Debasis Samui
- GitHub: https://github.com/debasissamui913-debug
- Email: debasissamui913@gmail.com
