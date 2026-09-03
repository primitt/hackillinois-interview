import express from "express";

import shiftsRouter from "./routes/shifts";

const app = express();

app.use(express.json());

app.get("/status", (_request, response) => {
    response.status(200).json({ status: "ok" });
});

app.use("/api/shifts", shiftsRouter);

export default app;
