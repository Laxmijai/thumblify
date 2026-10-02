import { Request, Response, NextFunction } from 'express';

const protect = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.log("========== PROTECT ==========");
    console.log("Session ID:", req.sessionID);
    console.log("Session:", req.session);
    console.log("isLoggedIn:", req.session.isLoggedIn);
    console.log("userId:", req.session.userId);
    console.log("Cookie:", req.headers.cookie);

    const { isLoggedIn, userId } = req.session;

    if (!isLoggedIn || !userId) {
        console.log("PROTECT: UNAUTHORIZED");

        return res.status(401).json({
            message: 'You are not logged in'
        });
    }

    console.log("PROTECT: AUTHORIZED");

    next();
};

export default protect;