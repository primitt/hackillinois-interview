import { Router } from "express";
import { z } from "zod";

import { Shift } from "../config/database";
import { find_full_slots } from "../tools/signuptools";

const router = Router();

const date_time_schema = z.iso.datetime({ offset: true }).transform((date_time) => new Date(date_time));

const shift_id_schema = z.object({
    id: z.string(),
});

const create_shift_schema = z.object({
    role: z.string().trim().min(1).max(100),
    start_date: date_time_schema,
    end_date: date_time_schema,
    total_capacity: z.number().int().positive(),
    slot_duration: z.number().int().positive().default(30),
});

// get all shifts
router.get("/", async (_req, res, next) => {
    try {
        const shifts = await Shift.find({});
        res.status(200).json(shifts);
    } catch (error) {
        next(error);
    }
    });


router.get("/:id", async (req, res, next) => {
    try {
        const validation_result = shift_id_schema.safeParse(req.params);

        if (!validation_result.success) {
            res.status(400).json({
                message: "Invalid shift ID",
                issues: validation_result.error.issues,
            });
            return;
        }

        // get shift and show full signups for that shift. if no signups for that shift, none should show.
        const shift = await Shift.findById(validation_result.data.id);

        if (!shift) {
            res.status(404).json({ message: "Shift not found" });
            return;
        }
        const slot_duration_ms = shift.slot_duration * 60000;
        const full_slots = await find_full_slots({
            shift_id: shift._id,
            requested_start: shift.starts_at,
            requested_end: shift.ends_at,
            slot_duration_ms: slot_duration_ms,
            capacity: shift.capacity,
        });
        res.status(200).json({ ...shift.toObject(), full_slots });
    } catch (error) {
        next(error);
    }
});
// create a shift
router.post("/create", async (req, res, next) => {
    try {
        const validation_result = create_shift_schema.safeParse(req.body);

        if (!validation_result.success) {
            res.status(400).json({
                message: "Invalid shift data",
                issues: validation_result.error.issues,
            });
            return;
        }

        if (validation_result.data.start_date >= validation_result.data.end_date) {
            res.status(400).json({ message: "Start date must be before end date" });
            return;
        }

        const shift = await Shift.create({
            role: validation_result.data.role,
            starts_at: validation_result.data.start_date,
            ends_at: validation_result.data.end_date,
            capacity: validation_result.data.total_capacity,
            slot_duration: validation_result.data.slot_duration,
        });

        res.status(201).json(shift);
    } catch (error) {
        next(error);
    }
});

// delete a shift
router.post("/delete/:id", async (req, res, next) => {
    try {
        const validation_result = shift_id_schema.safeParse(req.params);

        if (!validation_result.success) {
            res.status(400).json({
                message: "Invalid shift ID",
                issues: validation_result.error.issues,
            });
            return;
        }

        const shift = await Shift.findByIdAndDelete(validation_result.data.id);

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
