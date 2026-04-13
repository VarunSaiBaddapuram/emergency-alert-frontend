import React from "react";
import ReactAnimatedWeather from "react-animated-weather";

interface WeatherIconProps {
  code: string;
  size: number;
}

/**
 * Maps both OWM icon codes (e.g. "01d") and Open-Meteo WMO codes (e.g. "0", "61")
 * to ReactAnimatedWeather icon names.
 */
const codeMapping: Record<string, string> = {
  // ── Legacy OpenWeatherMap codes ────────────────────────────────────────────
  "01d": "CLEAR_DAY",
  "01n": "CLEAR_NIGHT",
  "02d": "PARTLY_CLOUDY_DAY",
  "02n": "PARTLY_CLOUDY_NIGHT",
  "03d": "PARTLY_CLOUDY_DAY",
  "03n": "PARTLY_CLOUDY_NIGHT",
  "04d": "CLOUDY",
  "04n": "CLOUDY",
  "09d": "RAIN",
  "09n": "RAIN",
  "10d": "RAIN",
  "10n": "RAIN",
  "11d": "RAIN",
  "11n": "RAIN",
  "13d": "SNOW",
  "13n": "SNOW",
  "50d": "FOG",
  "50n": "FOG",

  // ── WMO Weather Interpretation Codes (Open-Meteo) ─────────────────────────
  // Clear
  "0": "CLEAR_DAY",
  "1": "CLEAR_DAY",
  // Partly cloudy / overcast
  "2": "PARTLY_CLOUDY_DAY",
  "3": "CLOUDY",
  // Fog
  "45": "FOG",
  "48": "FOG",
  // Drizzle
  "51": "RAIN",
  "53": "RAIN",
  "55": "RAIN",
  "56": "RAIN",
  "57": "RAIN",
  // Rain
  "61": "RAIN",
  "63": "RAIN",
  "65": "RAIN",
  "66": "SLEET",
  "67": "SLEET",
  // Snow
  "71": "SNOW",
  "73": "SNOW",
  "75": "SNOW",
  "77": "SNOW",
  // Showers
  "80": "RAIN",
  "81": "RAIN",
  "82": "RAIN",
  "85": "SNOW",
  "86": "SNOW",
  // Thunderstorm
  "95": "RAIN",
  "96": "RAIN",
  "99": "RAIN",
};

const WeatherIcon: React.FC<WeatherIconProps> = ({ code, size }) => {
  const iconName = codeMapping[code] ?? "CLEAR_DAY";

  return (
    <ReactAnimatedWeather
      icon={iconName}
      color="#1e1e1e"
      size={size}
      animate={true}
    />
  );
};

export default WeatherIcon;
