/**
 * Standardized API error response format
 * All API routes should return errors in this shape
 */
export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Create a consistent error response
 */
export function apiError(
  message: string,
  status: number,
  code?: string,
  details?: Record<string, unknown>
): { body: ApiError; status: number } {
  return {
    body: { error: message, code, details },
    status,
  };
}

/**
 * Common error codes used across the app
 */
export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  DUPLICATE: "DUPLICATE",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  FORBIDDEN: "FORBIDDEN",
} as const;

/**
 * User-friendly error messages for common error codes
 */
export const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Please sign in to continue.",
  VALIDATION_ERROR: "The information provided is invalid. Please check and try again.",
  NOT_FOUND: "The requested resource was not found.",
  QUOTA_EXCEEDED: "You've reached your usage limit. Please upgrade your plan.",
  DUPLICATE: "This item already exists.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  INTERNAL_ERROR: "Something went wrong on our end. Please try again later.",
  INVALID_INPUT: "Invalid input provided.",
  FORBIDDEN: "You don't have permission to perform this action.",
};

/**
 * Parse an API response error into a user-friendly message
 */
export function parseApiError(data: unknown): string {
  if (!data || typeof data !== "object") {
    return "An unexpected error occurred.";
  }

  const err = data as Record<string, unknown>;

  // If there's an error message, use it directly
  if (typeof err.error === "string" && err.error) {
    return err.error;
  }

  // If there's an error code, map it to a friendly message
  if (typeof err.code === "string" && err.code in ERROR_MESSAGES) {
    return ERROR_MESSAGES[err.code];
  }

  return "An unexpected error occurred. Please try again.";
}
