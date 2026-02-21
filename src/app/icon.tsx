import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FACC15",
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#000000",
          fontSize: 14,
          fontWeight: 900,
          lineHeight: 1,
          letterSpacing: "-0.5px",
        }}
      >
        LH
      </div>
    ),
    { ...size },
  );
}
