/**
 * Generic Zod validation middleware factory.
 * Usage: router.post("/route", validate(myZodSchema), controller)
 */
export const validate = (schema, source = "body") => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return res.status(422).json({
      error: {
        message: "Validation failed",
        fields: result.error.flatten().fieldErrors
      }
    });
  }
  // Replace body/query with cleaned & coerced data from Zod
  req[source] = result.data;
  next();
};
