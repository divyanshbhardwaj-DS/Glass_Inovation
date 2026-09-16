import React, { useState } from 'react';
import { Camera, Shield, Lock, AlertCircle, RefreshCw, MousePointer } from 'lucide-react';
import type { HookahConfig } from '../types';

interface CameraPermissionProps {
  selectedHookah: HookahConfig;
  onGrantPermission: () => Promise<void>;
  onUseSimulation: () => void;
  onBack: () => void;
}

export const CameraPermission: React.FC<CameraPermissionProps> = ({
  selectedHookah,
  onGrantPermission,
  onUseSimulation,
  onBack,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEnableCamera = async () => {
    setIsRequesting(true);
    setErrorMsg(null);
    try {
      await onGrantPermission();
    } catch (err: unknown) {
      console.error('Camera request error:', err);
      const error = err as Error;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setErrorMsg('Camera permission was denied. Please allow camera access in your browser settings.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setErrorMsg('No camera was detected on this device. You can still test with Simulation Mode.');
      } else {
        setErrorMsg(error.message || 'Unable to access camera. Please check your browser permissions.');
      }
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-6 py-10 bg-[#05070c]">
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full filter blur-[130px] pointer-events-none opacity-40"
        style={{ backgroundColor: selectedHookah.accentColor }}
      />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-lg glass-panel p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl flex flex-col items-center text-center">
        {/* Camera Icon Header */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-inner shadow-amber-500/20">
          <Camera className="w-8 h-8" />
        </div>

        <span className="text-xs uppercase tracking-widest font-semibold text-amber-400 mb-2">
          Interactive Computer Vision
        </span>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
          Camera Access Required
        </h1>

        <p className="text-sm text-slate-300 leading-relaxed mb-6">
          To interact with the virtual hookah, your webcam tracks your hand gestures and facial movements in real time.
        </p>

        {/* Privacy Notice Box */}
        <div className="w-full p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-left flex items-start gap-3 mb-6">
          <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-emerald-300 block mb-0.5">
              100% Client-Side Privacy Guarantee
            </span>
            <span className="text-slate-400 leading-normal">
              All hand and facial landmark processing executes locally in your browser memory. No camera feed or biometric data is ever recorded, stored, or sent to any server.
            </span>
          </div>
        </div>

        {/* Error Alert if any */}
        {errorMsg && (
          <div className="w-full p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 mb-6 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={handleEnableCamera}
            disabled={isRequesting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60"
          >
            {isRequesting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Requesting Access...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>ENABLE WEBCAM</span>
              </>
            )}
          </button>

          <button
            onClick={onUseSimulation}
            className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-medium text-xs border border-white/10 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <MousePointer className="w-3.5 h-3.5 text-cyan-400" />
            <span>Try with Mouse / Touch Simulation</span>
          </button>

          <button
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-white pt-2 transition-colors"
          >
            ← Back to Hookah Selection
          </button>
        </div>

        {/* Subtle security badge */}
        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-6">
          <Lock className="w-3 h-3 text-slate-500" />
          <span>Encrypted Local WebAssembly Runtime</span>
        </div>
      </div>
    </div>
  );
};
