// Entirely synthetic regression data. No imported family records are used in public tests.
const place = (city, country, coordinates) => ({
  city,
  country,
  label: [city, country].filter(Boolean).join(", "),
  coordinates: coordinates || null,
  precision: city ? "city" : "country",
});
const e = (id, start, title, extra = {}) => ({
  id,
  start,
  title,
  end: null,
  person: "maksim",
  category: "Life",
  certainty: "Exact",
  notes: "Synthetic test fixture",
  source: "Synthetic test data",
  ...extra,
});
export const fixture = {
  events: [
    e("family-early", "1960-01-01", "Family beginnings", {
      person: "family",
      category: "Family",
    }),
    e("school", "2000-09-01", "School started", { category: "Education" }),
    e("first-date", "2018-01-10", "Our first date", {
      person: "both",
      category: "Together",
      certainty: "Month only",
      featured: true,
    }),
    e("wedding", "2020-06-20", "We got married", {
      person: "both",
      category: "Together",
      featured: true,
    }),
    e("usa-route", "2020-12-24", "A winter trip", {
      trip: true,
      category: "Travel",
      end: "2021-01-05",
      place: {
        ...place(null, "USA", [-99, 39]),
        precision: "route",
        route: "Los Angeles; San Francisco, USA",
      },
    }),
    e("sf-detail", "2020-12-31", "A city stop", {
      trip: true,
      category: "Travel",
      end: "2021-01-01",
      place: place("San Francisco", "USA", [-122.42, 37.77]),
    }),
    e("old-home", "2022-01-01", "An earlier home", {
      residence: true,
      category: "Home",
      place: place("Moscow", "Russia", [37.62, 55.76]),
    }),
    e("country-arrival", "2023-02-08", "A country arrival", {
      subcategory: "Residence/country timeline",
      category: "Travel",
      place: place(null, "Netherlands", [5.3, 52.2]),
    }),
    e("city-move", "2023-02-15", "A city move", {
      residence: true,
      category: "Home",
      place: place("Amsterdam", "Netherlands", [4.9, 52.37]),
    }),
    e("italy-route", "2023-07-01", "A summer route", {
      trip: true,
      category: "Travel",
      end: "2023-07-10",
      place: {
        ...place(null, "Italy", [12.5, 42.5]),
        precision: "route",
        route: "Rome; Florence, Italy",
      },
    }),
    e("home", "2024-01-01", "A new home", {
      residence: true,
      category: "Home",
      certainty: "Month only",
      place: place("Haarlem", "Netherlands", [4.64, 52.39]),
    }),
    e("portugal", "2024-04-05", "A spring trip", {
      trip: true,
      category: "Travel",
      end: "2024-04-10",
      place: place(null, "Portugal", [-8, 39.5]),
    }),
    e("overlap-a", "2025-03-10", "First overlapping visit", {
      trip: true,
      category: "Travel",
      end: "2025-03-10",
      place: place(null, "France", [2, 47]),
    }),
    e("overlap-b", "2025-03-10", "Second overlapping visit", {
      trip: true,
      category: "Travel",
      end: "2025-03-10",
      place: place(null, "Belgium", [4.5, 50.7]),
    }),
  ],
  context: [
    {
      category: "Career",
      start: "2020-01-01",
      end: null,
      value: "A fictional career chapter",
    },
  ],
  sources: ["Synthetic test fixture"],
  people: [
    { id: "maksim", name: "Maksim" },
    { id: "nadya", name: "Nadya" },
  ],
};
