export const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);
    console.log("result:", result)
    if (!result.success) {
        return res.status(400).json({
            success: false,
            errors: result.error.errors.map(e => e.message)
        });
    }

    // 🔥 CRITICAL LINE
    req.body = result.data;

    next();
};

export const validateQuery = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
        return res.status(400).json({
            errors: result.error.errors.map(e => e.message)
        });
    }

    req.validatedQuery = result.data;
    next();
};