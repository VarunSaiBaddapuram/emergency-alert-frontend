export interface WeatherInfo {
  city: string;
  date: Date;
  description: string;
  /** OWM icon code (e.g. "01d") OR WMO numeric code as string (e.g. "0", "61") */
  icon: string;
  temperature: number;
  humidity: number;
  wind: number;
}

/**
 * ForecastRow — shape is shared between OWM and Open-Meteo.
 * When sourced from Open-Meteo: `dt` is a Unix timestamp in seconds
 * (derived from the date string), and `weather[0].icon` is a WMO code string.
 */
export interface ForecastRow {
  dt: number; // Unix timestamp in seconds
  temp: {
    max: number;
    min: number;
  };
  weather: Array<{
    icon: string; // WMO code string when using Open-Meteo
  }>;
}

/** Maps WMO weather interpretation codes to human-readable descriptions. */
export const wmoCodeToDescription = (code: number): string => {
  const descriptions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Icy fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Heavy freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snowfall",
    73: "Moderate snowfall",
    75: "Heavy snowfall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with heavy hail",
  };
  return descriptions[code] ?? "Unknown conditions";
};
