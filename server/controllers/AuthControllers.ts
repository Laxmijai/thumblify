import { Request, Response } from "express";
import User from "../models/Users.js";
import bcrypt from "bcrypt";

export const registerUser = async (
    req: Request,
    res: Response
) => {
    try {
        const { name, email, password } = req.body;

        const user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(
            password,
            salt
        );

        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();

        req.session.isLoggedIn = true;
        req.session.userId = newUser._id;

        console.log("REGISTER SESSION");
        console.log("Session ID:", req.sessionID);
        console.log("User ID:", req.session.userId);

        req.session.save((error) => {
            if (error) {
                console.error(
                    "SESSION SAVE ERROR:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Failed to create login session"
                });
            }

            console.log(
                "REGISTER SESSION SAVED SUCCESSFULLY"
            );

            return res.json({
                message:
                    "Account created successfully",
                user: {
                    _id: newUser._id,
                    name: newUser.name,
                    email: newUser.email
                }
            });
        });

    } catch (error: any) {
        console.error("REGISTER ERROR:", error);

        return res.status(500).json({
            message: error.message
        });
    }
};

export const loginUser = async (
    req: Request,
    res: Response
) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const isPasswordCorrect =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        req.session.isLoggedIn = true;
        req.session.userId = user._id;

        console.log("LOGIN SESSION");
        console.log("Session ID:", req.sessionID);
        console.log("User ID:", req.session.userId);
        console.log(
            "Is Logged In:",
            req.session.isLoggedIn
        );

        req.session.save((error) => {
            if (error) {
                console.error(
                    "SESSION SAVE ERROR:",
                    error
                );

                return res.status(500).json({
                    message:
                        "Failed to create login session"
                });
            }

            console.log(
                "LOGIN SESSION SAVED SUCCESSFULLY"
            );

            console.log(
                "Session ID:",
                req.sessionID
            );

            console.log(
                "User ID:",
                req.session.userId
            );

            return res.json({
                message: "Login successful",
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email
                }
            });
        });

    } catch (error: any) {
        console.error("LOGIN ERROR:", error);

        return res.status(500).json({
            message: error.message
        });
    }
};

export const logoutUser = async (
    req: Request,
    res: Response
) => {
    try {
        console.log(
            "LOGOUT SESSION ID:",
            req.sessionID
        );

        req.session.destroy((error) => {
            if (error) {
                console.error(
                    "LOGOUT SESSION ERROR:",
                    error
                );

                return res.status(500).json({
                    message: error.message
                });
            }

            console.log(
                "SESSION DESTROYED SUCCESSFULLY"
            );

            return res.json({
                message: "Logout successful"
            });
        });

    } catch (error: any) {
        console.error("LOGOUT ERROR:", error);

        return res.status(500).json({
            message: error.message
        });
    }
};

export const verifyUser = async (
    req: Request,
    res: Response
) => {
    try {
        console.log("VERIFY REQUEST");
        console.log(
            "Session ID:",
            req.sessionID
        );
        console.log(
            "Session:",
            req.session
        );
        console.log(
            "User ID:",
            req.session.userId
        );

        const { userId } = req.session;

        if (!userId) {
            return res.status(401).json({
                message: "Not authenticated"
            });
        }

        const user =
            await User
                .findById(userId)
                .select("-password");

        if (!user) {
            return res.status(401).json({
                message: "Invalid user"
            });
        }

        return res.json({
            user
        });

    } catch (error: any) {
        console.error(
            "VERIFY ERROR:",
            error
        );

        return res.status(500).json({
            message: error.message
        });
    }
};