import mongoose from "mongoose";

const connectDB = async () => {

    mongoose.connection.on('connected', () => console.log("Database Connected"))

    const raw = process.env.MONGODB_URI;
    if (!raw) {
        throw new Error("MONGODB_URI is not defined in environment");
    }

    // Trim whitespace and strip surrounding quotes if present
    const base = raw.trim().replace(/^['"]|['"]$/g, "");

    // Always connect to the 'hospitra' database on the cluster
    const uri = `${base.replace(/\/+$/, "")}/hospitra`;

    await mongoose.connect(uri)

}

export default connectDB;

// Do not use '@' symbol in your databse user's password else it will show an error.