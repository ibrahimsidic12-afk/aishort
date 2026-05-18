import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center">
      <h1 className="mb-6 text-2xl font-bold">Create your account</h1>
      <SignUp
        fallbackRedirectUrl="/dashboard"
        appearance={{
          elements: { rootBox: "w-full" },
        }}
      />
    </div>
  );
}
