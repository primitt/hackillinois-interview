import { Router } from "express";
import { z } from "zod";

import { Volunteer } from "../config/database";

const router = Router();

const email_schema = z.string().trim().toLowerCase().pipe(z.email());

const volunteer_email_schema = z.object({
    email: email_schema,
});

const create_volunteer_schema = z.object({
    name: z.string().trim().min(1).max(100),
    email: email_schema,
});

const volunteer_id_schema = z.object({
    id: z.string()
});

// due to absense of authentication, a /findByEmail route is created to suplant an authention cookie and is only used for testing.

router.get("/:email", async (req, res, next) => {
    try {
        const validation_result = volunteer_email_schema.safeParse(req.params);

        if (!validation_result.success) {
            res.status(400).json({
                message: "Invalid email",
                issues: validation_result.error.issues,
            });
            return;
        }

        const volunteer = await Volunteer.findOne({
            email: validation_result.data.email,
        });

        if (!volunteer) {
            res.status(404).json({ message: "Volunteer not found" });
            return;
        }
        res.status(200).json(volunteer);
    } catch (error) {
        next(error);
    }
});

router.post("/", async (req, res, next) => {
    try {
        const validation_result = create_volunteer_schema.safeParse(req.body);

        if (!validation_result.success) {
            res.status(400).json({
                message: "Invalid volunteer data",
                issues: validation_result.error.issues,
            });
            return;
        }
        const existing_volunteer = await Volunteer.findOne({
            email: validation_result.data.email,
        });

        if (existing_volunteer) {
            res.status(400).json({ message: "Email already exists" });
            return;
        }

        const volunteer = await Volunteer.create(validation_result.data);

        res.status(201).json(volunteer);
    } catch (error) {
        next(error);
    }
});

router.delete("/:id", async (req, res, next) => {
    try {
        const validation_result = volunteer_id_schema.safeParse(req.params);

        if (!validation_result.success) {
            res.status(400).json({
                message: "Invalid volunteer ID",
                issues: validation_result.error.issues,
            });
            return;
        }

        const volunteer = await Volunteer.findByIdAndDelete(validation_result.data.id);

        if (!volunteer) {
            res.status(404).json({ message: "Volunteer not found" });
            return;
        }
        res.status(200).json({ message: `Volunteer ${volunteer._id} deleted successfully` });
    } catch (error) {
        next(error);
    }
});


export default router;
