import express from "express";

import shiftsRouter from "./routes/shifts";
import signupsRouter from "./routes/signups";


const app = express();

app.use(express.json());

app.get("/status", (_request, response) => {
    response.status(200).json({ status: "ok" });
});

app.use("/api/shifts", shiftsRouter);
app.use("/api/signups", signupsRouter);

export default app;
