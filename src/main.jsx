import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Heart,
  Plus,
  ArrowUpRight,
  ArrowRight,
  Search,
  MapPin,
  Globe2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  BookOpen,
  Plane,
  Home,
  Sparkles,
  GraduationCap,
  BriefcaseBusiness,
  Users,
  SlidersHorizontal,
  LockKeyhole,
  AlertCircle,
  Trash2,
  Compass,
  Link,
  LogOut,
  Flag,
} from "lucide-react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import world from "world-atlas/countries-110m.json";
import {
  locationAt,
  comparison,
  formatDate,
  isApproximate,
  filterEvents,
  people,
} from "./lib.mjs";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/playfair-display/latin-400.css";
import "@fontsource/playfair-display/latin-400-italic.css";
import "./styles.css";
const countries = feature(world, world.objects.countries);
const icons = {
  Together: Heart,
  Travel: Plane,
  Home: Home,
  Family: Users,
  Career: BriefcaseBusiness,
  Education: GraduationCap,
  Life: Sparkles,
  Milestones: Flag,
  World: Globe2,
};
const categories = [
  "All moments",
  "Together",
  "Travel",
  "Home",
  "Family",
  "Career",
  "Education",
  "Life",
  "Milestones",
  "World",
];
const iso = () => new Date().toISOString().slice(0, 10);
function initialDate() {
  const d = new URLSearchParams(location.search).get("date");
  return d &&
    /^\d{4}-\d{2}-\d{2}$/.test(d) &&
    !Number.isNaN(Date.parse(d)) &&
    new Date(d).toISOString().slice(0, 10) === d
    ? d
    : "2024-01-01";
}
async function api(path, options) {
  const r = await fetch("/api/" + path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Could not complete that request.");
  return data;
}
function Mark({ small = false }) {
  return (
    <span className={"brand-mark " + (small ? "small" : "")}>
      <Heart size={small ? 18 : 25} strokeWidth={1.5} />
      <span />
    </span>
  );
}
function Avatar({ person, size = "" }) {
  return (
    <span className={`avatar ${person} ${size}`}>
      {person === "nadya" ? (
        "N"
      ) : person === "both" ? (
        <Heart size={14} />
      ) : person === "family" ? (
        <Users size={14} />
      ) : (
        "M"
      )}
    </span>
  );
}
function Modal({ title, children, onClose, wide = false }) {
  const close = useRef(null);
  const box = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    close.current?.focus();
    const f = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const els = box.current.querySelectorAll(
          'button,input,select,textarea,[tabindex="0"]',
        );
        const first = els[0],
          last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", f);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", f);
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal ${wide ? "wide" : ""}`}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button
            ref={close}
            aria-label="Close dialog"
            className="icon-button"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function WorldMap({ points = [], selected = false, onSelect }) {
  const projection = useMemo(
    () =>
      geoNaturalEarth1().fitExtent(
        [
          [12, 10],
          [888, 425],
        ],
        { type: "Sphere" },
      ),
    [],
  );
  const path = geoPath(projection);
  return (
    <svg
      className="world-map"
      viewBox="0 0 900 440"
      role="img"
      aria-label="World map showing recorded locations"
    >
      <defs>
        <pattern id="dots" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r=".65" fill="#c8c9bd" opacity=".5" />
        </pattern>
      </defs>
      <rect width="900" height="440" fill="url(#dots)" />
      <g>
        {countries.features.map((f, i) => (
          <path
            key={i}
            d={path(f)}
            fill="#dcded3"
            stroke="#f8f8f1"
            strokeWidth=".6"
          />
        ))}
      </g>
      {points
        .filter((p) => p.coordinates)
        .map((p, i) => {
          const [x, y] = projection(p.coordinates);
          return (
            <g
              key={`${p.label}-${i}`}
              transform={`translate(${x},${y})`}
              className={onSelect ? "map-point clickable" : "map-point"}
              tabIndex={onSelect ? 0 : undefined}
              role={onSelect ? "button" : undefined}
              aria-label={onSelect ? `Show ${p.label}` : undefined}
              onClick={() => onSelect?.(p)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect?.(p);
                }
              }}
            >
              <title>{p.label}</title>
              <circle
                r={selected ? 15 : 9}
                fill={p.person === "nadya" ? "#66847c" : "#b45f40"}
                opacity=".13"
              />
              <circle
                r={selected ? 6 : 3.8}
                fill={p.person === "nadya" ? "#66847c" : "#b45f40"}
                stroke="#fff"
                strokeWidth="1.5"
              />
              {selected && (
                <text y="-21" textAnchor="middle" fontSize="12" fill="#504b40">
                  {p.city || p.country}
                </text>
              )}
            </g>
          );
        })}
    </svg>
  );
}
function AddMemory({
  onClose,
  onAdded,
  defaultPerson = "both",
  defaultDate = "",
  defaultCategory = "Together",
}) {
  const [form, setForm] = useState({
    title: "",
    start: defaultDate,
    end: "",
    person: defaultPerson,
    category: defaultCategory,
    city: "",
    country: "",
    certainty: "Exact",
    notes: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = await api("memories", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          place:
            form.city || form.country
              ? { city: form.city, country: form.country }
              : null,
        }),
      });
      onAdded(saved);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <Modal title="Every moment has a place here." onClose={onClose} wide>
      <p className="muted">
        A small memory today. Part of your family story forever.
      </p>
      <form onSubmit={submit} className="memory-form">
        <label className="full">
          What happened?
          <input
            autoComplete="off"
            name="title"
            placeholder="A new home, a first adventure, a little milestone…"
            maxLength={180}
            value={form.title}
            onChange={update}
            required
          />
        </label>
        <label>
          Whose moment?
          <select name="person" value={form.person} onChange={update}>
            {Object.entries(people).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Chapter
          <select name="category" value={form.category} onChange={update}>
            {categories.slice(1).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Start date
          <input
            type="date"
            name="start"
            value={form.start}
            onChange={update}
            required
          />
        </label>
        <label>
          End date <span className="optional">optional</span>
          <input
            type="date"
            name="end"
            value={form.end}
            min={form.start}
            onChange={update}
          />
        </label>
        <label>
          City <span className="optional">optional</span>
          <input
            name="city"
            placeholder="e.g. Haarlem"
            value={form.city}
            onChange={update}
            maxLength={100}
          />
        </label>
        <label>
          Country
          <input
            name="country"
            placeholder="e.g. Netherlands"
            value={form.country}
            onChange={update}
            required={!!form.city}
            maxLength={80}
          />
        </label>
        <label className="full">
          How precise is the date?
          <select name="certainty" value={form.certainty} onChange={update}>
            {["Exact", "Month only", "Year only", "Approximate"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="full">
          The story <span className="optional">optional</span>
          <textarea
            name="notes"
            placeholder="The things you want to remember…"
            rows="3"
            maxLength={3000}
            value={form.notes}
            onChange={update}
          />
        </label>
        {form.category === "Home" && (
          <p className="form-note full">
            A home is treated as the recorded residence from its start date
            until the next home, or the end date if you add one. Trips take
            priority during their dates.
          </p>
        )}
        {error && (
          <p role="alert" className="error full">
            {error}
          </p>
        )}
        <div className="form-footer full">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={saving}>
            <Plus size={16} />
            {saving ? "Saving…" : "Save memory"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
function EventDetail({ event: e, onClose, onDelete }) {
  const Icon = icons[e.category] || Sparkles;
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  return (
    <Modal title={e.title} onClose={onClose}>
      <div className="detail-category">
        <Icon size={17} />
        {e.category}
        <span className="badge">{people[e.person]}</span>
      </div>
      <p className="detail-date">
        {formatDate(e.start, e.certainty)}
        {e.end && e.end !== e.start
          ? " — " + formatDate(e.end, e.certainty)
          : ""}
      </p>
      {isApproximate(e) && (
        <p className="precision-note">
          <AlertCircle size={15} />
          {e.certainty} · The source does not give an exact day.
        </p>
      )}
      {e.place && (
        <p className="detail-location">
          <MapPin size={18} />
          {e.place.label}
        </p>
      )}
      {e.place?.route && (
        <p className="form-note">
          Recorded route: {e.place.route}. Individual city dates are not
          available.
        </p>
      )}
      {e.notes && <p className="detail-notes">{e.notes}</p>}
      <p className="source">
        <BookOpen size={14} />
        {e.source}
      </p>
      {e.source === "Family memory" && (
        <div className="delete-area">
          {confirm ? (
            <>
              <p>Remove this added memory?</p>
              <button
                className="button danger"
                onClick={async () => {
                  try {
                    await api("memories/" + e.id, { method: "DELETE" });
                    onDelete(e.id);
                    onClose();
                  } catch (err) {
                    setError(err.message);
                  }
                }}
              >
                Yes, remove it
              </button>
              <button className="text-button" onClick={() => setConfirm(false)}>
                Keep memory
              </button>
            </>
          ) : (
            <button className="text-button" onClick={() => setConfirm(true)}>
              <Trash2 size={14} />
              Remove memory
            </button>
          )}
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
function LocationCard({ person, result, onAdd, onEvent }) {
  return (
    <article className={`location-card ${person}`}>
      <div className="location-person">
        <Avatar person={person} />
        <span>{people[person]}</span>
        <span className="record-kind">
          {result.kind === "trip"
            ? "On a trip"
            : result.kind === "home"
              ? "Recorded home"
              : result.kind === "country"
                ? "Country record"
                : result.kind === "ambiguous"
                  ? "Multiple records"
                  : "Missing chapter"}
        </span>
      </div>
      {result.place ? (
        <>
          <h3>
            {result.place.city || result.place.country || result.place.label}
          </h3>
          <p>
            <MapPin size={14} />
            {result.place.country}
            {result.place.precision === "country" ? " · City not recorded" : ""}
          </p>
          <div className="location-foot">
            <span className="status-dot" />
            {result.kind === "home"
              ? "Home, unless travelling"
              : "Recorded visit"}
            <button
              className="text-button"
              onClick={() => onEvent(result.events[0])}
            >
              View record <ArrowUpRight size={13} />
            </button>
          </div>
          {result.kind === "home" && (
            <small>
              Last recorded residence; does not prove physical presence.
            </small>
          )}
          {result.place.route && (
            <small>Route recorded; exact city on this day is unknown.</small>
          )}
          {(result.place.inferred || result.certainty !== "Exact") && (
            <small>
              {result.place.inferred
                ? "City inferred from housing sequence. "
                : ""}
              Date precision: {result.certainty}.
            </small>
          )}
        </>
      ) : result.kind === "ambiguous" ? (
        <>
          <h3>More than one place</h3>
          <p>The records overlap on this date.</p>
          <div className="candidate-list">
            {result.events.map((e) => (
              <button
                key={e.id}
                className="text-button"
                onClick={() => onEvent(e)}
              >
                {e.place.label} <ArrowUpRight size={12} />
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <h3>A page yet to be written</h3>
          <p>No location recorded for this date.</p>
          <button
            className="text-button add-location"
            onClick={() => onAdd(person)}
          >
            Add {people[person]}’s location <Plus size={14} />
          </button>
        </>
      )}
    </article>
  );
}
function Compare({ events, context = [], onAdd, onEvent, compact = false }) {
  const [date, setDate] = useState(initialDate);
  const a = locationAt(events, "maksim", date),
    b = locationAt(events, "nadya", date);
  const relation = comparison(a, b);
  const chapters = context.filter(
    (c) =>
      ["Career", "Education"].includes(c.category) &&
      c.start <= date &&
      (!c.end || c.end > date) &&
      !/^not |^before |^—/i.test(c.value),
  );
  const min =
      events
        .filter((e) => e.residence)
        .map((e) => e.start)
        .sort()[0] || "1990-01-01",
    max = iso();
  const start = Date.parse(min),
    end = Date.parse(max);
  function changeDate(d) {
    if (!d) return;
    setDate(d);
    const url = new URL(location.href);
    url.searchParams.set("date", d);
    history.replaceState(null, "", url);
  }
  function step(direction) {
    const d = new Date(date + "T12:00:00Z");
    d.setUTCMonth(d.getUTCMonth() + direction);
    changeDate(d.toISOString().slice(0, 10));
  }
  return (
    <section
      className={`compare-section ${compact ? "compact" : ""}`}
      id="compare"
    >
      <div className="section-title">
        <div>
          <div className="eyebrow">
            <span /> A MOMENT IN TWO LIVES
          </div>
          <h2>Where were we?</h2>
          <p className="muted">
            Pick a date. See where each of our stories was unfolding.
          </p>
        </div>
        <div className="date-control">
          <button
            className="icon-button"
            aria-label="Previous month"
            onClick={() => step(-1)}
          >
            <ChevronLeft size={17} />
          </button>
          <CalendarDays size={17} />
          <input
            aria-label="Comparison date"
            type="date"
            value={date}
            onChange={(e) => changeDate(e.target.value)}
          />
          <button
            className="icon-button"
            aria-label="Next month"
            onClick={() => step(1)}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
      <div className="comparison-grid">
        <LocationCard
          person="maksim"
          result={a}
          onAdd={(person) => onAdd({ person, date, category: "Home" })}
          onEvent={onEvent}
        />
        <div className="comparison-connector">
          <Heart size={18} strokeWidth={1.5} />
          <span />
        </div>
        <LocationCard
          person="nadya"
          result={b}
          onAdd={(person) => onAdd({ person, date, category: "Home" })}
          onEvent={onEvent}
        />
      </div>
      <div className="date-scrubber">
        <input
          aria-label="Travel through time"
          type="range"
          min={start}
          max={end}
          step={86400000}
          value={Math.max(start, Math.min(end, Date.parse(date)))}
          onChange={(e) =>
            changeDate(
              new Date(Number(e.target.value)).toISOString().slice(0, 10),
            )
          }
        />
        <div>
          <span>1990</span>
          <span>2000</span>
          <span>2010</span>
          <span>2020</span>
          <span>{max.slice(0, 4)}</span>
        </div>
      </div>
      <div className="comparison-summary">
        <span className="small-heart">
          <Heart size={15} />
        </span>
        <div>
          <strong>{relation.label}</strong>
          <p>{relation.detail}</p>
        </div>
      </div>
      {!compact && (
        <div className="compare-map">
          <WorldMap
            points={[
              a.place && { ...a.place, person: "maksim" },
              b.place && { ...b.place, person: "nadya" },
            ].filter(Boolean)}
            selected
          />
          <div className="map-legend">
            <span>
              <i className="maksim-dot" />
              Maksim
            </span>
            <span>
              <i className="nadya-dot" />
              Nadya
            </span>
            <span>Markers show city or country centers</span>
          </div>
        </div>
      )}
      {chapters.length > 0 && (
        <div className="context-section">
          <div className="eyebrow">AROUND THIS TIME · MAKSIM’S CHAPTER</div>
          <div className="context-grid">
            {chapters.map((c) => (
              <article key={c.category}>
                <span>{c.category}</span>
                <p>{c.value}</p>
              </article>
            ))}
          </div>
          <small>
            From the timeline matrix · date ranges follow the recorded change
            points.
          </small>
        </div>
      )}
    </section>
  );
}
function Story({ events, onEvent, onCompare }) {
  const [category, setCategory] = useState("All moments"),
    [search, setSearch] = useState(""),
    [person, setPerson] = useState("everyone"),
    [era, setEra] = useState(
      events.some((e) => e.person === "both") ? "together" : "all",
    ),
    [year, setYear] = useState("all"),
    [limit, setLimit] = useState(12);
  const results = useMemo(
    () =>
      filterEvents(events, { category, search, person, era })
        .filter((e) => year === "all" || e.start.slice(0, 4) === year)
        .sort((a, b) => a.start.localeCompare(b.start)),
    [events, category, search, person, era, year],
  );
  useEffect(() => setLimit(12), [category, search, person, era, year]);
  const travelCountries = new Set(
    events
      .filter((e) => e.trip)
      .map((e) => e.place?.country)
      .filter(Boolean),
  );
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span /> MAKSIM & NADYA · A FAMILY JOURNAL
          </div>
          <h1>
            Two lives.
            <br />
            One unfolding <em>story.</em>
          </h1>
          <p>
            All the places we’ve been. The moments that made us.
            <br className="desktop" /> A little collection of our lives, for the
            people we love.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#story">
              Explore our timeline <ArrowRight size={16} />
            </a>
            <button className="text-button" onClick={onCompare}>
              <MapPin size={16} />
              Where were we?
            </button>
          </div>
          <div className="hero-signature">
            <div className="avatar-stack">
              <Avatar person="maksim" />
              <Avatar person="nadya" />
            </div>
            <span>Different beginnings. A shared adventure.</span>
          </div>
        </div>
        <div className="hero-art">
          <div className="art-backdrop" />
          <div className="postcard">
            <div className="postcard-photo">
              <img
                src="/canal.svg"
                alt="Illustration of Dutch canal houses, a bicycle and a boat"
              />
              <span className="postcard-label">
                <MapPin size={12} /> THE NETHERLANDS
              </span>
            </div>
            <div className="postcard-caption">
              <span>Our Dutch chapter</span>
              <Heart size={19} strokeWidth={1.3} />
            </div>
            <span className="caption-small">
              A new place to call home. A new chapter to write.
            </span>
          </div>
          <div className="stamp">
            <Globe2 size={24} strokeWidth={1} />
            <span>
              COLLECTING
              <br />
              LITTLE MOMENTS
            </span>
          </div>
          <div className="art-note">
            the best part?
            <br />
            <span>doing life together.</span>
            <svg viewBox="0 0 100 50">
              <path
                d="M5 10Q40 55 89 13m-13 0h15l-3 14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
            </svg>
          </div>
        </div>
      </section>
      <div className="stats-strip">
        <div>
          <BookOpen size={21} />
          <strong>{events.length}</strong>
          <span>moments to remember</span>
        </div>
        <div>
          <Globe2 size={21} />
          <strong>{travelCountries.size}</strong>
          <span>countries in the story</span>
        </div>
        <div>
          <Heart size={21} />
          <strong>
            {events
              .filter((e) => e.person === "both")
              .map((e) => e.start)
              .sort()[0]
              ?.slice(0, 4) || "—"}
          </strong>
          <span>when our paths crossed</span>
        </div>
        <div className="stats-note">
          <Sparkles size={17} />
          <span>
            And so much more
            <br />
            still to come.
          </span>
        </div>
      </div>
      <section className="story-section" id="story">
        <div className="section-title">
          <div>
            <div className="eyebrow">
              <span /> ONE MOMENT AT A TIME
            </div>
            <h2>Our story, through the years.</h2>
            <p className="muted">
              The big milestones. The little things. Everything in between.
            </p>
          </div>
          <span className="outline-badge">
            <BookOpen size={13} />
            From our family archive
          </span>
        </div>
        <div className="timeline-controls">
          <div className="category-tabs">
            {categories.slice(0, 6).map((c) => {
              const Icon = icons[c];
              return (
                <button
                  key={c}
                  className={category === c ? "selected" : ""}
                  onClick={() => setCategory(c)}
                >
                  {Icon && <Icon size={14} />} {c}
                </button>
              );
            })}
            <select
              aria-label="More categories"
              value={categories.slice(6).includes(category) ? category : ""}
              onChange={(e) => setCategory(e.target.value || "All moments")}
            >
              <option value="">More…</option>
              {categories.slice(6).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="filter-row">
            <div className="search-field">
              <Search size={16} />
              <input
                aria-label="Search memories"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a moment, a place, a chapter…"
              />
              {search && (
                <button
                  className="icon-button"
                  aria-label="Clear search"
                  onClick={() => setSearch("")}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="select-field">
              <Users size={14} />
              <select
                aria-label="Filter by person"
                value={person}
                onChange={(e) => setPerson(e.target.value)}
              >
                <option value="everyone">Everyone</option>
                <option value="maksim">Maksim</option>
                <option value="nadya">Nadya</option>
              </select>
            </div>
            <div className="select-field">
              <SlidersHorizontal size={14} />
              <select
                aria-label="Filter by chapter"
                value={era}
                onChange={(e) => {
                  setEra(e.target.value);
                  setYear("all");
                }}
              >
                <option value="all">All chapters</option>
                <option value="early">The early years</option>
                <option value="together">Since we met</option>
                <option value="netherlands">Our Dutch chapter</option>
              </select>
            </div>
          </div>
        </div>
        <div className="years-row">
          <span>JUMP TO</span>
          {[
            "all",
            "1990",
            "2000",
            "2010",
            "2017",
            "2019",
            "2022",
            "2024",
            "2026",
          ].map((y) => (
            <button
              key={y}
              className={year === y ? "active" : ""}
              onClick={() => {
                setYear(y);
                if (y !== "all") setEra("all");
              }}
            >
              {y === "all" ? "All years" : y}
            </button>
          ))}
          <span className="result-count">{results.length} moments</span>
        </div>
        <div className="timeline-list">
          {results.slice(0, limit).map((event, i) => {
            const Icon = icons[event.category] || Sparkles;
            const showYear =
              i === 0 ||
              event.start.slice(0, 4) !== results[i - 1].start.slice(0, 4);
            return (
              <div
                className={`timeline-row ${event.featured ? "featured" : ""}`}
                key={event.id}
              >
                <div className="timeline-date">
                  {showYear && <strong>{event.start.slice(0, 4)}</strong>}
                  <span>
                    {formatDate(event.start, event.certainty)
                      .replace(event.start.slice(0, 4), "")
                      .trim()}
                  </span>
                </div>
                <span className="timeline-node">
                  <Icon size={15} strokeWidth={1.6} />
                </span>
                <button className="event-card" onClick={() => onEvent(event)}>
                  <div className="event-card-top">
                    <span
                      className={`category-label ${event.category.toLowerCase()}`}
                    >
                      <Icon size={12} />
                      {event.category}
                    </span>
                    <span className="event-people">
                      <Avatar person={event.person} size="tiny" />
                      {people[event.person]}
                    </span>
                  </div>
                  <h3>{event.title}</h3>
                  <div className="event-card-bottom">
                    {event.place ? (
                      <span>
                        <MapPin size={13} />
                        {event.place.label}
                      </span>
                    ) : (
                      <span>
                        <CalendarDays size={13} />
                        {formatDate(event.start, event.certainty)}
                      </span>
                    )}
                    {isApproximate(event) && (
                      <span className="approx-tag">
                        ≈{" "}
                        {event.certainty === "Year only"
                          ? "Year only"
                          : "Approx. date"}
                      </span>
                    )}
                    <span className="card-arrow">
                      <ArrowUpRight size={17} />
                    </span>
                  </div>
                  {event.featured && (
                    <span className="chapter-motif">
                      <Heart size={58} strokeWidth={0.7} />
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
        {!results.length && (
          <div className="empty-state">
            <Search size={28} />
            <h3>No moments found, yet.</h3>
            <p>Try another place, person or chapter.</p>
            <button
              className="button secondary"
              onClick={() => {
                setSearch("");
                setCategory("All moments");
                setEra("all");
                setPerson("everyone");
                setYear("all");
              }}
            >
              Show all memories
            </button>
          </div>
        )}
        {limit < results.length && (
          <div className="load-more">
            <button
              className="button secondary"
              onClick={() => setLimit(limit + 15)}
            >
              A little further down memory lane <ArrowRight size={15} />
            </button>
            <span>
              Showing {Math.min(limit, results.length)} of {results.length}{" "}
              moments
            </span>
          </div>
        )}
      </section>
    </>
  );
}
function Places({ events, onEvent }) {
  const [selected, setSelected] = useState(null);
  const placeGroups = useMemo(() => {
    const groups = {};
    for (const e of events) {
      if (!e.place?.country || e.category === "World") continue;
      const key = e.place.country;
      groups[key] ??= {
        country: key,
        events: [],
        coordinates: e.place.coordinates,
        label: key,
      };
      groups[key].events.push(e);
      if (e.place.precision === "country")
        groups[key].coordinates = e.place.coordinates;
    }
    return Object.values(groups).sort(
      (a, b) => b.events.length - a.events.length,
    );
  }, [events]);
  return (
    <section className="places-section">
      <div className="eyebrow">
        <span /> A WORLD OF MEMORIES
      </div>
      <h1>
        Every place, <em>a chapter.</em>
      </h1>
      <p className="muted">
        The places woven into our family’s story. Choose a country to explore.
      </p>
      <div className="places-map">
        <WorldMap
          points={placeGroups}
          onSelect={(p) => setSelected(p.country)}
        />
        <div className="map-legend">
          <span>
            <i className="maksim-dot" />
            Recorded place
          </span>
          <span>Approximate markers · not travel routes</span>
        </div>
      </div>
      <div className="places-heading">
        <h2>{selected || "Places in our story"}</h2>
        {selected && (
          <button className="text-button" onClick={() => setSelected(null)}>
            All countries <X size={14} />
          </button>
        )}
      </div>
      {selected ? (
        <div className="place-events">
          {placeGroups
            .find((p) => p.country === selected)
            ?.events.sort((a, b) => a.start.localeCompare(b.start))
            .map((e) => (
              <button
                className="place-event"
                key={e.id}
                onClick={() => onEvent(e)}
              >
                <span>{formatDate(e.start, e.certainty)}</span>
                <strong>{e.title}</strong>
                <ArrowUpRight size={16} />
              </button>
            ))}
        </div>
      ) : (
        <div className="country-grid">
          {placeGroups.map((p, i) => (
            <button
              className="country-card"
              key={p.country}
              onClick={() => setSelected(p.country)}
            >
              <span className="country-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Globe2 size={27} strokeWidth={1} />
              <h3>{p.country === "USA" ? "United States" : p.country}</h3>
              <p>
                {p.events.length} {p.events.length === 1 ? "moment" : "moments"}
                <ArrowUpRight size={16} />
              </p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
function Login({ onLogin, needsSetup }) {
  const [password, setPassword] = useState(""),
    [error, setError] = useState("");
  return (
    <main className="login-page">
      <Mark />
      <div className="eyebrow">OUR FAMILY JOURNAL</div>
      <h1>
        A story for
        <br />
        the people we <em>love.</em>
      </h1>
      <p>
        {needsSetup
          ? "Create a password to open your private family journal."
          : "Welcome to Maksim & Nadya’s timeline."}
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await api(needsSetup ? "setup" : "login", {
              method: "POST",
              body: JSON.stringify({ password }),
            });
            onLogin();
          } catch (err) {
            setError(err.message);
          }
        }}
      >
        <label>
          {needsSetup ? "Choose a family password" : "Family password"}
          <input
            type="password"
            minLength={needsSetup ? 12 : undefined}
            autoComplete={needsSetup ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary">
          <LockKeyhole size={16} />
          {needsSetup ? "Create private journal" : "Open our story"}{" "}
          <ArrowRight size={16} />
        </button>
        {needsSetup && (
          <p className="form-note">
            Use at least 12 characters. Share this password with family members
            you want to invite. Set it before making the site publicly
            accessible.
          </p>
        )}
      </form>
    </main>
  );
}
function App() {
  const [data, setData] = useState(null),
    [session, setSession] = useState(null),
    [error, setError] = useState(""),
    [view, setView] = useState("story"),
    [adding, setAdding] = useState(null),
    [event, setEvent] = useState(null),
    [toast, setToast] = useState(""),
    [about, setAbout] = useState(false);
  async function load() {
    try {
      const s = await api("session");
      setSession(s);
      if (s.authenticated) setData(await api("timeline"));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  function navigate(v) {
    setView(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  if (error)
    return (
      <div className="loading">
        <AlertCircle />
        <h2>We couldn’t open the journal.</h2>
        <p>{error}</p>
        <button className="button primary" onClick={load}>
          Try again
        </button>
      </div>
    );
  if (session && !session.authenticated)
    return <Login onLogin={load} needsSetup={session.needsSetup} />;
  if (!data)
    return (
      <div className="loading">
        <Mark />
        <p>Opening the family journal…</p>
      </div>
    );
  return (
    <>
      <header className="site-header">
        <button
          className="brand"
          onClick={() => navigate("story")}
          aria-label="Our timeline home"
        >
          <Mark />
          <span>
            our timeline<span className="brand-dot">.</span>
          </span>
        </button>
        <nav aria-label="Main navigation">
          {[
            ["story", "Our story", BookOpen],
            ["compare", "Where were we?", MapPin],
            ["places", "Our places", Globe2],
          ].map(([id, label, Icon]) => (
            <button
              key={id}
              className={view === id ? "active" : ""}
              onClick={() => navigate(id)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <span className="family-badge">
            <LockKeyhole size={10} />
            PRIVATE JOURNAL
          </span>
          <button
            className="button primary add-button"
            onClick={() => setAdding("both")}
          >
            <Plus size={16} />
            <span>Add a memory</span>
          </button>
        </div>
      </header>
      <main>
        {view === "story" ? (
          <Story
            events={data.events}
            onEvent={setEvent}
            onCompare={() => navigate("compare")}
          />
        ) : view === "compare" ? (
          <div className="compare-page">
            <Compare
              events={data.events}
              context={data.context}
              onAdd={setAdding}
              onEvent={setEvent}
            />
            <div className="source-note">
              <BookOpen size={18} />
              <p>
                Your history comes from both family workbooks. Nadya’s separate
                location history hasn’t been recorded yet. Shared life events
                don’t automatically mean shared travel.
              </p>
            </div>
          </div>
        ) : (
          <Places events={data.events} onEvent={setEvent} />
        )}
        <section className="closing-note">
          <span className="closing-line" />
          <Heart size={21} strokeWidth={1} />
          <p>
            Not just where we’ve been.
            <br />
            <em>Who we’ve become, together.</em>
          </p>
          <span className="closing-line" />
        </section>
      </main>
      <footer>
        <div>
          <Mark small />
          <span>A little piece of our family.</span>
        </div>
        <div className="footer-links">
          <button className="text-button" onClick={() => setAbout(true)}>
            About this journal <ArrowUpRight size={13} />
          </button>
          <button
            className="text-button"
            onClick={async () => {
              await api("logout", { method: "POST", body: "{}" });
              setData(null);
              setView("story");
              setEvent(null);
              setToast("");
              load();
            }}
          >
            <LogOut size={12} />
            Lock journal
          </button>
        </div>
        <span>Made of moments. Kept with love.</span>
      </footer>
      {adding && (
        <AddMemory
          defaultPerson={typeof adding === "string" ? adding : adding.person}
          defaultDate={adding.date || ""}
          defaultCategory={adding.category || "Together"}
          onClose={() => setAdding(null)}
          onAdded={(e) => {
            setData({ ...data, events: [...data.events, e] });
            setToast("A new little piece of the story. Memory saved.");
          }}
        />
      )}
      {event && (
        <EventDetail
          event={event}
          onClose={() => setEvent(null)}
          onDelete={(id) => {
            setData({
              ...data,
              events: data.events.filter((e) => e.id !== id),
            });
            setToast("Memory removed.");
          }}
        />
      )}
      {about && (
        <Modal title="Our family journal" onClose={() => setAbout(false)}>
          <p className="detail-notes">
            A living collection of Maksim and Nadya’s story, built from our
            family timeline workbooks. It includes the family history that came
            before us, too.
          </p>
          <div className="about-list">
            <p>
              <BookOpen size={17} />
              <span>
                <strong>Two sources, one story</strong>
                {data.sources.map((s) => (
                  <small key={s}>{s}</small>
                ))}
              </span>
            </p>
            <p>
              <CalendarDays size={17} />
              <span>
                <strong>A little room for uncertainty</strong>
                <small>
                  Approximate dates stay approximate. Home records show a
                  residence, rather than a guarantee of where someone was that
                  day.
                </small>
              </span>
            </p>
            <p>
              <Heart size={17} />
              <span>
                <strong>Room for both of us</strong>
                <small>
                  Nadya’s separate locations can be added as memories. We don’t
                  assume she took every trip Maksim did.
                </small>
              </span>
            </p>
            <p>
              <LockKeyhole size={17} />
              <span>
                <strong>
                  {session.protected
                    ? "Family password enabled"
                    : "Development version"}
                </strong>
                <small>
                  {session.protected
                    ? "Family members need the shared password to read or add memories."
                    : "This version has not been published for family access. Access settings can be configured before sharing."}
                </small>
              </span>
            </p>
          </div>
          <p className="source">
            Canal artwork is an illustration, rather than a personal family
            photograph.
          </p>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
