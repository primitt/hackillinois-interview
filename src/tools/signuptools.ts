import { Types as mongoose_types } from "mongoose";

import { Signup as signup_model } from "../config/database";

type full_slot_arguments = {
    shift_id: mongoose_types.ObjectId | string;
    requested_start: Date;
    requested_end: Date;
    slot_duration_ms: number;
    capacity: number;
    excluded_signup_id?: mongoose_types.ObjectId | string;
};

export async function find_full_slots({
    shift_id,
    requested_start,
    requested_end,
    slot_duration_ms,
    capacity,
    excluded_signup_id,
}: full_slot_arguments) {
    const overlapping_signups_query = signup_model.find({
        shift: shift_id,
        starts_at: { $lt: requested_end },
        ends_at: { $gt: requested_start },
    });

    if (excluded_signup_id) {
        overlapping_signups_query.where("_id").ne(excluded_signup_id);
    }

    const overlapping_signups = await overlapping_signups_query;

    const requested_start_time = requested_start.getTime();
    const requested_end_time = requested_end.getTime();
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

    return full_slots;
}
