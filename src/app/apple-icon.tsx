import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "#EAB308",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "black",
            fontSize: 72,
            fontWeight: 700,
            letterSpacing: "-3px",
          }}
        >
          LH
        </span>
      </div>
    ),
    { ...size },
  );
}
