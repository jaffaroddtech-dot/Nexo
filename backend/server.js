require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser")
const connectDB = require("./config/db");
const routes = require("./routes/index");
const http = require("http");
const { initSocket } = require("./Socket/socket");

const { globalLimiter } = require("./middleware/limiterMiddleware");

const app = express();

connectDB();

// 👇 YE SABSE PEHLE — Express ko /socket.io/ requests bilkul touch nahi karni
app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url); // 👈 add
  if (req.url.startsWith("/socket.io")) {
    console.log("🚫 Blocking Express from handling:", req.url); // 👈 add
    return;
  }
  next();
});

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);

app.get("/", (req, res) => {
  res.status(200).json({ message: "NEXO API is running", status: true });
});


for (let route in routes) {
  app.use(route, routes[route]);
}

app.use((req, res) => {
  res.status(404).json({ message: "Route not found", status: false });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error", error: err.message, status: false });
});

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`NEXO server running on port ${PORT}`);
});