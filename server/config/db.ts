import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;

        if (!mongoUri) {
            throw new Error("MONGODB_URI is missing");
        }

        console.log(
            "MongoDB URI:",
            mongoUri.replace(
                /\/\/.*@/,
                "//***:***@"
            )
        );

        await mongoose.connect(mongoUri);

        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error(
            "Error connecting to MongoDB:",
            error
        );

        throw error;
    }
};

export default connectDB;