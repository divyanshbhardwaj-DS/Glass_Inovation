import React, { useState, useRef, useEffect, useCallback } from 'react';
import type {
  HookahConfig,
  InteractionState,
  HandTrackingResult,
  FaceTrackingResult,
  Point2D,
} from '../types';
import { visionManager } from '../vision/visionManager';
import { PointSmoother } from '../vision/smoothing';
import { GestureDetector } from '../vision/gestureDetector';
import { soundManager } from '../effects/soundSystem';
import { HookahModel } from './HookahModel';
import { HookahPipe } from './HookahPipe';
import { SmokeCanvas, type SmokeCanvasHandle } from './SmokeCanvas';
import { InstructionOverlay } from './InstructionOverlay';
import { StatusIndicator } from './StatusIndicator';
import { ControlPanel } from './ControlPanel';
import { DebugOverlay } from './DebugOverlay';
import { HookahSelection } from './HookahSelection';
import { Loader2 } from 'lucide-react';
import { INTERACTION_CONFIG } from '../config/thresholds';

interface ExperienceProps {
  initialHookah: HookahConfig;
  initialStream?: MediaStream | null;
  useSimulationOnInit?: boolean;
  onExit: () => void;
}

export const Experience: React.FC<ExperienceProps> = ({
  initialHookah,
  initialStream,
  useSimulationOnInit = false,
  onExit,
}) => {
  const [currentHookah, setCurrentHookah] = useState<HookahConfig>(initialHookah);
  const [state, setState] = useState<InteractionState>(
    useSimulationOnInit ? 'READY_TO_GRAB' : 'TRACKING_INITIALIZING'
  );
  const [loadingText, setLoadingText] = useState('Initializing Computer Vision...');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDebugVisible, setIsDebugVisible] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(useSimulationOnInit);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  // HUD detection state
  const [isHandDetected, setIsHandDetected] = useState(false);
  const [isFaceDetected, setIsFaceDetected] = useState(false);

  // Viewport
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Camera
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(initialStream || null);

  // Smoke canvas
  const smokeRef = useRef<SmokeCanvasHandle>(null);

  // Vision - use refs to avoid recreating
  const pipeSmoother = useRef(new PointSmoother(INTERACTION_CONFIG.smoothingFactor));
  const gestureDetector = useRef(new GestureDetector());

  // Tracking data lives in refs (zero-cost per-frame updates)
  const handRef = useRef<HandTrackingResult | null>(null);
  const faceRef = useRef<FaceTrackingResult | null>(null);
  const stateRef = useRef<InteractionState>(useSimulationOnInit ? 'READY_TO_GRAB' : 'TRACKING_INITIALIZING');

  // Pipe position
  const DEFAULT_PIPE = { x: 0.74, y: 0.62 };
  const pipeScreenRef = useRef<Point2D>({
    x: window.innerWidth * DEFAULT_PIPE.x,
    y: window.innerHeight * DEFAULT_PIPE.y,
  });
  const pipeAngleRef = useRef<number>(0.25);
  const [pipeScreen, setPipeScreen] = useState<Point2D>(pipeScreenRef.current);
  const [pipeAngle, setPipeAngle] = useState<number>(0.25);

  const isGrabbedRef = useRef(false);
  const isDraggingRef = useRef(false);

  // Hookah hose outlet (bottom right)
  const hookahOutletRef = useRef<Point2D>({
    x: window.innerWidth * 0.85,
    y: window.innerHeight * 0.80,
  });

  // Keep stateRef in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Resize handler
  useEffect(() => {
    const update = () => {
      const w = containerRef.current?.clientWidth || window.innerWidth;
      const h = containerRef.current?.clientHeight || window.innerHeight;
      setDimensions({ width: w, height: h });
      hookahOutletRef.current = { x: w * 0.85, y: h * 0.80 };
    };
    window.addEventListener('resize', update);
    update();
    return () => window.removeEventListener('resize', update);
  }, []);

  // Ambient audio
  useEffect(() => {
    soundManager.startAmbientPad();
    return () => {
      soundManager.stopAmbientPad();
      soundManager.stopBubbling();
    };
  }, []);

  // Camera + vision initialization
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      let stream = streamRef.current;

      // If not simulation and no stream yet, request camera
      if (!useSimulationOnInit && !stream) {
        try {
          setLoadingText('Connecting to webcam...');
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          });
          streamRef.current = stream;
        } catch (err) {
          console.warn('Camera unavailable, switching to simulation mode:', err);
          if (!cancelled) {
            setIsSimulationMode(true);
            setState('READY_TO_GRAB');
            stateRef.current = 'READY_TO_GRAB';
          }
          return;
        }
      }

      // Attach stream to video element
      if (stream && videoRef.current && !cancelled) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;

        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => resolve();
          // In case metadata fires before we set handler
          if (video.readyState >= 1) resolve();
        });

        try {
          await video.play();
          if (!cancelled) setIsCameraActive(true);
        } catch (e) {
          console.warn('Video play error:', e);
        }
      }

      if (useSimulationOnInit) {
        if (!cancelled) {
          setState('READY_TO_GRAB');
          stateRef.current = 'READY_TO_GRAB';
        }
        return;
      }

      // Initialize vision models
      if (!cancelled) {
        setLoadingText('Loading AI hand & face tracking models...');
        const ok = await visionManager.initialize((msg) => {
          if (!cancelled) setLoadingText(msg);
        });
        if (!cancelled) {
          if (ok) {
            setState('READY_TO_GRAB');
            stateRef.current = 'READY_TO_GRAB';
          } else {
            setIsSimulationMode(true);
            setState('READY_TO_GRAB');
            stateRef.current = 'READY_TO_GRAB';
          }
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      if (streamRef.current && !initialStream) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ──────────────── STATE TRANSITION HANDLER ────────────────
  const handleStateTransition = useCallback((newState: InteractionState) => {
    setState((prev) => {
      if (prev === newState) return prev;

      if (newState === 'PIPE_GRABBED') {
        soundManager.playGrab();
        isGrabbedRef.current = true;
      } else if (newState === 'INHALING') {
        soundManager.startBubbling();
      } else if (newState === 'INHALED' || newState === 'EXHALE_READY') {
        soundManager.stopBubbling();
      } else if (newState === 'SMOKE_ACTIVE') {
        soundManager.stopBubbling();
        soundManager.playExhale();
      } else if (newState === 'READY_TO_GRAB') {
        isGrabbedRef.current = false;
      }

      stateRef.current = newState;
      return newState;
    });
  }, []);

  // ──────────────── BLOW / SMOKE TRIGGER ────────────────
  const handleBlowTriggered = useCallback((mouthPos: Point2D) => {
    if (smokeRef.current) {
      const w = containerRef.current?.clientWidth || window.innerWidth;
      const h = containerRef.current?.clientHeight || window.innerHeight;
      smokeRef.current.emit(mouthPos.x * w, mouthPos.y * h, 10);
    }
  }, []);

  // ──────────────── MAIN CV + PHYSICS LOOP ────────────────
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      animId = requestAnimationFrame(loop);

      const deltaMs = Math.min(80, now - lastTime);
      lastTime = now;

      const w = containerRef.current?.clientWidth || window.innerWidth;
      const h = containerRef.current?.clientHeight || window.innerHeight;
      const simMode = isSimulationMode;
      const curState = stateRef.current;

      // ── Run Vision ──
      const video = videoRef.current;
      if (video && !simMode && video.readyState >= 2 && video.videoWidth > 0) {
        const result = visionManager.processVideoFrame(video, now);
        handRef.current = result.hand;
        faceRef.current = result.face;

        const handNow = !!(result.hand && result.hand.handDetected);
        const faceNow = !!(result.face && result.face.faceDetected);
        setIsHandDetected(handNow);
        setIsFaceDetected(faceNow);
      }

      const hand = handRef.current;
      const face = faceRef.current;

      // ── Pipe grab point in normalized space ──
      const normPipe: Point2D = {
        x: pipeScreenRef.current.x / w,
        y: pipeScreenRef.current.y / h,
      };

      // ── Pipe mouthpiece tip in normalized space (above handle center) ──
      const angle = pipeAngleRef.current;
      const pipeTipNorm: Point2D = {
        x: normPipe.x + (Math.sin(angle) * 50) / w,
        y: normPipe.y - (Math.cos(angle) * 50) / h,
      };

      // ── Update pipe position if grabbed ──
      if (isGrabbedRef.current && hand && hand.handDetected && !simMode) {
        const smoothed = pipeSmoother.current.update({ x: hand.x, y: hand.y });

        // Tilt pipe toward mouth when face detected
        let targetAngle = 0.25;
        if (face && face.faceDetected) {
          const dx = face.mouthX - smoothed.x;
          const dy = face.mouthY - smoothed.y;
          targetAngle = Math.atan2(dx, -dy) * 0.6;
        }

        pipeScreenRef.current = { x: smoothed.x * w, y: smoothed.y * h };
        pipeAngleRef.current = pipeAngleRef.current + (targetAngle - pipeAngleRef.current) * 0.15;

        setPipeScreen({ x: pipeScreenRef.current.x, y: pipeScreenRef.current.y });
        setPipeAngle(pipeAngleRef.current);
      } else if (!isGrabbedRef.current && !isDraggingRef.current) {
        // Return to rest position
        const targetX = w * DEFAULT_PIPE.x;
        const targetY = h * DEFAULT_PIPE.y;
        const lf = 0.10;
        const nx = pipeScreenRef.current.x + (targetX - pipeScreenRef.current.x) * lf;
        const ny = pipeScreenRef.current.y + (targetY - pipeScreenRef.current.y) * lf;
        pipeScreenRef.current = { x: nx, y: ny };
        pipeAngleRef.current = pipeAngleRef.current + (0.25 - pipeAngleRef.current) * 0.08;

        setPipeScreen({ x: nx, y: ny });
        setPipeAngle(pipeAngleRef.current);

        pipeSmoother.current.reset({ x: DEFAULT_PIPE.x, y: DEFAULT_PIPE.y });
      }

      // ── Run Gesture Detector ──
      gestureDetector.current.update(
        curState,
        hand,
        face,
        normPipe,
        pipeTipNorm,
        deltaMs,
        handleStateTransition,
        handleBlowTriggered
      );
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isSimulationMode, handleStateTransition, handleBlowTriggered]);

  // ──────────────── POINTER / MOUSE SIMULATION ────────────────
  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dist = Math.hypot(x - pipeScreenRef.current.x, y - pipeScreenRef.current.y);

    if (dist < 90) {
      isDraggingRef.current = true;
      isGrabbedRef.current = true;
      handleStateTransition('PIPE_GRABBED');
      // Simulate hand
      handRef.current = {
        handDetected: true,
        x: x / rect.width,
        y: y / rect.height,
        confidence: 1,
        indexFinger: { x: x / rect.width, y: y / rect.height },
        palm: { x: x / rect.width, y: y / rect.height },
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.max(50, Math.min(rect.width - 50, e.clientX - rect.left));
    const y = Math.max(50, Math.min(rect.height - 50, e.clientY - rect.top));

    pipeScreenRef.current = { x, y };
    setPipeScreen({ x, y });

    const normX = x / rect.width;
    const normY = y / rect.height;

    // Simulated face mouth center
    const simMouthX = 0.5;
    const simMouthY = 0.3;

    handRef.current = {
      handDetected: true,
      x: normX,
      y: normY,
      confidence: 1,
      indexFinger: { x: normX, y: normY },
      palm: { x: normX, y: normY },
    };

    faceRef.current = {
      faceDetected: true,
      mouthX: simMouthX,
      mouthY: simMouthY,
      mouthWidth: 0.09,
      mouthHeight: 0.04,
      mouthAspectRatio: 0.44,
      // In exhale_ready state, simulate blow
      puckerScore: stateRef.current === 'EXHALE_READY' ? 0.9 : 0.05,
    };

    setIsHandDetected(true);
    setIsFaceDetected(true);

    // Tilt pipe toward mouth
    const dx = simMouthX - normX;
    const dy = simMouthY - normY;
    pipeAngleRef.current = Math.atan2(dx, -dy) * 0.6;
    setPipeAngle(pipeAngleRef.current);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // ──────────────── KEYBOARD SHORTCUTS ────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'r': handleReset(); break;
        case 'm': setIsMuted(soundManager.toggleMute()); break;
        case 'f': handleToggleFullscreen(); break;
        case 'd': setIsDebugVisible(prev => !prev); break;
        case 's': setIsSimulationMode(prev => !prev); break;
        case 'escape': onExit(); break;
        case ' ':
          e.preventDefault();
          if (stateRef.current === 'EXHALE_READY') {
            const mouthPos: Point2D = { x: 0.5, y: 0.3 };
            handleBlowTriggered(mouthPos);
            handleStateTransition('SMOKE_ACTIVE');
          }
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onExit, handleBlowTriggered, handleStateTransition]);

  const handleReset = () => {
    gestureDetector.current.reset();
    isGrabbedRef.current = false;
    isDraggingRef.current = false;
    soundManager.stopBubbling();
    smokeRef.current?.clear();
    setState('READY_TO_GRAB');
    stateRef.current = 'READY_TO_GRAB';
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="relative w-screen h-screen bg-[#05070d] overflow-hidden select-none touch-none"
      style={{ cursor: isDraggingRef.current ? 'grabbing' : 'default' }}
    >
      {/* ─── 1. CAMERA FEED ─── */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 z-0 ${
          isCameraActive ? 'opacity-90 -scale-x-100' : 'opacity-0'
        }`}
      />

      {/* ─── 2. DARK LOUNGE BACKDROP (when camera is off/simulation) ─── */}
      {(!isCameraActive || isSimulationMode) && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#060c1e] via-[#050811] to-[#020307] z-0">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:28px_28px]" />

          {/* Mouth target indicator for simulation */}
          <div className="absolute pointer-events-none"
            style={{ left: '50%', top: '30%', transform: 'translate(-50%, -50%)' }}>
            <div className="flex flex-col items-center gap-1">
              <div className="w-28 h-36 rounded-full border-2 border-dashed border-cyan-400/50 flex items-end justify-center pb-3">
                <span className="text-[10px] text-cyan-300 tracking-widest uppercase font-semibold">Mouth</span>
              </div>
              <div className="w-44 h-20 rounded-t-full border-2 border-dashed border-cyan-400/25" />
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. CV DEBUG OVERLAY ─── */}
      {isDebugVisible && (
        <DebugOverlay
          hand={handRef.current}
          face={faceRef.current}
          pipeGrabPoint={{ x: pipeScreen.x / dimensions.width, y: pipeScreen.y / dimensions.height }}
          pipeTipPoint={{
            x: (pipeScreen.x + Math.sin(pipeAngle) * 50) / dimensions.width,
            y: (pipeScreen.y - Math.cos(pipeAngle) * 50) / dimensions.height,
          }}
          width={dimensions.width}
          height={dimensions.height}
        />
      )}

      {/* ─── 4. HOOKAH MODEL (anchored bottom-right) ─── */}
      <div className="absolute bottom-4 right-6 sm:right-14 z-10 pointer-events-none">
        <HookahModel
          config={currentHookah}
          isBubbling={state === 'INHALING'}
          isInhaling={state === 'INHALING'}
        />
      </div>

      {/* ─── 5. FLEXIBLE HOSE + PIPE HANDLE ─── */}
      <HookahPipe
        pipePos={pipeScreen}
        hoseOrigin={hookahOutletRef.current}
        angle={pipeAngle}
        isGrabbed={isGrabbedRef.current}
        isNearMouth={state === 'PIPE_NEAR_MOUTH' || state === 'INHALING'}
        isInhaling={state === 'INHALING'}
        config={currentHookah}
      />

      {/* ─── 6. SMOKE PARTICLE CANVAS ─── */}
      <SmokeCanvas
        ref={smokeRef}
        config={currentHookah}
        width={dimensions.width}
        height={dimensions.height}
      />

      {/* ─── 7. INSTRUCTION HUD ─── */}
      <InstructionOverlay
        state={state}
        isHandDetected={isHandDetected}
        isFaceDetected={isFaceDetected}
      />

      {/* ─── 8. STATUS BAR ─── */}
      <StatusIndicator
        state={state}
        isCameraActive={isCameraActive}
        isHandDetected={isHandDetected}
        isFaceDetected={isFaceDetected}
        isSimulationMode={isSimulationMode}
      />

      {/* ─── 9. CONTROL PANEL ─── */}
      <ControlPanel
        currentHookah={currentHookah}
        isMuted={isMuted}
        isFullscreen={isFullscreen}
        isDebugVisible={isDebugVisible}
        isSimulationMode={isSimulationMode}
        onChangeHookah={() => setShowSwitchModal(true)}
        onReset={handleReset}
        onToggleMute={() => setIsMuted(soundManager.toggleMute())}
        onToggleFullscreen={handleToggleFullscreen}
        onToggleDebug={() => setIsDebugVisible(prev => !prev)}
        onToggleSimulation={() => setIsSimulationMode(prev => !prev)}
        onExit={onExit}
      />

      {/* ─── Simulation mode banner ─── */}
      {isSimulationMode && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs backdrop-blur-md whitespace-nowrap">
            💡 <b>Simulation:</b> Click &amp; drag pipe → mouth target. <b>Space</b> = Blow!
          </div>
        </div>
      )}

      {/* ─── LOADING OVERLAY ─── */}
      {state === 'TRACKING_INITIALIZING' && (
        <div className="absolute inset-0 bg-[#05070c]/92 backdrop-blur-lg z-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
            Loading Virtual Hookah Bar
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mb-8 animate-pulse leading-relaxed">
            {loadingText}
          </p>
          <button
            onClick={() => { setIsSimulationMode(true); setState('READY_TO_GRAB'); stateRef.current = 'READY_TO_GRAB'; }}
            className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 border border-white/10 transition-all"
          >
            Skip → Use Mouse Simulation Instead
          </button>
        </div>
      )}

      {/* ─── HOOKAH SWITCH MODAL ─── */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-lg flex items-center justify-center p-3">
          <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#090d18] border border-white/10">
            <HookahSelection
              selectedHookah={currentHookah}
              onSelect={(h) => setCurrentHookah(h)}
              onProceed={() => setShowSwitchModal(false)}
              onBack={() => setShowSwitchModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
