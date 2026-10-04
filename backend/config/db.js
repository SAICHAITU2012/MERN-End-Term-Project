import mongoose from "mongoose";

let connected = false;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        connected = true;
        console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
    } catch (error) {
        connected = false;
        console.error("MongoDB connection failed:", error.message);
        throw error;
    }
};

export const isDbConnected = () => connected && mongoose.connection.readyState === 1;

export default connectDB;
