import React, { createContext, useContext, useState } from "react";
import { io } from "socket.io-client";
import { APP_URL } from "../enviroment/enviroments";

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context)
    throw new Error("useSocket debe ser usado dentro de un SocketProvider");
  return context;
};

export const SocketProvider = ({ children }) => {
  const [sockets, setSockets] = useState({});

  const connect = (userId) => {
    if (sockets[userId]) return sockets[userId];

    const socket = io(`${APP_URL.API_SOCKET}/chat`, {
      query: { userId },
      autoConnect: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () =>
      console.log(`✅ ${userId} connected: ${socket.id}`)
    );
    socket.on("disconnect", () => console.log(`❌ ${userId} disconnected`));

    setSockets((prev) => ({ ...prev, [userId]: socket }));
    return socket;
  };

  const disconnect = (userId) => {
    const socket = sockets[userId];
    if (socket) {
      socket.disconnect();
      setSockets((prev) => {
        const newSockets = { ...prev };
        delete newSockets[userId];
        return newSockets;
      });
    }
  };

  const emit = (userId, event, data) => {
    const socket = sockets[userId];
    if (socket && socket.connected) socket.emit(event, data);
  };

  const on = (userId, event, callback) => {
    const socket = sockets[userId];
    if (socket) socket.on(event, callback);
  };

  const off = (userId, event, callback) => {
    const socket = sockets[userId];
    if (socket) socket.off(event, callback);
  };

  return (
    <SocketContext.Provider
      value={{ sockets, connect, disconnect, emit, on, off }}
    >
      {children}
    </SocketContext.Provider>
  );
};
