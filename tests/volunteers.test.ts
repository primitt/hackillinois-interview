import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../src/app";
import { Volunteer } from "../src/config/database";
import defaults from "./common.ts";

const volunteer_path = "/api/volunteer";
const default_volunteer_body = {
    name: defaults.name,
    email: defaults.email,
}

describe("volunteer routes", () => {
    it("creates and normalizes a volunteer", async () => {
        const response = await request(app)
            .post(volunteer_path)
            .send(default_volunteer_body)
            .expect(201);

        expect(response.body).toMatchObject(default_volunteer_body);
        expect(response.body).toHaveProperty("_id");

        const stored_volunteer = await Volunteer.findById(response.body._id);
        expect(stored_volunteer?.email).toBe(defaults.email);
    });

    it("rejects an email that already exists", async () => {
        await request(app)
            .post(volunteer_path)
            .send({ name: defaults.name, email: defaults.email })
            .expect(201);

        const response = await request(app)
            .post(volunteer_path)
            .send({ name: defaults.name, email: defaults.email })
            .expect(400);

        expect(response.body).toEqual({ message: "Email already exists" });
    });

    it("finds a volunteer by normalized email", async () => {
        await Volunteer.create(default_volunteer_body);

        const response = await request(app)
            .get(`${volunteer_path}/${encodeURIComponent(defaults.email)}`)
            .expect(200);

        expect(response.body).toMatchObject(default_volunteer_body);
    });

    it("rejects an invalid lookup email", async () => {
        const response = await request(app)
            .get(`${volunteer_path}/not-an-email`)
            .expect(400);

        expect(response.body.message).toBe("Invalid email");
    });

    it("returns 404 when a volunteer email does not exist", async () => {
        const response = await request(app)
            .get(`${volunteer_path}/funny@notarealemail.com`)
            .expect(404);

        expect(response.body).toEqual({ message: "Volunteer not found" });
    });

    it("deletes an existing volunteer", async () => {
        const volunteer = await Volunteer.create(default_volunteer_body);

        await request(app)
            .delete(`${volunteer_path}/${volunteer._id}`)
            .expect(200);

        expect(await Volunteer.findById(volunteer._id)).toBeNull();
    });

    it("returns 404 when deleting a volunteer twice", async () => {
        const volunteer = await Volunteer.create(default_volunteer_body);

        await request(app)
            .delete(`${volunteer_path}/${volunteer._id}`)
            .expect(200);

        const response = await request(app)
            .delete(`${volunteer_path}/${volunteer._id}`)
            .expect(404);

        expect(response.body).toEqual({ message: "Volunteer not found" });
    });
});
