import jwt from "jsonwebtoken";
import errorHandler from "./error.js";
import User from "../models/user.model.js";

const verifyUser = async (req, res, next) => {
    try {
        const token = req.cookies.access_token;
        if (!token) return next(errorHandler(401, "Unauthorized"));

        const verified = jwt.verify(token, process.env.JWT_SECRET);
        if (!verified)
            return next(errorHandler(401, "Unauthorized - Invalid Token"));

        const user = await User.findById(verified.id).select("-password");
        if (!user) {
            return next(errorHandler(404, "User not found"));
        }

        req.user = user;
        next();
    } catch (error) {
        next(errorHandler(500, "Internal server error"));
    }
};

export default verifyUser;