import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const useSocket = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user?._id) return;

    const client = io(SOCKET_URL, {
      auth: {
        userId: user._id,
        role: user.role
      }
    });

    setSocket(client);
    return () => client.disconnect();
  }, [user]);

  return socket;
};
