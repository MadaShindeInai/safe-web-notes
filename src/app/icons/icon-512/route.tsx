import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: "#EAB308",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: 192,
            fontWeight: 700,
            letterSpacing: "-6px",
          }}
        >
          LH
        </span>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
