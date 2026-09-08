import request from "supertest";
import { Types as mongoose_types } from "mongoose";
import { describe, expect, it } from "vitest";

import app from "../src/app";
import { Shift, Signup, Volunteer } from "../src/config/database";
import defaults from "./common.ts";

const shifts_path = "/api/shifts";
const valid_shift_body = {
    role: defaults.role,
    start_date: defaults.start_date,
    end_date: defaults.end_date,
    total_capacity: defaults.total_capacity,
    slot_duration: defaults.slot_duration,
};

describe("shift routes", () => {
    it("creates a shift", async () => {
        const response = await request(app)
            .post(`${shifts_path}/create`)
            .send(valid_shift_body)
            .expect(201);

        expect(response.body).toMatchObject({
            role: defaults.role,
            starts_at: new Date(defaults.start_date).toISOString(),
            ends_at: new Date(defaults.end_date).toISOString(),
            capacity: defaults.total_capacity,
            slot_duration: defaults.slot_duration,
        });
        expect(response.body).toHaveProperty("_id");

        const stored_shift = await Shift.findById(response.body._id);
        expect(stored_shift?.role).toBe(defaults.role);
    });
    it("rejects a shift that ends before it starts", async () => {
        const response = await request(app)
            .post(`${shifts_path}/create`)
            .send({
                ...valid_shift_body,
                start_date: defaults.end_date,
                end_date: defaults.start_date,
            })
            .expect(400);

        expect(response.body).toEqual({
            message: "Start date must be before end date",
        });
    });

    it("lists all shifts", async () => {
        await Shift.create({
            role: defaults.role,
            starts_at: new Date(defaults.start_date),
            ends_at: new Date(defaults.end_date),
            capacity: defaults.total_capacity,
            slot_duration: defaults.slot_duration,
        });

        const response = await request(app)
            .get(shifts_path)
            .expect(200);

        expect(response.body).toHaveLength(1);
        expect(response.body[0].role).toBe(defaults.role);
    });

    it("gets one shift with no full slots", async () => {
        const shift = await Shift.create({
            role: defaults.role,
            starts_at: new Date(defaults.start_date),
            ends_at: new Date(defaults.end_date),
            capacity: defaults.total_capacity,
            slot_duration: defaults.slot_duration,
        });

        const response = await request(app)
            .get(`${shifts_path}/${shift._id}`)
            .expect(200);

        expect(response.body).toMatchObject({
            _id: shift._id.toString(),
            role: defaults.role,
            full_slots: [],
        });
    });

    it("returns the full slots for a shift", async () => {
        const shift_start = new Date(defaults.start_date);
        const first_slot_end = new Date(
            shift_start.getTime() + defaults.slot_duration * 60000,
        );
        const shift = await Shift.create({
            role: defaults.role,
            starts_at: shift_start,
            ends_at: new Date(defaults.end_date),
            capacity: defaults.total_capacity,
            slot_duration: defaults.slot_duration,
        });
        const volunteer = await Volunteer.create({
            name: defaults.name,
            email: defaults.email,
        });

        await Signup.create({
            volunteer: volunteer._id,
            shift: shift._id,
            starts_at: shift_start,
            ends_at: first_slot_end,
        });

        const response = await request(app)
            .get(`${shifts_path}/${shift._id}`)
            .expect(200);

        expect(response.body.full_slots).toEqual([
            {
                starts_at: shift_start.toISOString(),
                ends_at: first_slot_end.toISOString(),
            },
        ]);
    });

    it("returns 404 when a shift does not exist", async () => {
        const missing_shift_id = new mongoose_types.ObjectId();

        const response = await request(app)
            .get(`${shifts_path}/${missing_shift_id}`)
            .expect(404);

        expect(response.body).toEqual({ message: "Shift not found" });
    });

    it("updates a shift", async () => {
        const shift = await Shift.create({
            role: defaults.role,
            starts_at: new Date(defaults.start_date),
            ends_at: new Date(defaults.end_date),
            capacity: defaults.total_capacity,
            slot_duration: defaults.slot_duration,
        });
        const updated_role = `${defaults.role} Updated`;
        const updated_capacity = defaults.total_capacity + 1;

        const response = await request(app)
            .post(`${shifts_path}/update/${shift._id}`)
            .send({
                role: updated_role,
                capacity: updated_capacity,
            })
            .expect(200);

        expect(response.body).toMatchObject({
            role: updated_role,
            capacity: updated_capacity,
        });
    });

    it("deletes a shift", async () => {
        const shift = await Shift.create({
            role: defaults.role,
            starts_at: new Date(defaults.start_date),
            ends_at: new Date(defaults.end_date),
            capacity: defaults.total_capacity,
            slot_duration: defaults.slot_duration,
        });

        const response = await request(app)
            .post(`${shifts_path}/delete/${shift._id}`)
            .expect(200);

        expect(response.body).toEqual({
            message: "Shift deleted successfully",
        });
        expect(await Shift.findById(shift._id)).toBeNull();
    });
});
