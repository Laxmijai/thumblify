import "dotenv/config";

import express, { Request, Response } from "express";
import cors from "cors";
import MongoStore from "connect-mongo";
import session from "express-session";

import connectDB from "./config/db.js";
import AuthRouter from "./routes/AuthRoutes.js";
import ThumbnailRouter from "./routes/ThumbnailRouter.js";
import UserRouter from "./routes/UserRoutes.js";

const app = express();

const port = Number(process.env.PORT) || 3000;

await connectDB();

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://localhost:3000",
            "https://thumblify-client-tawny.vercel.app"
        ],
        credentials: true
    })
);

app.set("trust proxy", 1);

app.use(
    session({
        secret: process.env.SESSION_SECRET as string,
        resave: false,
        saveUninitialized: false,

        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production"
                    ? "none"
                    : "lax",
            path: "/"
        },

        store: MongoStore.create({
            mongoUrl: process.env.MONGODB_URI as string,
            collectionName: "sessions"
        })
    })
);

app.use(express.json());

app.use("/api/auth", AuthRouter);
app.use("/api/thumbnail", ThumbnailRouter);
app.use("/api/user", UserRouter);

app.get("/", (req: Request, res: Response) => {
    res.send("Server is Live!");
});

const server = app.listen(
    port,
    "127.0.0.1",
    () => {
        console.log(
            `Server is running at http://127.0.0.1:${port}`
        );
    }
);

server.on("error", (error) => {
    console.error("SERVER ERROR:", error);
});