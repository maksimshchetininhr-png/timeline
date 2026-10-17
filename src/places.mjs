// Map centers are illustrative; they do not imply an address or exact GPS position.
const cities = {
  haarlem: [4.64, 52.39],
  amsterdam: [4.9, 52.37],
  moscow: [37.62, 55.76],
  murmansk: [33.07, 68.97],
  severomorsk: [33.42, 69.07],
  korolev: [37.85, 55.92],
  london: [-0.13, 51.51],
  paris: [2.35, 48.86],
  berlin: [13.41, 52.52],
  prague: [14.43, 50.08],
  stockholm: [18.07, 59.33],
  helsinki: [24.94, 60.17],
  tallinn: [24.75, 59.44],
  vienna: [16.37, 48.21],
  bratislava: [17.11, 48.15],
  rome: [12.5, 41.9],
  sciacca: [13.08, 37.51],
  barcelona: [2.17, 41.39],
  madrid: [-3.7, 40.42],
  lisbon: [-9.14, 38.72],
  brussels: [4.35, 50.85],
  "san francisco": [-122.42, 37.77],
  "los angeles": [-118.24, 34.05],
  "new york": [-74, 40.71],
};
const countries = {
  netherlands: [5.3, 52.2],
  russia: [95, 61],
  usa: [-99, 39],
  "united states": [-99, 39],
  "united states of america": [-99, 39],
  norway: [10, 62],
  finland: [26, 64],
  sweden: [15, 62],
  spain: [-3, 40],
  estonia: [25, 59],
  czechia: [15.5, 49.8],
  "czech republic": [15.5, 49.8],
  germany: [10, 51],
  poland: [19, 52],
  austria: [14.5, 47.5],
  slovakia: [19.7, 48.7],
  italy: [12.5, 42.5],
  uk: [-2, 54],
  "united kingdom": [-2, 54],
  england: [-2, 54],
  maldives: [73.2, 3.2],
  hungary: [19, 47],
  belgium: [4.5, 50.7],
  portugal: [-8, 39.5],
  china: [104, 35],
  serbia: [21, 44],
  france: [2, 47],
  kazakhstan: [68, 48],
};
export function resolveCoordinates(city, country) {
  const cityPoint = cities[city?.trim().toLowerCase()];
  const countryPoint = countries[country?.trim().toLowerCase()];
  return {
    coordinates: cityPoint || countryPoint || null,
    coordinatePrecision: cityPoint ? "city" : countryPoint ? "country" : null,
  };
}

export function normalizeCountry(value) {
  const name = value?.trim() || "";
  const aliases = {
    "united states": "USA",
    "united states of america": "USA",
    us: "USA",
    "united kingdom": "UK",
    "great britain": "UK",
    england: "UK",
    "czech republic": "Czechia",
    "the netherlands": "Netherlands",
    "russian federation": "Russia",
  };
  const key = name.toLowerCase();
  if (aliases[key]) return aliases[key];
  if (key === "usa" || key === "uk") return key.toUpperCase();
  return key in countries ? key[0].toUpperCase() + key.slice(1) : name;
}
export function normalizeCity(value) {
  const name = value?.trim() || "";
  return name.toLowerCase() in cities
    ? name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : name;
}
