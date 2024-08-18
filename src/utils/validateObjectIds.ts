import mongoose from "mongoose";

type ValidationResult = { failed: true; failedId: string } | { failed: false };

/**
 * Checks if all provided IDs are valid MongoDB ObjectIds.
 * @param {Array<string>} ids An array of ID strings to be validated.
 * @return {boolean}  Returns `true` if all IDs are valid ObjectIds, otherwise returns `false`.
 */
export default function validateObjectIds(
  ids: Array<string>
): ValidationResult {
  const invalidId = ids.find((id) => !mongoose.Types.ObjectId.isValid(id));

  if (invalidId) {
    return { failed: true, failedId: invalidId };
  }

  return { failed: false };
}
