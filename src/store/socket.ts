import { io } from "socket.io-client";

export const socket = io(process.env.REACT_APP_API_BASE_URL || "http://localhost:5000", {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
});
