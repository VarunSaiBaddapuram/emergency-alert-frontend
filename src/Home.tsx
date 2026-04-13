import React, { useState, useRef } from "react";
import MapComponents, {
  MapComponentsRef,
} from "./components/MapComponents/MapComponents";
import FloodPredict from "./scenes/js/App";
import {
  Alert,
  Box,
  Card,
  CircularProgress,
  Fab,
  Grid,
  Tooltip,
  Typography,
} from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import "./Mapweather.css";
import useGeolocation from "./hooks/useGeolocation";
import axios from "axios";
import { wmoCodeToDescription } from "./types/weather.types";

/**
 * SOS payload shape — Phase 2 will send this via EmailJS.
 * For Phase 1 it is logged to the console only.
 */
interface SOSPayload {
  latitude: number;
  longitude: number;
  weather: {
    temperature: number;
    windspeed: number;
    weathercode: number;
    description: string;
  };
  message: string;
  timestamp: string;
}

const Home: React.FC = () => {
  const [isSOSClicked, setIsSOSClicked] = useState<boolean>(false);
  const [sosLoading, setSosLoading] = useState<boolean>(false);
  const [sosSuccess, setSosSuccess] = useState<boolean>(false);
  const [sosError, setSosError] = useState<string | null>(null);

  const mapRef = useRef<MapComponentsRef>(null);

  // Real geolocation — falls back to Hyderabad on denial
  const {
    lat,
    lon,
    loading: geoLoading,
    error: geoError,
    errorType: geoErrorType,
    accuracy,
    accuracyStatus,
  } = useGeolocation();
  const userPosition: [number, number] = [lat, lon];

  /**
   * handleSOS
   * Phase 1: obtain location, fetch fresh weather, build and log the SOS payload.
   * Phase 2 hook: the commented block below is where EmailJS will be called.
   */
  const handleSOS = async () => {
    if (sosLoading) return;

    setSosLoading(true);
    setSosError(null);
    setSosSuccess(false);
    setIsSOSClicked(true); // show SOS circle on map immediately

    // Notify map component (for future Phase 2 pulse animation etc.)
    mapRef.current?.handleSOSClick();

    try {
      // 1) Fetch fresh weather snapshot at real coordinates
      const response = await axios.get(
        `https://api.open-meteo.com/v1/forecast` +
          `?latitude=${lat}&longitude=${lon}` +
          `&current_weather=true&timezone=auto`
      );
      const current = response.data.current_weather;

      // 2) Build the SOS payload
      const payload: SOSPayload = {
        latitude: lat,
        longitude: lon,
        weather: {
          temperature: current.temperature,
          windspeed: current.windspeed,
          weathercode: current.weathercode,
          description: wmoCodeToDescription(current.weathercode),
        },
        message: "Emergency SOS triggered",
        timestamp: new Date().toISOString(),
      };

      // 3) Phase 1 — log to console
      console.log("🚨 SOS PAYLOAD:", payload);

      /*
       * ── Phase 2 hook (EmailJS) ────────────────────────────────────────────
       * import emailjs from "@emailjs/browser";
       * await emailjs.send(
       *   process.env.REACT_APP_EMAILJS_SERVICE_ID!,
       *   process.env.REACT_APP_EMAILJS_TEMPLATE_ID!,
       *   {
       *     latitude:    String(payload.latitude),
       *     longitude:   String(payload.longitude),
       *     weather:     `${payload.weather.description}, ${payload.weather.temperature}°C, wind ${payload.weather.windspeed} km/h`,
       *     sos_message: payload.message,
       *     timestamp:   payload.timestamp,
       *   },
       *   process.env.REACT_APP_EMAILJS_PUBLIC_KEY!
       * );
       * ──────────────────────────────────────────────────────────────────────
       */

      setSosSuccess(true);
    } catch (err) {
      console.error("SOS flow error:", err);
      setSosError("SOS triggered but weather data could not be fetched.");
      // Still mark SOS as clicked — location was captured
    } finally {
      setSosLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, position: "relative" }}>
      {/* ── SOS Floating Button ─────────────────────────────────────────── */}
      <Tooltip
        title={
          geoLoading
            ? "Detecting location…"
            : isSOSClicked
            ? "SOS Already Sent"
            : "Send SOS Alert"
        }
        placement="left"
      >
        <span>
          <Fab
            id="sos-fab-button"
            color="error"
            onClick={handleSOS}
            disabled={sosLoading || geoLoading}
            sx={{
              position: "fixed",
              top: "100px",
              right: "40px",
              width: 80,
              height: 80,
              boxShadow: isSOSClicked
                ? "0 0 0 8px rgba(255,0,0,0.25)"
                : "0 5px 15px rgba(255,0,0,0.4)",
              zIndex: 1000,
              transition: "box-shadow 0.4s ease",
            }}
          >
            {sosLoading ? (
              <CircularProgress size={32} color="inherit" />
            ) : sosSuccess ? (
              <CheckCircleIcon fontSize="large" />
            ) : (
              <WarningIcon fontSize="large" />
            )}
          </Fab>
        </span>
      </Tooltip>

      {/* ── Heading ─────────────────────────────────────────────────────── */}
      <Typography variant="h4" align="center" fontWeight={600} gutterBottom>
        Weather &amp; Map Dashboard
      </Typography>

      {/* ── Status banners ──────────────────────────────────────────────── */}
      {geoError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {geoError}
        </Alert>
      )}
      {!geoError && accuracyStatus && !geoLoading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {accuracyStatus}
        </Alert>
      )}
      {sosSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          🚨 SOS payload logged — coordinates: {lat.toFixed(5)}°N,{" "}
          {lon.toFixed(5)}°E. (Phase 2: email will be sent here.)
        </Alert>
      )}
      {sosError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {sosError}
        </Alert>
      )}

      {/* ── Main content ────────────────────────────────────────────────── */}
      <Grid container spacing={3}>
        {/* Weather card */}
        <Grid item xs={12} md={6}>
          <Card elevation={4} sx={{ p: 2 }}>
            {geoLoading ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
                  Detecting your location…
                </Typography>
              </Box>
            ) : (
              <FloodPredict lat={lat} lon={lon} />
            )}
          </Card>
        </Grid>

        {/* Map card */}
        <Grid item xs={12} md={6}>
          <Card elevation={4} sx={{ p: 2 }}>
            <MapComponents
              ref={mapRef}
              isSOSClicked={isSOSClicked}
              userPosition={geoLoading ? undefined : userPosition}
              accuracy={accuracy}
            />
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;
