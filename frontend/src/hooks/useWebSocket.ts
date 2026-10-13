"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { API } from "@/lib/constants";

export interface PoseMetrics {
  reps?: number;
  knee_angle?: number;
  back_angle?: number;
  elbow_angle?: number;
  front_knee_angle?: number;
  torso_angle?: number;
  depth_status?: string;
  body_alignment?: string;
  hip_status?: string;
  shoulder_status?: string;
  swing_status?: string;
  extension_status?: string;
  back_arch_status?: string;
  balance_status?: string;
  pose_detected?: boolean;
}

export interface LandmarkPoint {
  id: number;
  x: number;
  y: number;
  visibility: number;
}

interface PoseData {
  metrics: PoseMetrics;
  landmarks: LandmarkPoint[];
  connections: [number, number][];
  pose_detected: boolean;
}

interface UseWebSocketOptions {
  exercise: string;
  onData?: (data: PoseData) => void;
}

export function useWebSocket({ exercise, onData }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use refs to avoid stale closures — this is the key fix
  const exerciseRef = useRef(exercise);
  const onDataRef = useRef(onData);

  exerciseRef.current = exercise;
  onDataRef.current = onData;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(API.WS_POSE);

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Skip control responses
          if (data.type === "reset_ok" || data.type === "exercise_changed") return;
          if (data.error) {
            console.warn("WS error:", data.error);
            return;
          }
          onDataRef.current?.(data as PoseData);
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log("WebSocket disconnected");
      };

      ws.onerror = () => {
        setError("WebSocket connection failed. Is the backend running?");
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch {
      setError("Could not connect to server");
    }
  }, []); // No deps — uses refs internally

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  const sendFrame = useCallback(
    (frameBase64: string, width: number, height: number) => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) return;

      wsRef.current.send(
        JSON.stringify({
          frame: frameBase64,
          exercise: exerciseRef.current,
          width,
          height,
        })
      );
    },
    []
  );

  /**
   * Send a reset command to the backend to zero out rep count.
   * Call this between sets.
   */
  const resetReps = useCallback(() => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "reset" }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return { connect, disconnect, sendFrame, resetReps, isConnected, error };
}
