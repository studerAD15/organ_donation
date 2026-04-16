import http from "http";
import app from "./app.js";
import config from "./config/env.js";
import connectDatabase from "./config/db.js";
import { initSocket } from "./sockets/index.js";
import startExpiryScheduler from "./jobs/expiryScheduler.js";
import { bootstrapDevelopmentData } from "./services/bootstrapDevelopmentData.js";

const start = async () => {
  await connectDatabase();
  await bootstrapDevelopmentData();
  const server = http.createServer(app);
  initSocket(server, config.clientUrl);
  startExpiryScheduler();

  server.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
};

start();
