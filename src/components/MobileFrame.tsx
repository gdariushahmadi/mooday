"use client";

import React, { useEffect, useState } from "react";

interface MobileFrameProps {
  src: string;
  width?: number;
  height?: number;
  title?: string;
}

/**
 * MobileFrame
 * ------------
 * Renders an iframe at a fixed mobile width (default 390px) inside a
 * phone-shaped container. The wrapper uses CSS `transform: scale` to
 * fit any available width, while the iframe itself always renders at
 * the real phone width — this guarantees the inner app sees a 390px
 * viewport and Tailwind mobile breakpoints behave correctly.
 *
 * Designed for use inside the showcase document, NOT for in-app use.
 * For the in-app `?mobile=1` mode, see `useForcedMobile`.
 */
export const MobileFrame: React.FC<MobileFrameProps> = ({
  src,
  width = 390,
  height = 844,
  title = "Mooday preview",
}) => {
  const [scale, setScale] = useState(1);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const el = wrapperRef.current;
    const update = () => {
      const available = el.clientWidth;
      if (available > 0 && width > 0) {
        setScale(Math.min(1, available / width));
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);

  const scaledHeight = height * scale;

  return (
    <div
      ref={wrapperRef}
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        position: "relative",
        height: `${scaledHeight}px`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: "top center",
          width: `${width}px`,
          background: "#1b1c1b",
          borderRadius: "44px",
          padding: "12px",
          boxShadow:
            "0 30px 60px rgba(0,0,0,0.35), 0 8px 20px rgba(0,0,0,0.25), inset 0 0 0 2px #2a2826",
        }}
      >
        {/* iPhone notch — counter-scale so it stays the same physical size */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "50%",
            transform: `translateX(-50%) scale(${1 / scale})`,
            transformOrigin: "top center",
            width: width > 400 ? "130px" : "110px",
            height: "28px",
            background: "#1b1c1b",
            borderRadius: "0 0 18px 18px",
            zIndex: 50,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            width: "100%",
            height: `${height}px`,
            borderRadius: "32px",
            overflow: "hidden",
            background: "#fbf9f7",
          }}
        >
          <iframe
            src={src}
            title={title}
            style={{
              width: "100%",
              height: "100%",
              border: 0,
              display: "block",
            }}
          />
        </div>
      </div>
    </div>
  );
};
