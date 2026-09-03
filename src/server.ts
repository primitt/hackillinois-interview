import app from "./app";
import {
    connectDatabase,
    Shift,
    Signup,
    Volunteer,
} from "./config/database";

const port = 3000;
async function startServer(): Promise<void> {
    try {
        await connectDatabase();
        await Promise.all([
            Volunteer.init(),
            Shift.init(),
            Signup.init(),
        ]);

        app.listen(port, () => {
            console.log(`Server listening on port ${port}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

void startServer();
