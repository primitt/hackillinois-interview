import express from "express";

import shiftsRouter from "./routes/shifts";
import signupsRouter from "./routes/signups";
import volunteersRouter from "./routes/volunteers";


const app = express();

app.use(express.json());

app.get("/status", (_request, response) => {
    response.status(200).json({ status: "ok" });
});

app.use("/api/shifts", shiftsRouter);
app.use("/api/signups", signupsRouter);
app.use("/api/volunteer", volunteersRouter);

export default app;


// TODO: replace next(error) with proper error handling
// TODO: add update route to signups
// TODO: clean up code in all routes (see what can be shifted to tooling; clean up validation with zod)
// TODO: write tests for all routes
// TODO: add comments & clean up comments

// TODO: fix insomnia presentation + add all routes to collections