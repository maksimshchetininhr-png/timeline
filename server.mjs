import express from "express";
import {
  resolveCoordinates,
  normalizeCountry,
  normalizeCity,
} from "./src/places.mjs";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  randomUUID,
} from "node:crypto";
const root = dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || resolve(root, ".local");
mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(resolve(dataDir, "memories.sqlite"));
db.exec(
  "CREATE TABLE IF NOT EXISTS memories (id TEXT PRIMARY KEY, payload TEXT NOT NULL)",
);
// Personal records stay in private server storage, never in the public repository.
const timelineDataFile =
  process.env.TIMELINE_DATA_FILE || resolve(dataDir, "timeline.json");
const imported = existsSync(timelineDataFile)
  ? JSON.parse(readFileSync(timelineDataFile, "utf8"))
  : {
      events: [],
      context: [],
      sources: [],
      people: [
        { id: "maksim", name: "Maksim" },
        { id: "nadya", name: "Nadya" },
      ],
    };
const app = express();
if (process.env.TRUST_PROXY === "true") app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(express.json({ limit: "64kb" }));
db.exec(
  "CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
);
const sessions = new Map();
const attempts = new Map();
const stored = db
  .prepare("SELECT value FROM settings WHERE key=?")
  .get("family_password");
let salt = stored
  ? JSON.parse(stored.value).salt
  : randomBytes(32).toString("hex");
let passwordHash = process.env.FAMILY_PASSWORD
  ? scryptSync(process.env.FAMILY_PASSWORD, salt, 64)
  : stored
    ? Buffer.from(JSON.parse(stored.value).hash, "hex")
    : null;
function createSession(req, res) {
  const token = randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + 7 * 86400000);
  res.cookie("family_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.SECURE_COOKIES === "true" || req.secure,
    maxAge: 7 * 86400000,
  });
}
function sameOrigin(req) {
  if (!req.headers.origin) return true;
  try {
    const origin = new URL(req.headers.origin);
    // HTTPS may terminate at the hosting proxy while Express receives HTTP.
    return (
      ["http:", "https:"].includes(origin.protocol) &&
      (origin.host === req.get("host") ||
        (process.env.NODE_ENV !== "production" &&
          /^http:\/\/(localhost|127\.0\.0\.1):5173$/.test(origin.origin)))
    );
  } catch {
    return false;
  }
}
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "same-origin");
  res.set("X-Frame-Options", "DENY");
  next();
});
function authenticated(req) {
  const token = (req.headers.cookie || "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("family_session="))
    ?.split("=")[1];
  return !!passwordHash && sessions.get(token) > Date.now();
}
app.get("/api/session", (req, res) =>
  res.set("Cache-Control", "no-store").json({
    authenticated: authenticated(req),
    protected: true,
    needsSetup: !passwordHash,
  }),
);
app.post("/api/setup", (req, res) => {
  if (!sameOrigin(req))
    return res.status(403).json({ error: "Request origin does not match." });
  if (passwordHash)
    return res
      .status(409)
      .json({ error: "The family password is already set. Please sign in." });
  const p = req.body.password;
  if (typeof p !== "string" || p.length < 12 || p.length > 1024)
    return res
      .status(400)
      .json({ error: "Choose a family password with at least 12 characters." });
  passwordHash = scryptSync(p, salt, 64);
  db.prepare("INSERT OR REPLACE INTO settings (key,value) VALUES (?,?)").run(
    "family_password",
    JSON.stringify({ salt, hash: passwordHash.toString("hex") }),
  );
  createSession(req, res);
  res.status(201).json({ ok: true });
});
app.post("/api/login", (req, res) => {
  if (!sameOrigin(req))
    return res.status(403).json({ error: "Request origin does not match." });
  const key = req.ip;
  const attempt = attempts.get(key);
  if (attempt?.count >= 10 && attempt.until > Date.now())
    return res
      .status(429)
      .json({ error: "Too many attempts. Please try again in 15 minutes." });
  if (!passwordHash)
    return res.status(403).json({
      error: "The journal owner needs to set the family password first.",
    });
  const supplied =
    typeof req.body.password === "string" && req.body.password.length <= 1024
      ? req.body.password
      : "";
  if (!timingSafeEqual(scryptSync(supplied, salt, 64), passwordHash)) {
    attempts.set(key, {
      count: (attempt?.until > Date.now() ? attempt.count : 0) + 1,
      until: Date.now() + 900000,
    });
    return res
      .status(401)
      .json({ error: "That password doesn’t match. Please try again." });
  }
  attempts.delete(key);
  createSession(req, res);
  res.json({ ok: true });
});
app.use("/api", (req, res, next) => {
  if (!authenticated(req))
    return res.status(401).json({ error: "Please enter the family password." });
  if (req.method !== "GET" && !sameOrigin(req))
    return res.status(403).json({ error: "Request origin does not match." });
  res.set("Cache-Control", "no-store");
  next();
});
app.post("/api/logout", (req, res) => {
  const token = (req.headers.cookie || "")
    .split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("family_session="))
    ?.split("=")[1];
  sessions.delete(token);
  res.clearCookie("family_session");
  res.json({ ok: true });
});
app.get("/api/timeline", (req, res) =>
  res.json({
    ...imported,
    events: [
      ...imported.events,
      ...db
        .prepare("SELECT payload FROM memories ORDER BY rowid")
        .all()
        .map((r) => JSON.parse(r.payload)),
    ],
  }),
);
const validDate = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;
app.post("/api/memories", (req, res) => {
  const e = req.body;
  if (!e || typeof e !== "object")
    return res.status(400).json({ error: "Please supply a memory." });
  if (
    typeof e.title !== "string" ||
    !e.title.trim() ||
    e.title.length > 180 ||
    !validDate(e.start) ||
    (e.end && !validDate(e.end)) ||
    (e.end && e.end < e.start) ||
    !["maksim", "nadya", "both", "family"].includes(e.person) ||
    ![
      "Together",
      "Travel",
      "Home",
      "Family",
      "Career",
      "Education",
      "Life",
      "Milestones",
      "World",
    ].includes(e.category) ||
    !["Exact", "Month only", "Year only", "Approximate"].includes(
      e.certainty,
    ) ||
    typeof e.notes !== "string" ||
    e.notes.length > 3000
  )
    return res
      .status(400)
      .json({ error: "Please check the title, dates, person, and category." });
  let place = null;
  if (e.place) {
    const p = e.place;
    if (
      typeof p.country !== "string" ||
      !p.country.trim() ||
      p.country.length > 80 ||
      (p.city !== undefined && p.city !== null && typeof p.city !== "string") ||
      (p.city?.length || 0) > 100
    )
      return res
        .status(400)
        .json({ error: "Please enter a country for this location." });
    place = {
      city: normalizeCity(p.city) || null,
      country: normalizeCountry(p.country),
      label: [normalizeCity(p.city), normalizeCountry(p.country)]
        .filter(Boolean)
        .join(", "),
      ...resolveCoordinates(normalizeCity(p.city), normalizeCountry(p.country)),
      precision: p.city ? "city" : "country",
      inferred: false,
    };
  }
  const event = {
    id: randomUUID(),
    title: e.title.trim(),
    start: e.start,
    end: e.end || null,
    person: e.person,
    category: e.category,
    certainty: e.certainty,
    notes: e.notes,
    place,
    residence: e.category === "Home",
    trip: e.category === "Travel",
    source: "Family memory",
    featured: e.category === "Together",
  };
  db.prepare("INSERT INTO memories (id,payload) VALUES (?,?)").run(
    event.id,
    JSON.stringify(event),
  );
  res.status(201).json(event);
});
app.delete("/api/memories/:id", (req, res) => {
  const r = db.prepare("DELETE FROM memories WHERE id=?").run(req.params.id);
  return r.changes
    ? res.json({ ok: true })
    : res
        .status(404)
        .json({ error: "Only added family memories can be removed." });
});
if (existsSync(resolve(root, "dist/index.html"))) {
  app.use(express.static(resolve(root, "dist")));
  app.get("/{*path}", (req, res) =>
    res.sendFile(resolve(root, "dist/index.html")),
  );
}
app.use((err, req, res, next) => {
  console.error(err.message);
  res
    .status(err.status || 500)
    .json({ error: "Something went wrong. Please try again." });
});
const port = Number(process.env.PORT || 3001);
app.listen(port, process.env.HOST || "0.0.0.0", () =>
  console.log(
    `Timeline server listening on port ${port}. Family password ${passwordHash ? "enabled" : "awaiting owner setup; timeline data remains private"}.`,
  ),
);
