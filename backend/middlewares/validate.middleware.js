export const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    console.log("result:", result);
    if (!result.success) {
        const issues = result.error.issues || result.error.errors || [];
        return res.status(400).json({
            success: false,
            message: issues.map(e => e.message).join(", ") || "Validation failed",
            errors: issues.map(e => e.message)
        });
    }

    // 🔥 CRITICAL LINE
    req.body = result.data;

    next();
};

export const validateQuery = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
        const issues = result.error.issues || result.error.errors || [];
        return res.status(400).json({
            success: false,
            message: issues.map(e => e.message).join(", ") || "Validation failed",
            errors: issues.map(e => e.message)
        });
    }

    req.validatedQuery = result.data;
    next();
};