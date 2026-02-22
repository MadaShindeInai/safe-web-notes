import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  const size = 512;

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: "#EAB308",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "black",
            fontSize: 192,
            fontWeight: 700,
            letterSpacing: "-6px",
          }}
        >
          LH
        </span>
      </div>
    ),
    { width: size, height: size },
  );
}
