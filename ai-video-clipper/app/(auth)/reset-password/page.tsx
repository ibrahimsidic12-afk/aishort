export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col items-center">
      <h1 className="mb-2 text-2xl font-bold">Reset password</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Enter your new password below.
      </p>
      <form className="w-full space-y-4">
        <div>
          <label htmlFor="password" className="text-sm font-medium">
            New Password
          </label>
          <input
            id="password"
            type="password"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="text-sm font-medium">
            Confirm Password
          </label>
          <input
            id="confirm"
            type="password"
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Reset Password
        </button>
      </form>
    </div>
  );
}
