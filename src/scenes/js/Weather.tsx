import React, { useState, useEffect } from "react";
import WeatherData from "./WeatherData";
import WeatherForecast from "./WeatherForecast";
import axios from "axios";
import { WeatherInfo, wmoCodeToDescription } from "../../types/weather.types";
import "../css/Weather.css";

interface WeatherProps {
  lat: number;
  lon: number;
}

interface WeatherState {
  ready: boolean;
  loading: boolean;
  error: string | null;
  data?: WeatherInfo;
  coordinates?: { lat: number; lon: number };
}

const Weather: React.FC<WeatherProps> = ({ lat, lon }) => {
  const [state, setState] = useState<WeatherState>({
    ready: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Guard: don't fetch if coordinates aren't valid yet
    if (!lat || !lon) return;

    setState({ ready: false, loading: true, error: null });

    const fetchWeather = async () => {
      try {
        const url =
          `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${lat}&longitude=${lon}` +
          `&current_weather=true` +
          `&hourly=relativehumidity_2m,temperature_2m` +
          `&timezone=auto&forecast_days=1`;

        const response = await axios.get(url);
        const current = response.data.current_weather;

        // Find the hourly index matching the current weather timestamp
        const hourlyTimes: string[] = response.data.hourly.time;
        const currentHourPrefix = current.time.slice(0, 13); // "2024-01-01T12"
        const hourIndex = hourlyTimes.findIndex((t: string) =>
          t.startsWith(currentHourPrefix)
        );
        const humidity =
          hourIndex >= 0
            ? response.data.hourly.relativehumidity_2m[hourIndex]
            : 0;

        setState({
          ready: true,
          loading: false,
          error: null,
          data: {
            // Show coordinates as "city" since Open-Meteo is coordinate-based
            city: `${lat.toFixed(3)}°N, ${lon.toFixed(3)}°E`,
            temperature: current.temperature,
            humidity,
            date: new Date(current.time),
            description: wmoCodeToDescription(current.weathercode),
            // Pass WMO code as string — WeatherIcon handles both OWM & WMO codes
            icon: String(current.weathercode),
            wind: current.windspeed,
          },
          coordinates: { lat, lon },
        });
      } catch (err) {
        console.error("Weather fetch error:", err);
        setState({
          ready: false,
          loading: false,
          error: "Failed to load weather data. Please try again.",
        });
      }
    };

    fetchWeather();
  }, [lat, lon]); // Only re-fetch when coordinates actually change

  if (state.loading) {
    return (
      <div className="p-3 text-center text-muted">
        Loading weather data…
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="p-3 text-center text-danger">{state.error}</div>
    );
  }

  if (state.ready && state.data) {
    return (
      <div className="Weather">
        <WeatherData data={state.data} />
        {state.coordinates && (
          <WeatherForecast coordinates={state.coordinates} />
        )}
      </div>
    );
  }

  return null;
};

export default Weather;
