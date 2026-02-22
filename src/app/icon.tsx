import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "#EAB308",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            color: "black",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "-0.5px",
          }}
        >
          LH
        </span>
      </div>
    ),
    { ...size },
  );
}
