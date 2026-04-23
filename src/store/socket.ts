import { io } from "socket.io-client";

export const socket = io(process.env.REACT_APP_API_BASE_URL as string, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  withCredentials: true,
});
