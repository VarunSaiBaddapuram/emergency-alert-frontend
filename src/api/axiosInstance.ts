import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { ApiError } from "../types/api.types";
import { toast } from "react-toastify";

const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor: Attach Bearer token to Authorization header
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle global errors and 401 redirects
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<ApiError>) => {
    if (error.response && error.response.status === 401) {
      // Clear auth local storage
      localStorage.removeItem("token");
      localStorage.removeItem("auth"); // Old auth state cleanup
      
      // Redirect to login page if we're not already on it
      if (!window.location.pathname.includes("/agency")) {
        window.location.href = "/agency";
      }
    }
    
    if (!error.response && error.message === "Network Error") {
      toast.error("Network Error: Please check your internet connection.");
    }
    
    // Standardize error format { message, errors }
    const errorData: ApiError = {
      message: error.response?.data?.message || error.message || "An unexpected error occurred",
      errors: error.response?.data?.errors || undefined,
      status: error.response?.status
    };

    return Promise.reject(errorData);
  }
);

export default axiosInstance;
