import dotenv from "dotenv";
import mongoose from "mongoose";


// TODO: maybe need to edit signups to include start time/end time only? timezone needed? how to do?

dotenv.config();

export async function connectDatabase(): Promise<void> {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        throw new Error("please define mongodb uri");
    }

    await mongoose.connect(mongoUri);
}

export const volunteerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
    },
    {
        timestamps: true,
    },
);
export const shifts = new mongoose.Schema(
    {
        role: {
            type: String,
            required: true,
            trim: true,
        },
        starts_at: {
            type: Date,
            required: true,
            trim: true,
        },
        ends_at: {
            type: Date,
            required: true,
            trim: true,
        },
        capacity: {
            type: Number,
            required: true,
            trim: true,
        },
        slot_duration : {
            type: Number,
            default: 30,
            trim: true,
        },
    },
    {
        timestamps: true,
    },
);

export const signups = new mongoose.Schema(
    {
        volunteer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Volunteer",
            required: true,
        },
        shift: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shift",
            required: true,
        },
        starts_at: {
            type: Date,
            required: true,
            trim: true,
        },
        ends_at: {
            type: Date,
            required: true,
            trim: true,
        }
    },
    {
        timestamps: true,
    },
);

signups.index({ volunteer: 1, shift: 1 }, { unique: true });

export const Volunteer = mongoose.model("Volunteer", volunteerSchema);
export const Shift = mongoose.model("Shift", shifts);
export const Signup = mongoose.model("Signup", signups);
