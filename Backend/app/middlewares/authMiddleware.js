import jwt from "jsonwebtoken";

const authMiddleware = async (req, res, next) => {
  try {
    // Extracting the token from cookies
    const token = req.cookies?.token;

    // Checking if the token is not present
    if (!token) {
      return res.status(401).json({
        message: "User is not authenticated",
        success: false,
      });
    }

    // Verifying and decoding the token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // If decoding fails
    if (!decoded) {
      return res.status(401).json({
        message: "Invalid token",
        success: false,
      });
    }

    // Assigning the decoded userId to req.id. this is used to get the logged in user id when they are verified logged in user
    req.id = decoded.userId;

    // Proceed to the next middleware
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

export default authMiddleware

//next step: we need to use this middleware on routes to authenticate the user

