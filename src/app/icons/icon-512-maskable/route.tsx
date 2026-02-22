import { ImageResponse } from "next/og";

export const runtime = "edge";

// Maskable icon: icon must fill the entire canvas.
// Safe zone is the inner 80%, so we add ~10% padding on each side.
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
            fontSize: 154,
            fontWeight: 700,
            letterSpacing: "-5px",
          }}
        >
          LH
        </span>
      </div>
    ),
    { width: size, height: size },
  );
}
