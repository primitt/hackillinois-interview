import { request, Router } from "express";
import { Volunteer } from "../config/database";

const router = Router();

// due to absense of authentication, a /findByEmail route is created to suplant an authention cookie and is only used for testing.

router.get("/findByEmail/:email", async (req, res, next) => {
    try {
        if (!req.params.email) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }
        const volunteer = await Volunteer.findOne({ email: req.params.email });
        if (!volunteer) {
            res.status(404).json({ message: "Volunteer not found" });
            return;
        }
        res.status(200).json(volunteer);
    } catch (error) {
        next(error);
    }
});

router.post("/create/", async (req, res, next) => {
    try {
        if (!req.body.name || !req.body.email) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }
        // check for email uniqueness
        const existingVolunteer = await Volunteer.findOne({ email: req.body.email });
        if (existingVolunteer) {
            res.status(400).json({ message: "Email already exists" });
            return;
        }
        const volunteer = await Volunteer.create({
            name: req.body.name,
            email: req.body.email,
        });
        res.status(201).json(volunteer);
    } catch (error) {
        next(error);
    }
});

router.get("/delete/:id", async (req, res, next) => {
    try {
        const volunteer = await Volunteer.findByIdAndDelete(req.params.id);
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