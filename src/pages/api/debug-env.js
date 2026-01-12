
export default function handler(req, res) {
    res.status(200).json({
        message: "Environment Check",
        MONGODB_URI: process.env.MONGODB_URI ? "DEFINED" : "MISSING",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "DEFINED" : "MISSING",
        CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? "DEFINED" : "MISSING",
    });
}
