// 404 for unknown API routes
export const notFound = (req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// central error handler — converts low-level errors into clean JSON responses
export const errorHandler = (err, req, res, next) => {
    let status = err.statusCode || 500;
    let message = err.message || "Internal server error";

    if (err.name === "CastError") {
        status = 400;
        message = "Invalid id format";
    } else if (err.name === "ValidationError") {
        status = 422;
        message = Object.values(err.errors).map((e) => e.message).join(", ");
    } else if (err.code === 11000) {
        status = 409;
        const field = Object.keys(err.keyValue || {})[0] || "value";
        message = `That ${field} is already in use`;
    } else if (err.name === "MulterError") {
        status = 400;
        message = err.code === "LIMIT_FILE_SIZE" ? "File too large (max 2 MB)" : "Upload failed";
    }

    if (status >= 500) {
        console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
    }

    res.status(status).json({ message });
};
