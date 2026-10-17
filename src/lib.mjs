export const people = {
  maksim: "Maksim",
  nadya: "Nadya",
  both: "Maksim & Nadya",
  family: "Family",
};
export function applies(event, person) {
  return event.person === person || event.person === "both";
}
export function locationAt(events, person, date) {
  const relevant = events.filter((e) => applies(e, person) && e.start <= date);
  const trips = relevant.filter(
    (e) => e.trip && e.place && date <= (e.end || e.start),
  );
  if (trips.length) {
    // A named city inside a country-wide trip provides finer evidence, not a second location.
    const finer = trips.filter(
      (e) =>
        !trips.some(
          (other) =>
            other !== e &&
            other.place.city &&
            !e.place.city &&
            other.place.country === e.place.country,
        ),
    );
    const candidates = finer.filter(
      (e, i, a) => a.findIndex((x) => x.place.label === e.place.label) === i,
    );
    return {
      kind: candidates.length > 1 ? "ambiguous" : "trip",
      events: candidates,
      place: candidates.length === 1 ? candidates[0].place : null,
      certainty: candidates[0].certainty,
    };
  }
  const home = relevant
    .filter((e) => e.residence && e.place)
    .sort((a, b) => b.start.localeCompare(a.start))[0];
  const countries = relevant
    .filter(
      (e) =>
        e.subcategory === "Residence/country timeline" &&
        e.place &&
        (!e.end || date <= e.end),
    )
    .sort((a, b) => b.start.localeCompare(a.start));
  if (home && (!home.end || date <= home.end)) {
    if (
      countries[0] &&
      countries[0].start > home.start &&
      countries[0].place.country &&
      home.place.country &&
      countries[0].place.country !== home.place.country
    )
      return {
        kind: "ambiguous",
        place: null,
        events: [home, countries[0]],
        certainty: "Conflicting source dates",
      };
    return {
      kind: "home",
      place: home.place,
      events: [home],
      certainty: home.certainty,
    };
  }
  if (countries.length)
    return {
      kind: "country",
      place: countries[0].place,
      events: [countries[0]],
      certainty: countries[0].certainty,
    };
  return { kind: "unknown", place: null, events: [] };
}
export function comparison(a, b) {
  if (!a.place || !b.place)
    return {
      label: "A little more of the story to fill in",
      detail: "Add missing locations to see how your paths crossed.",
      same: false,
    };
  if (
    a.place.city &&
    b.place.city &&
    a.place.city === b.place.city &&
    a.place.country === b.place.country
  )
    return {
      label: "In the same city",
      detail: `Both recorded in ${a.place.city}.`,
      same: true,
    };
  if (a.place.country && a.place.country === b.place.country)
    return {
      label: "In the same country",
      detail:
        a.place.city && b.place.city
          ? `${a.place.city} & ${b.place.city}`
          : "City-level detail is not recorded for both people.",
      same: true,
    };
  return {
    label: "Different places, the same moment",
    detail: `${a.place.country || a.place.label} & ${b.place.country || b.place.label}`,
    same: false,
  };
}
export function formatDate(date, certainty = "Exact") {
  if (!date) return "Date unknown";
  const d = new Date(date + "T12:00:00Z");
  if (/year only|exact start year/i.test(certainty))
    return d.getUTCFullYear().toString();
  if (/month|approx|anchor/i.test(certainty))
    return d.toLocaleDateString("en-GB", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
export function isApproximate(event) {
  return !/^exact$/i.test(event.certainty);
}
export function filterEvents(
  events,
  {
    search = "",
    category = "All moments",
    person = "everyone",
    era = "all",
  } = {},
) {
  const sharedStart =
    events
      .filter((e) => e.person === "both")
      .map((e) => e.start)
      .sort()[0] || "9999-12-31";
  const dutchStart =
    events
      .filter((e) => e.residence && e.place?.country === "Netherlands")
      .map((e) => e.start)
      .sort()[0] || "9999-12-31";
  return events.filter(
    (e) =>
      (category === "All moments" || e.category === category) &&
      (person === "everyone" || applies(e, person)) &&
      (era === "all" ||
        (era === "together" && e.start >= sharedStart) ||
        (era === "early" && e.start < sharedStart) ||
        (era === "netherlands" && e.start >= dutchStart)) &&
      `${e.title} ${e.place?.label || ""} ${e.place?.route || ""} ${e.category} ${people[e.person]}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
}
