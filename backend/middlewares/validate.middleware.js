export const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body) //Zod validation
        next()
    } catch (err) {
        return res.status(200).json({
            success: false,
            errors: err.errors.map(e => e.message)
        });
    }
};