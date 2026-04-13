import { useState, useEffect } from "react";

export type GeolocationErrorType =
  | "PERMISSION_DENIED"
  | "POSITION_UNAVAILABLE"
  | "TIMEOUT"
  | "UNSUPPORTED"
  | null;

interface GeolocationState {
  lat: number;
  lon: number;
  loading: boolean;
  error: string | null;
  errorType: GeolocationErrorType;
  accuracy: number | null;
  accuracyStatus: string | null;
}

/** Hyderabad — used when geolocation is unavailable or denied */
const FALLBACK_LAT = 17.385;
const FALLBACK_LON = 78.4867;

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

/**
 * useGeolocation
 * Requests the browser's current position via navigator.geolocation.
 * Retries once if accuracy is low (>1000m).
 * Falls back to Hyderabad coordinates on denial or unsupported browser.
 */
const useGeolocation = (): GeolocationState => {
  const [state, setState] = useState<GeolocationState>({
    lat: FALLBACK_LAT,
    lon: FALLBACK_LON,
    loading: true,
    error: null,
    errorType: null,
    accuracy: null,
    accuracyStatus: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Geolocation is not supported by your browser.",
        errorType: "UNSUPPORTED",
      }));
      return;
    }

    const getPosition = (): Promise<GeolocationPosition> =>
      new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, GEOLOCATION_OPTIONS)
      );

    const runGeolocation = async () => {
      try {
        let position = await getPosition();
        console.log(`📍 Initial Geolocation Accuracy: ${position.coords.accuracy}m`);

        // Retry once after 2 seconds if accuracy is low (> 1000m)
        if (position.coords.accuracy > 1000) {
          console.warn("⚠️ Low accuracy detected (>1000m). Retrying in 2 seconds...");
          await new Promise((resolve) => setTimeout(resolve, 2000));
          
          try {
            const secondPosition = await getPosition();
            console.log(`📍 Retry Geolocation Accuracy: ${secondPosition.coords.accuracy}m`);
            
            // Keep the better result
            if (secondPosition.coords.accuracy < position.coords.accuracy) {
              position = secondPosition;
            }
          } catch (retryError) {
            console.error("Geolocation retry failed:", retryError);
            // Stick with the first result if retry fails
          }
        }

        const { latitude, longitude, accuracy } = position.coords;
        let accuracyStatus = "Moderate accuracy location";
        if (accuracy < 100) {
          accuracyStatus = "High accuracy location detected";
        } else if (accuracy > 1000) {
          accuracyStatus = "Low accuracy — location may be approximate";
        }

        setState({
          lat: latitude,
          lon: longitude,
          loading: false,
          error: accuracy > 1000 ? accuracyStatus : null,
          errorType: null,
          accuracy,
          accuracyStatus,
        });
      } catch (geoError: any) {
        let type: GeolocationErrorType = null;
        let message = "An unknown geolocation error occurred.";

        if (geoError.code === 1) {
          type = "PERMISSION_DENIED";
          message = "Location access is blocked.";
          console.warn("🚨 Geolocation blocked by browser — using fallback coordinates");
        } else if (geoError.code === 2) {
          type = "POSITION_UNAVAILABLE";
          message = "Location information is unavailable.";
        } else if (geoError.code === 3) {
          type = "TIMEOUT";
          message = "Location request timed out.";
        }

        console.warn("Geolocation denied or failed:", geoError.message);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
          errorType: type,
        }));
      }
    };

    runGeolocation();
  }, []);

  return state;
};

export default useGeolocation;

