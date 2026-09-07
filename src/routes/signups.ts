import { Router } from "express";
import { z } from "zod";

import { Shift, Signup, Volunteer } from "../config/database";
import { find_full_slots } from "../tools/signuptools";

const router = Router();

const date_time_schema = z.iso.datetime({ offset: true }).transform((date_time) => new Date(date_time));

const signup_id_schema = z.object({
    id: z.string(),
});

const create_signup_schema = z.object({
    volunteer: z.string(),
    shift: z.string(),
    start_date: date_time_schema,
    end_date: date_time_schema,
});

router.get("/", async (_req, res, next) => {
    try {
        const signup = await Signup.find({});
        res.status(200).json(signup);
    }
    catch (error) {
        next(error);
    }
});

router.get("/:id", async (req, res, next) => {
    try {
        const validation_result = signup_id_schema.safeParse(req.params);

        if (!validation_result.success) {
            res.status(400).json({
                message: "Invalid signup ID",
                issues: validation_result.error.issues,
            });
            return;
        }

        const signup = await Signup.findById(validation_result.data.id);

        if (!signup) {
            res.status(404).json({ message: "Signup not found" });
            return;
        }
        res.status(200).json(signup);
    }
    catch (error) {
        next(error);
    }
});

router.get("/findByUser/:id", async (req, res, next) => {
    try {
        const validation_result = signup_id_schema.safeParse(req.params);

        if (!validation_result.success) {
            res.status(400).json({
                message: "Invalid volunteer ID",
                issues: validation_result.error.issues,
            });
            return;
        }

        const signup = await Signup.find({
            volunteer: validation_result.data.id,
        });

        res.status(200).json(signup);
    }
    catch (error) {
        next(error);
    }
});

router.get("/findByShift/:id", async (req, res, next) => {
    try {
        const validation_result = signup_id_schema.safeParse(req.params);

        if (!validation_result.success) {
            res.status(400).json({
                message: "Invalid shift ID",
                issues: validation_result.error.issues,
            });
            return;
        }

        const signup = await Signup.find({
            shift: validation_result.data.id,
        });

        res.status(200).json(signup);
    }
    catch (error) {
        next(error);
    }
});


router.post("/create/", async (req, res, next) => {
    try {
        const validation_result = create_signup_schema.safeParse(req.body);

        if (!validation_result.success) {
            res.status(400).json({
                message: "Invalid signup data",
                issues: validation_result.error.issues,
            });
            return;
        }

        const volunteer_id = validation_result.data.volunteer;
        const shift_id = validation_result.data.shift;
        const requested_start = validation_result.data.start_date;
        const requested_end = validation_result.data.end_date;

        if (requested_start >= requested_end) {
            res.status(400).json({
                message: "The signup end date must be after its start date",
            });
            return;
        }

        const shift = await Shift.findById(shift_id);

        if (!shift) {
            res.status(404).json({ message: "Shift not found" });
            return;
        }

        const volunteer_exists = await Volunteer.exists({ _id: volunteer_id });

        if (!volunteer_exists) {
            res.status(404).json({ message: "Volunteer not found" });
            return;
        }

        const shift_start = shift.starts_at.getTime();
        const shift_end = shift.ends_at.getTime();
        const requested_start_time = requested_start.getTime();
        const requested_end_time = requested_end.getTime();
        const slot_duration = Number(shift.slot_duration);
        const capacity = Number(shift.capacity);

        if (!Number.isInteger(slot_duration) || slot_duration <= 0 || !Number.isInteger(capacity) || capacity <= 0) {
            res.status(409).json({ message: "Shift has an invalid slot duration or capacity" });
            return;
        }

        if (requested_start_time < shift_start || requested_end_time > shift_end) {
            res.status(400).json({ message: "Signup dates must be within the shift" });
            return;
        }

        const slot_duration_ms = slot_duration * 60000;
        const start_is_aligned = (requested_start_time - shift_start) % slot_duration_ms === 0;
        const end_is_aligned = (requested_end_time - shift_start) % slot_duration_ms === 0 || requested_end_time === shift_end;

        if (!start_is_aligned || !end_is_aligned) {
            res.status(400).json({
                message: `Signup dates must align with ${slot_duration}-minute slots`,
            });
            return;
        }

        const duplicate_signup = await Signup.exists({
            volunteer: volunteer_id,
            shift: shift._id,
        });

        if (duplicate_signup) {
            res.status(409).json({ message: "Volunteer is already signed up for this shift" });
            return;
        }

        const full_slots = await find_full_slots({
            shift_id: shift._id,
            requested_start,
            requested_end,
            slot_duration_ms,
            capacity,
        });

        if (full_slots.length > 0) {
            res.status(400).json({
                message: "One or more requested slots are full",
                full_slots,
            });
            return;
        }

        const signup = await Signup.create({
            volunteer: volunteer_id,
            shift: shift._id,
            starts_at: requested_start,
            ends_at: requested_end,
        });

        res.status(201).json(signup);
    } catch (error) {
        next(error);
    }
});

router.post("/delete/:id", async (req, res, next) => {
    try {
        const validation_result = signup_id_schema.safeParse(req.params);

        if (!validation_result.success) {
            res.status(400).json({
                message: "Invalid signup ID",
                issues: validation_result.error.issues,
            });
            return;
        }

        const signup = await Signup.findByIdAndDelete(validation_result.data.id);

        if (!signup) {
            res.status(404).json({ message: "Signup not found" });
            return;
        }
        res.status(200).json({ message: `Signup ${signup._id} deleted successfully` });
    } catch (error) {
        next(error);
    }
});

export default router;
