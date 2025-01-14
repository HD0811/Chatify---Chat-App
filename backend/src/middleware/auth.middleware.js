import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    // token is deconstructed from req.cookie.jwt (Because our secret key names as JWT)
    const token = req.cookies.jwt;

    // If token can't be fetched (Unauthorized access)
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized - No Token Provided" });
    }

    // Decoding token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Decode = false ()
    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    // All if condition is passed
    const user = await User.findById(decoded.userId).select("-password");

    // user not founded
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Till here user is authenticated
    req.user = user;

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
