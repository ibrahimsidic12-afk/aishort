import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col items-center">
      <h1 className="mb-2 text-2xl font-bold">Forgot password?</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Enter your email to receive a reset link.
      </p>
      <form className="w-full space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Send Reset Link
        </button>
      </form>
      <Link href="/login" className="mt-4 text-sm text-primary hover:underline">
        Back to login
      </Link>
    </div>
  );
}
