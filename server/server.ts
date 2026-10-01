
import express, { Request, Response } from 'express';
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import MongoStore from 'connect-mongo';
import session from 'express-session';
import AuthRouter from './routes/AuthRoutes.js';


dotenv.config();

await connectDB();
const app = express();

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000'
    ],
    credentials: true
}));

app.use(session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7
    }, // 7 days
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI as string,
        collectionName: 'sessions'
    })
}));




app.use(express.json());

app.use("/api/auth",AuthRouter);

const port = Number(process.env.PORT) || 3000;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

const server = app.listen(port, '127.0.0.1', () => {
    console.log(`Server is running at http://127.0.0.1:${port}`);
    console.log('Server address:', server.address());
});

server.on('error', (error) => {
    console.error('SERVER ERROR:', error);
});