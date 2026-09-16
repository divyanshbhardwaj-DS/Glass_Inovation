import { useState } from 'react';
import type { HookahConfig } from './types';
import { HOOKAH_PRESETS } from './config/hookahs';
import { LandingPage } from './components/LandingPage';
import { HookahSelection } from './components/HookahSelection';
import { CameraPermission } from './components/CameraPermission';
import { Experience } from './components/Experience';

type AppScreen = 'LANDING' | 'HOOKAH_SELECTION' | 'CAMERA_PERMISSION' | 'EXPERIENCE';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('LANDING');
  const [selectedHookah, setSelectedHookah] = useState<HookahConfig>(HOOKAH_PRESETS[0]);
  const [useSimulation, setUseSimulation] = useState(false);

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const handleEnterFromLanding = () => {
    setCurrentScreen('HOOKAH_SELECTION');
  };

  const handleSimulateFromLanding = () => {
    setUseSimulation(true);
    setCurrentScreen('HOOKAH_SELECTION');
  };

  const handleProceedFromHookahSelection = () => {
    if (useSimulation) {
      setCurrentScreen('EXPERIENCE');
    } else {
      setCurrentScreen('CAMERA_PERMISSION');
    }
  };

  const handleGrantPermission = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
    setCameraStream(stream);
    setUseSimulation(false);
    setCurrentScreen('EXPERIENCE');
  };

  const handleUseSimulationFromPermission = () => {
    setUseSimulation(true);
    setCurrentScreen('EXPERIENCE');
  };

  const handleExitExperience = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setCurrentScreen('LANDING');
    setUseSimulation(false);
  };

  return (
    <div className="w-full h-full min-h-screen bg-[#06080d] text-slate-100 font-sans">
      {currentScreen === 'LANDING' && (
        <LandingPage
          onEnter={handleEnterFromLanding}
          onSimulate={handleSimulateFromLanding}
        />
      )}

      {currentScreen === 'HOOKAH_SELECTION' && (
        <HookahSelection
          selectedHookah={selectedHookah}
          onSelect={(hookah) => setSelectedHookah(hookah)}
          onProceed={handleProceedFromHookahSelection}
          onBack={() => setCurrentScreen('LANDING')}
        />
      )}

      {currentScreen === 'CAMERA_PERMISSION' && (
        <CameraPermission
          selectedHookah={selectedHookah}
          onGrantPermission={handleGrantPermission}
          onUseSimulation={handleUseSimulationFromPermission}
          onBack={() => setCurrentScreen('HOOKAH_SELECTION')}
        />
      )}

      {currentScreen === 'EXPERIENCE' && (
        <Experience
          initialHookah={selectedHookah}
          initialStream={cameraStream}
          useSimulationOnInit={useSimulation}
          onExit={handleExitExperience}
        />
      )}
    </div>
  );
}

export default App;
