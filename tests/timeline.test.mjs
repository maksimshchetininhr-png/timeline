import test from "node:test";
import assert from "node:assert/strict";
import { fixture } from "./fixture.mjs";
import {
  locationAt,
  comparison,
  filterEvents,
  formatDate,
} from "../src/lib.mjs";
import { resolveCoordinates } from "../src/places.mjs";
const { events } = fixture;
const trip = (id, place, start = "2024-01-01", end = "2024-01-10") => ({
  id,
  person: "maksim",
  trip: true,
  place,
  start,
  end,
  certainty: "Exact",
});
test("a family milestone does not invent a residence", () => {
  assert.equal(locationAt(events, "maksim", "1960-01-01").kind, "unknown");
});
test("an undated wife location is never inferred from marriage", () => {
  for (const date of ["2018-01-10", "2020-06-20", "2024-01-01"])
    assert.equal(locationAt(events, "nadya", date).kind, "unknown");
});
test("a home is available as a recorded residence, not an exact-position claim", () => {
  const r = locationAt(events, "maksim", "2024-01-01");
  assert.equal(r.kind, "home");
  assert.equal(r.place.city, "Haarlem");
  assert.notEqual(r.certainty, "Exact");
});
test("travel takes priority over the residence and returns home after the trip", () => {
  assert.equal(
    locationAt(events, "maksim", "2024-04-07").place.country,
    "Portugal",
  );
  assert.equal(
    locationAt(events, "maksim", "2024-04-11").place.city,
    "Haarlem",
  );
});
test("city subrecord refines a country-wide trip on the exact boundary days", () => {
  for (const d of ["2020-12-31", "2021-01-01"])
    assert.equal(locationAt(events, "maksim", d).place.city, "San Francisco");
  const r = locationAt(events, "maksim", "2020-12-25");
  assert.equal(r.place.city, null);
  assert.equal(r.place.precision, "route");
});
test("multi-city routes never pretend to identify a city for every day", () => {
  const r = locationAt(events, "maksim", "2023-07-05");
  assert.equal(r.place.country, "Italy");
  assert.equal(r.place.city, null);
  assert.ok(r.place.route.includes("Rome"));
});
test("overlapping independent countries remain ambiguous", () => {
  const r = locationAt(events, "maksim", "2025-03-10");
  assert.equal(r.kind, "ambiguous");
  assert.equal(r.events.length, 2);
});
test("city detail cannot suppress a conflicting country record", () => {
  const r = locationAt(
    [
      trip("a", { city: "Paris", country: "France", label: "Paris, France" }),
      trip("b", { city: null, country: "Italy", label: "Italy" }),
    ],
    "maksim",
    "2024-01-05",
  );
  assert.equal(r.kind, "ambiguous");
});
test("no location is assigned before the first record", () =>
  assert.equal(locationAt(events, "maksim", "1980-01-01").kind, "unknown"));
test("an ended residence does not revive an older stale residence", () => {
  assert.equal(
    locationAt(
      [
        {
          id: "a",
          person: "nadya",
          residence: true,
          start: "2020-01-01",
          place: { city: "Paris" },
        },
        {
          id: "b",
          person: "nadya",
          residence: true,
          start: "2021-01-01",
          end: "2022-01-01",
          place: { city: "London" },
        },
      ],
      "nadya",
      "2023-01-01",
    ).kind,
    "unknown",
  );
});
test("a shared memory applies to each person", () => {
  const e = {
    person: "both",
    residence: true,
    start: "2024-01-01",
    place: { city: "Haarlem" },
  };
  assert.equal(locationAt([e], "nadya", "2024-01-02").place.city, "Haarlem");
});
test("a trip without an end is confined to the recorded day", () => {
  const e = trip("a", { country: "France", label: "France" });
  e.end = null;
  assert.equal(locationAt([e], "maksim", "2024-01-01").kind, "trip");
  assert.equal(locationAt([e], "maksim", "2024-01-02").kind, "unknown");
});
test("search, category, and person filters work together", () => {
  const found = filterEvents(events, {
    search: "married",
    person: "nadya",
    category: "Together",
    era: "together",
  });
  assert.equal(found.length, 1);
  assert.equal(found[0].title, "We got married");
  assert.equal(filterEvents(events, { search: "no-such-memory" }).length, 0);
});
test("date display does not claim a day for month-only or year-only dates", () => {
  assert.equal(formatDate("2018-01-01", "Month only"), "Jan 2018");
  assert.equal(formatDate("1994-01-01", "Year only"), "1994");
  assert.equal(formatDate("2020-06-20"), "20 Jun 2020");
});
test("comparison distinguishes unknown, country-level, and city-level matches", () => {
  assert.match(
    comparison({ place: null }, { place: { city: "Haarlem" } }).label,
    /fill in/,
  );
  assert.equal(
    comparison(
      { place: { city: "Haarlem", country: "Netherlands" } },
      { place: { city: "Amsterdam", country: "Netherlands" } },
    ).label,
    "In the same country",
  );
  assert.equal(
    comparison(
      { place: { city: "Haarlem", country: "Netherlands" } },
      { place: { city: "Haarlem", country: "Netherlands" } },
    ).label,
    "In the same city",
  );
});
test("added location map centers distinguish city and country granularity", () => {
  assert.equal(
    resolveCoordinates("Haarlem", "Netherlands").coordinatePrecision,
    "city",
  );
  assert.equal(
    resolveCoordinates("Unmapped city", "Netherlands").coordinatePrecision,
    "country",
  );
  assert.equal(
    resolveCoordinates("Unmapped city", "Unmapped country").coordinates,
    null,
  );
});

test("conflicting country-arrival and home-move dates stay visible", () => {
  const r = locationAt(events, "maksim", "2023-02-10");
  assert.equal(r.kind, "ambiguous");
  assert.equal(r.events.length, 2);
  assert.equal(
    locationAt(events, "maksim", "2023-02-15").place.city,
    "Amsterdam",
  );
});
