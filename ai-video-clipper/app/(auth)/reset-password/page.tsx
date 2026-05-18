import { SignIn } from "@clerk/nextjs";

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Set new password</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Create a new password for your account
        </p>
      </div>
      <SignIn
        fallbackRedirectUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-none border-0 p-0 bg-transparent",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            formFieldLabel: "text-sm font-medium text-foreground",
            formFieldInput:
              "rounded-lg border-border bg-background h-11 text-sm focus:ring-2 focus:ring-ring/20 focus:border-primary transition-all",
            formButtonPrimary:
              "gradient-bg hover:brightness-110 rounded-lg h-11 font-medium text-sm shadow-glow transition-all",
            footerActionLink: "text-primary hover:text-primary/80 font-medium",
          },
        }}
      />
    </div>
  );
}
