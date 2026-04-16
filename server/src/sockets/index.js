import { Server } from "socket.io";

let io;

export const initSocket = (httpServer, clientUrl) => {
  io = new Server(httpServer, {
    cors: {
      origin: clientUrl,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    const { userId, role } = socket.handshake.auth || {};
    if (userId) {
      socket.join(`user:${userId}`);
    }
    if (role) {
      socket.join(`role:${role}`);
    }

    socket.on("disconnect", () => {});
  });

  return io;
};

export const getIo = () => io;
