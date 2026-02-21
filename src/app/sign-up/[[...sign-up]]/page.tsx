import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: "calc(100dvh - 70px)" }}>
      <SignUp />
    </div>
  );
}
