import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center">
      <h1 className="mb-6 text-2xl font-bold">Welcome back</h1>
      <SignIn
        fallbackRedirectUrl="/dashboard"
        appearance={{
          elements: { rootBox: "w-full" },
        }}
      />
    </div>
  );
}
