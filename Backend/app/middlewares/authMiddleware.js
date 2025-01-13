import jwt from "jsonwebtoken";

export const authMiddleware = async (req, res, next) => {
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

    // Assigning the decoded userId to req.id
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

