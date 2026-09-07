import { request, Router } from "express";
import { Shift } from "../config/database";

const router = Router();

// TODO: replace next(error) with proper error handling
// TODO: add type validation (maybe?)


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
            starts_at: req.body.start_date,
            ends_at: req.body.end_date,
            capacity: req.body.total_capacity,
            slot_duration: req.body.shift_duration ? req.body.shift_duration : 30,
        });

        res.status(201).json(shift);
    } catch (error) {
        next(error);
    }
});

// delete a shift
router.post("/delete/:id", async (req, res, next) => {
    try {
        const shift = await Shift.findByIdAndDelete(req.params.id);
        if (!shift) {
            res.status(404).json({ message: "Shift not found" });
            return;
        }
        res.status(200).json({ message: "Shift deleted successfully" });
    } catch (error) {
        next(error);
    }
});

router.post("/update/:id", async (req, res, next) => {
    try {
        const shift = await Shift.findById(req.params.id);
        if (!shift) {
            res.status(404).json({ message: "Shift not found" });
            return;
        }
        if (req.body.role) shift.role = req.body.role;
        if (req.body.starts_at) shift.starts_at = req.body.starts_at;
        if (req.body.ends_at) shift.ends_at = req.body.ends_at;
        if (req.body.capacity) shift.capacity = req.body.capacity;
        if (req.body.slot_duration) shift.slot_duration = req.body.slot_duration;

        await shift.save();
        res.status(200).json(shift);
    } catch (error) {
        next(error);
    }
});

export default router;
