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
import { sendSOS, SOSPayload } from "./api/sosService";

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
    accuracy,
    accuracyStatus,
  } = useGeolocation();
  const userPosition: [number, number] = [lat, lon];

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
      const weatherDescription = wmoCodeToDescription(current.weathercode);

      // 2) Build the SOS payload
      const payload: SOSPayload = {
        latitude: lat,
        longitude: lon,
        weather: `${weatherDescription}, ${current.temperature}°C, wind ${current.windspeed} km/h`,
        sos_message: "Emergency SOS triggered",
        timestamp: new Date().toISOString(),
      };
      // 3) Send SOS alert email via EmailJS service layer
      const result = await sendSOS(payload);
      if (!result.success) {
        throw new Error(result.message);
      }

      console.log("🚨 SOS EMAIL SENT:", payload);

      setSosSuccess(true);
    } catch (err: unknown) {
      console.error("SOS email flow error:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Failed to send SOS email. Please try again.";
      setSosError(message);
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
          🚨 SOS email sent — coordinates: {lat.toFixed(5)}°N,{" "}
          {lon.toFixed(5)}°E.
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
