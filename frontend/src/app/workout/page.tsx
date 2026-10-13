"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCamera } from "@/hooks/useCamera";
import { useWebSocket, type PoseMetrics } from "@/hooks/useWebSocket";
import { saveWorkout } from "@/lib/api";
import { type ExerciseType } from "@/lib/constants";
import CameraFeed from "@/components/workout/CameraFeed";
import ExerciseSelector from "@/components/workout/ExerciseSelector";
import LiveMetrics from "@/components/workout/LiveMetrics";
import CoachFeedback from "@/components/workout/CoachFeedback";

export default function WorkoutPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Settings
  const [exercise, setExercise] = useState<ExerciseType>("Squats");
  const [targetSets, setTargetSets] = useState(3);
  const [targetReps, setTargetReps] = useState(10);
  const [weight, setWeight] = useState(0);

  // Workout State
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);
  const [setDetails, setSetDetails] = useState<Array<{
    set_number: number;
    reps: number;
    form_score?: number;
  }>>([]);

  const [workoutStartTime, setWorkoutStartTime] = useState<number | null>(null);

  // Real-time data from WebSocket
  const [metrics, setMetrics] = useState<PoseMetrics>({});
  const [landmarks, setLandmarks] = useState<any[]>([]);
  const [connections, setConnections] = useState<[number, number][]>([]);
  const [poseDetected, setPoseDetected] = useState(false);

  // AI Coach Feedback
  const [feedbackText, setFeedbackText] = useState<string | null>(null);

  // Refs to avoid stale closures in the frame loop
  const isActiveRef = useRef(false);
  const cameraRef = useRef<ReturnType<typeof useCamera> | null>(null);
  const wsRef = useRef<ReturnType<typeof useWebSocket> | null>(null);

  // Hooks
  const camera = useCamera({ width: 640, height: 480, facingMode: "user" });
  const ws = useWebSocket({
    exercise,
    onData: (data) => {
      setMetrics(data.metrics);
      setLandmarks(data.landmarks);
      setConnections(data.connections);
      setPoseDetected(data.pose_detected);
    },
  });

  // Keep refs up to date
  cameraRef.current = camera;
  wsRef.current = ws;

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Frame streaming loop — uses refs to avoid stale closures
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isWorkoutActive) {
      isActiveRef.current = true;

      interval = setInterval(() => {
        const cam = cameraRef.current;
        const socket = wsRef.current;

        if (!cam?.isActive || !socket?.isConnected) return;

        const frame = cam.captureFrame();
        if (frame) {
          socket.sendFrame(frame, 640, 480);
        }
      }, 100); // 10 fps
    } else {
      isActiveRef.current = false;
    }

    return () => clearInterval(interval);
  }, [isWorkoutActive]);

  const startWorkout = async () => {
    await camera.start();
    ws.connect();
    setIsWorkoutActive(true);
    setWorkoutStartTime(Date.now());
    setCurrentSet(1);
    setSetDetails([]);
    setMetrics({});
    setFeedbackText("Workout started! Get into position and begin your reps.");
  };

  const endSet = () => {
    const repsCompleted = metrics.reps || 0;

    const currentSetData = {
      set_number: currentSet,
      reps: repsCompleted,
      form_score: 80, // default score
    };

    const newDetails = [...setDetails, currentSetData];
    setSetDetails(newDetails);

    if (currentSet >= targetSets) {
      // Workout Complete
      finishWorkout(newDetails);
    } else {
      // Next Set — reset the backend detector's rep count
      ws.resetReps();
      setCurrentSet((c) => c + 1);
      setFeedbackText(`Set ${currentSet} done! Rest up, then start set ${currentSet + 1}.`);
    }
  };

  const finishWorkout = async (finalSets = setDetails) => {
    if (!user || !workoutStartTime) return;

    setIsWorkoutActive(false);
    camera.stop();
    ws.disconnect();

    const durationSeconds = Math.floor((Date.now() - workoutStartTime) / 1000);
    const totalReps = finalSets.reduce((sum, s) => sum + s.reps, 0);

    const avgFormScore =
      finalSets.length > 0
        ? Math.round(
            finalSets.reduce((sum, s) => sum + (s.form_score || 0), 0) / finalSets.length
          )
        : undefined;

    try {
      await saveWorkout({
        user_id: user.user_id,
        exercise_name: exercise,
        total_reps: totalReps,
        total_sets: finalSets.length,
        weight,
        duration_seconds: durationSeconds,
        form_score: avgFormScore,
        set_details: finalSets,
      });

      setFeedbackText(null);
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to save workout", err);
      alert("Failed to save workout data. Check if the backend is running.");
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 pb-12">
      <header className="mb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Workout Studio</h1>
          <p className="text-[var(--color-text-muted)] mt-1">Real-time form tracking</p>
        </div>

        {isWorkoutActive ? (
          <div className="flex gap-3">
            <button
              onClick={endSet}
              className="bg-[var(--color-accent-amber)] hover:bg-[var(--color-accent-amber)]/80 text-black px-6 py-2 rounded-lg font-bold transition-colors"
            >
              {currentSet >= targetSets ? "Finish Workout" : `Complete Set ${currentSet}`}
            </button>
            <button
              onClick={() => finishWorkout()}
              className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={startWorkout}
            className="bg-[var(--color-accent-green)] hover:bg-[var(--color-accent-green)]/80 text-black px-8 py-2 rounded-lg font-bold shadow-lg shadow-[var(--color-accent-green)]/20 transition-all"
          >
            Start Tracking
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Settings & Metrics */}
        <div className="lg:col-span-3 space-y-6 flex flex-col h-full">
          {!isWorkoutActive ? (
            <ExerciseSelector
              selected={exercise}
              targetSets={targetSets}
              targetReps={targetReps}
              weight={weight}
              onExerciseChange={setExercise}
              onSetsChange={setTargetSets}
              onRepsChange={setTargetReps}
              onWeightChange={setWeight}
            />
          ) : (
            <>
              <LiveMetrics
                exercise={exercise}
                metrics={metrics}
                targetReps={targetReps}
                currentSet={currentSet}
                targetSets={targetSets}
              />
              <div className="flex-1 min-h-[200px]">
                <CoachFeedback feedbackText={feedbackText} audioUrl={null} />
              </div>
            </>
          )}
        </div>

        {/* Right Side - Camera Feed */}
        <div className="lg:col-span-9">
          <CameraFeed
            videoRef={camera.videoRef}
            canvasRef={camera.canvasRef}
            isActive={isWorkoutActive}
            landmarks={landmarks}
            connections={connections}
            poseDetected={poseDetected}
          />

          {/* Connection status bar */}
          {isWorkoutActive && (
            <div className="mt-3 flex items-center gap-4 text-xs text-[var(--color-text-dimmed)]">
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${ws.isConnected ? "bg-[var(--color-accent-green)]" : "bg-[var(--color-accent-red)]"}`} />
                {ws.isConnected ? "Server connected" : "Connecting..."}
              </span>
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${camera.isActive ? "bg-[var(--color-accent-green)]" : "bg-[var(--color-accent-red)]"}`} />
                {camera.isActive ? "Camera active" : "Camera off"}
              </span>
              {ws.error && (
                <span className="text-[var(--color-accent-red)]">{ws.error}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
