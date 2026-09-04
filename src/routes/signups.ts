// DESIGN:
// Volunteers will sign up for a certain "time" slot(s) within a shift, i.e a day or a couple hours, depending on when the start time and end time are. 

import { request, Router } from "express";
import { Shift } from "../config/database";

const router = Router();

router.get("/", async (_req, res, next) => {
    try {
        const shifts = await Shift.find({});
        res.status(200).json(shifts);
    }
    catch (error) {
        next(error);
    }
});

router.get("/findByUser/:id", async (req, res, next) => {
    try {
        const shifts = await Shift.find({ volunteer: req.params.id });
        res.status(200).json(shifts);
    }
    catch (error) {
        next(error);
    }
});

router.post("/findByShift/:id", async (req, res, next) => {
    try {
        const shift = await Shift.findById(req.params.id);
        if (!shift) {
            res.status(404).json({ message: "Shift not found" });
            return;
        }
        res.status(200).json(shift);
    }
    catch (error) {
        next(error);
    }
});

//TODO: finish the creation strategy for a shift. need to create timeslots

router.post("/create/", (req, res, next) => {
    try{
        return;
    } catch (error) {
        next(error);
    }
});


export default router;
