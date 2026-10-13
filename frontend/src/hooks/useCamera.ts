"use client";

import { useRef, useCallback, useState } from "react";

interface UseCameraOptions {
  width?: number;
  height?: number;
  facingMode?: "user" | "environment";
}

export function useCamera(options: UseCameraOptions = {}) {
  const { width = 640, height = 480, facingMode = "user" } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width, height, facingMode },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Camera access denied. Please allow camera permissions."
      );
    }
  }, [width, height, facingMode]);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
  }, []);

  /**
   * Capture the current video frame as a base64-encoded JPEG string.
   * Returns just the base64 data (no data URL prefix).
   */
  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !isActive) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = video.videoWidth || width;
    canvas.height = video.videoHeight || height;

    // Mirror the frame (to match user-facing camera)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    // Convert to JPEG base64
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    return dataUrl.split(",")[1]; // Remove "data:image/jpeg;base64," prefix
  }, [isActive, width, height]);

  return {
    videoRef,
    canvasRef,
    start,
    stop,
    captureFrame,
    isActive,
    error,
    dimensions: { width, height },
  };
}
