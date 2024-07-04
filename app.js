import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { transactionRouter } from "./routes/transactionRoute.js";
import { userRouter } from "./routes/authRoute.js";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use("/api", transactionRouter);
app.use("/api/user", userRouter);

// Handle non-existing routes
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  const { status = 500 || err.status, message = "Server error" } = err;
  res.status(status).json({ message });
});

app.listen(3000, () => {
  console.log("Server running on port 3000!");
});
