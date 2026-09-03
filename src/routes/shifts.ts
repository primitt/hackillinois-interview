import { request, Router } from "express";
import { Shift } from "../config/database";

const router = Router();

// get all shifts
router.get("/", async (_req, res, next) => {
    try {
        const shifts = await Shift.find({});
        res.status(200).json(shifts);
    } catch (error) {
        next(error);
    }
    });

// create a shift
router.post("/create", async (req, res, next) => {
    try {
        if (!req.body.role || !req.body.start_date || !req.body.end_date || !req.body.total_capacity) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }
        const shift = await Shift.create({
            role: req.body.role,
            start_date: req.body.start_date,
            end_date: req.body.end_date,
            total_capacity: req.body.total_capacity,
        });

        res.status(201).json(shift);
    } catch (error) {
        next(error);
    }
});

// delete a shift
router.post("/delete", async (req, res, next) => {
    try {
        const shift = await Shift.findByIdAndDelete(req.body.id);
        if (!shift) {
            res.status(404).json({ message: "Shift not found" });
            return;
        }
        res.status(200).json({ message: "Shift deleted successfully" });
    } catch (error) {
        next(error);
    }
});

export default router;
