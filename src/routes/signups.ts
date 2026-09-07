// DESIGN:
// Volunteers will sign up for a certain "time" slot(s) within a shift, i.e a day or a couple hours, depending on when the start time and end time are. 


//FIXME: Edge case: what happens when you input just a time? does it become time + date | To Test
import { request, Router } from "express";
import { Shift, Signup, Volunteer } from "../config/database";

const router = Router();

router.get("/", async (_req, res, next) => {
    try {
        const signup = await Signup.find({});
        res.status(200).json(signup);
    }
    catch (error) {
        next(error);
    }
});

router.get("/findByUser/:id", async (req, res, next) => {
    try {
        const signup = await Signup.find({ volunteer: req.params.id });
        res.status(200).json(signup);
    }
    catch (error) {
        next(error);
    }
});

router.post("/findByShift/:id", async (req, res, next) => {
    try {
        const signup = await Signup.findById(req.params.id);
        if (!signup) {
            res.status(404).json({ message: "Shift not found" });
            return;
        }
        res.status(200).json(signup);
    }
    catch (error) {
        next(error);
    }
});

//TODO: finish the creation strategy for a shift. need to create timeslots

router.post("/create/", async (req, res, next) => {
    try {
        if (!req.body.volunteer || !req.body.shift || !req.body.start_date || !req.body.end_date) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }
        if (!Signup.base.isValidObjectId(req.body.volunteer) || !Signup.base.isValidObjectId(req.body.shift)) {
            res.status(400).json({ message: "Invalid volunteer or shift ID" });
            return;
        }

        const requested_start = new Date(req.body.start_date);
        const requested_end = new Date(req.body.end_date);

        if (Number.isNaN(requested_start.getTime()) || Number.isNaN(requested_end.getTime())) {
            res.status(400).json({ message: "Invalid start or end date" });
            return;
        }

        if (requested_start >= requested_end) {
            res.status(400).json({ message: "The signup end date must be after its start date" });
            return;
        }

        const shift = await Shift.findById(req.body.shift);

        if (!shift) {
            res.status(404).json({ message: "Shift not found" });
            return;
        }
        const volunteer_exists = await Volunteer.exists({ _id: req.body.volunteer });
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
            volunteer: req.body.volunteer,
            shift: shift._id,
        });

        if (duplicate_signup) {
            res.status(409).json({ message: "Volunteer is already signed up for this shift" });
            return;
        }

        const overlapping_signups = await Signup.find({
            shift: shift._id,
            starts_at: { $lt: requested_end },
            ends_at: { $gt: requested_start },
        });

        const full_slots = [];
        for (let slot_start = requested_start_time; slot_start < requested_end_time; slot_start += slot_duration_ms) {
            const slot_end = Math.min(slot_start + slot_duration_ms, requested_end_time);

            const occupied = overlapping_signups.filter((existing_signup) =>
                existing_signup.starts_at.getTime() < slot_end
                && existing_signup.ends_at.getTime() > slot_start
            ).length;

            if (occupied >= capacity) {
                full_slots.push({
                    starts_at: new Date(slot_start),
                    ends_at: new Date(slot_end),
                });
            }
        }

        if (full_slots.length > 0) {
            res.status(400).json({
                message: "One or more requested slots are full",
                full_slots,
            });
            return;
        }

        const signup = await Signup.create({
            volunteer: req.body.volunteer,
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
        const signup = await Signup.findByIdAndDelete(req.params.id);
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
