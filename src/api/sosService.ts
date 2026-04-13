import axiosInstance from "./axiosInstance";

export interface SOSPayload {
  latitude: number;
  longitude: number;
  weather: string;
  sos_message: string;
  timestamp: string;
}

interface SendSOSResponse {
  success: boolean;
  message: string;
}

/**
 * Sends an SOS alert to the backend.
 * The backend handles email distribution via Nodemailer.
 */
export const sendSOS = async (payload: SOSPayload): Promise<SendSOSResponse> => {
  try {
    const response = await axiosInstance.post("/sos/send", payload);

    if (response.data && response.data.success) {
      return { success: true, message: "SOS alert sent successfully via backend." };
    } else {
      return { success: false, message: response.data.message || "Failed to send SOS alert." };
    }
  } catch (error: any) {
    console.error("Backend SOS send failed:", error);
    
    // Extract error message from axios response if available
    const errorMessage = error.message || "Failed to reach backend SOS service.";
    
    return { 
      success: false, 
      message: errorMessage 
    };
  }
};
