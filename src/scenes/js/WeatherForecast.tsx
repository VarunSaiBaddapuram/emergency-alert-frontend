import React, { useState, useEffect } from "react";
import axios from "axios";
import WeatherForecastDay from "./WeatherForecastDay";
import { ForecastRow } from "../../types/weather.types";
import "../css/WeatherForecast.css";

interface WeatherForecastProps {
  coordinates: {
    lat: number;
    lon: number;
  };
}

const WeatherForecast: React.FC<WeatherForecastProps> = ({ coordinates }) => {
  const [forecast, setForecast] = useState<ForecastRow[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Use primitive deps to avoid stale object reference triggering extra runs
    const { lat, lon } = coordinates;
    if (!lat || !lon) return;

    setLoading(true);
    setError(null);
    setForecast(null);

    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lon}` +
      `&daily=temperature_2m_max,temperature_2m_min,weathercode` +
      `&timezone=auto&forecast_days=7`;

    axios
      .get(url)
      .then((response) => {
        const daily = response.data.daily;

        // Transform from Open-Meteo columnar format → ForecastRow[]
        const rows: ForecastRow[] = (daily.time as string[]).map(
          (time: string, i: number) => ({
            // Convert ISO date string → Unix seconds so WeatherForecastDay works unchanged
            dt: new Date(time).getTime() / 1000,
            temp: {
              max: daily.temperature_2m_max[i],
              min: daily.temperature_2m_min[i],
            },
            // WMO code as string; WeatherIcon maps this to an animated icon
            weather: [{ icon: String(daily.weathercode[i]) }],
          })
        );

        setForecast(rows);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Forecast fetch error:", err);
        setError("Could not load forecast.");
        setLoading(false);
      });
    // Depend on primitive values, not the object reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinates.lat, coordinates.lon]);

  if (loading) {
    return (
      <div className="p-2 text-center text-muted small">
        Loading forecast…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 text-center text-danger small">{error}</div>
    );
  }

  if (!forecast) return null;

  return (
    <div className="WeatherForecast">
      <div className="row">
        {forecast.slice(0, 5).map((dailyForecast, index) => (
          <div className="col" key={index}>
            <WeatherForecastDay data={dailyForecast} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherForecast;
