import React, { forwardRef, useImperativeHandle, useEffect } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Box } from "@mui/material";

const icon = L.icon({
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  iconUrl: "https://unpkg.com/leaflet@1.6/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.6/dist/images/marker-shadow.png",
});

/** Fallback coordinates — Hyderabad */
const FALLBACK_POSITION: [number, number] = [17.385, 78.4867];

/**
 * ChangeView — lives inside MapContainer so it can call useMap().
 * Re-centers the map whenever `center` changes (real geolocation update).
 * Implements dynamic zoom based on accuracy.
 */
const ChangeView: React.FC<{ center: [number, number]; accuracy?: number | null }> = ({
  center,
  accuracy,
}) => {
  const map = useMap();

  useEffect(() => {
    let zoom = 16;
    if (accuracy !== undefined && accuracy !== null) {
      if (accuracy < 50) zoom = 17;
      else if (accuracy < 200) zoom = 15;
      else if (accuracy >= 1000) zoom = 12;
    }
    map.setView(center, zoom);
  }, [center, accuracy, map]);

  return null;
};

interface MapComponentsProps {
  isSOSClicked?: boolean;
  /** Real user coordinates from the geolocation hook in Home.tsx */
  userPosition?: [number, number];
  accuracy?: number | null;
}

export interface MapComponentsRef {
  handleSOSClick: () => void;
}

const MapComponents = forwardRef<MapComponentsRef, MapComponentsProps>(
  (props, ref) => {
    const { isSOSClicked, userPosition, accuracy } = props;
    const position: [number, number] = userPosition ?? FALLBACK_POSITION;
    const isRealLocation = !!userPosition;

    useImperativeHandle(ref, () => ({
      handleSOSClick() {
        // Phase 2: advanced map behaviour (e.g. pulse animation) goes here.
        // The actual SOS flow (geolocation + weather + console log) lives in Home.tsx.
        console.log("📍 SOS map marker at:", position);
      },
    }));

    return (
      <Box sx={{ position: "relative", height: "100%" }}>
        <MapContainer
          // Initial center — set to fallback so the map always renders;
          // ChangeView will move it to the real position once available.
          center={FALLBACK_POSITION}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%", borderRadius: "10px" }}
        >
          {/* Programmatically re-center map when coordinates change */}
          <ChangeView center={position} accuracy={accuracy} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={position} icon={icon}>
            <Popup>
              {isRealLocation
                ? `📍 Your Location (${position[0].toFixed(4)}°, ${position[1].toFixed(4)}°)`
                : "📍 Default Location — Hyderabad"}{" "}
              <br />
              {isSOSClicked && "🚨 Emergency responders notified."}
            </Popup>
          </Marker>

          {/* Red SOS circle shown only after SOS is triggered */}
          {isSOSClicked && (
            <Circle
              center={position}
              pathOptions={{
                color: "red",
                fillColor: "red",
                fillOpacity: 0.15,
              }}
              radius={500}
            />
          )}
        </MapContainer>
      </Box>
    );
  }
);

MapComponents.displayName = "MapComponents";

export default MapComponents;
