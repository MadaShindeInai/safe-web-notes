import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-[90vh] items-center justify-center">
      <SignIn />
    </div>
  );
}
