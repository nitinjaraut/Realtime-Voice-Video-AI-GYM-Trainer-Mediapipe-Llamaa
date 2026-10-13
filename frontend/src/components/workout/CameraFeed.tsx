"use client";

import { useRef, useEffect, useCallback } from "react";
import type { LandmarkPoint } from "@/hooks/useWebSocket";

interface CameraFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  landmarks: LandmarkPoint[];
  connections: [number, number][];
  isActive: boolean;
  poseDetected: boolean;
}

const SKELETON_COLOR = "#00FF88";
const JOINT_COLOR = "#3B82F6";
const NO_POSE_COLOR = "#EF4444";

export default function CameraFeed({
  videoRef,
  canvasRef,
  landmarks,
  connections,
  isActive,
  poseDetected,
}: CameraFeedProps) {
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const drawOverlay = useCallback(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const video = videoRef.current;
    if (video) {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!isActive) return;

    if (landmarks.length > 0 && poseDetected) {
      // Build a quick lookup
      const pointMap = new Map<number, LandmarkPoint>();
      landmarks.forEach((p) => pointMap.set(p.id, p));

      // Draw connections
      ctx.strokeStyle = SKELETON_COLOR;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";

      for (const [start, end] of connections) {
        const p1 = pointMap.get(start);
        const p2 = pointMap.get(end);
        if (p1 && p2 && p1.visibility > 0.5 && p2.visibility > 0.5) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      // Draw joints
      for (const point of landmarks) {
        if (point.visibility > 0.5) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = JOINT_COLOR;
          ctx.fill();
          ctx.strokeStyle = "#0A0D14";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
    } else if (isActive && !poseDetected) {
      // No pose warning
      ctx.fillStyle = NO_POSE_COLOR;
      ctx.font = "bold 24px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("NO POSE DETECTED", canvas.width / 2, 40);
      ctx.font = "16px Inter, sans-serif";
      ctx.fillText("Please face the camera", canvas.width / 2, 70);
    }

    animFrameRef.current = requestAnimationFrame(drawOverlay);
  }, [landmarks, connections, isActive, poseDetected, videoRef]);

  useEffect(() => {
    if (isActive) {
      animFrameRef.current = requestAnimationFrame(drawOverlay);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isActive, drawOverlay]);

  return (
    <div className="relative w-full aspect-video bg-black/50 rounded-2xl overflow-hidden glass-card">
      {/* Hidden video element */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: "scaleX(-1)" }}
        playsInline
        muted
      />

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Overlay canvas for skeleton */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ transform: "scaleX(-1)" }}
      />

      {/* Camera off state */}
      {!isActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl mb-4 animate-float">📷</span>
          <p className="text-[var(--color-text-muted)] text-lg">
            Camera is off
          </p>
          <p className="text-[var(--color-text-dimmed)] text-sm mt-1">
            Start a workout to activate
          </p>
        </div>
      )}

      {/* Status indicator */}
      {isActive && (
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full animate-pulse-glow ${
              poseDetected ? "bg-[var(--color-accent-green)]" : "bg-[var(--color-accent-red)]"
            }`}
          />
          <span className="text-xs font-medium text-white/80">
            {poseDetected ? "TRACKING" : "NO POSE"}
          </span>
        </div>
      )}
    </div>
  );
}
