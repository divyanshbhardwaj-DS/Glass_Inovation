const { execSync } = require('child_process');
const fs = require('fs');

const files = [
  'vid.mp4',
  'imgsvideos/drive-download-20260818T003115Z-1-001/IMG_6309.MOV',
  'imgsvideos/drive-download-20260818T003115Z-1-001/IMG_6311.MOV',
  'imgsvideos/drive-download-20260818T003115Z-1-001/IMG_6373.MOV',
  'imgsvideos/drive-download-20260818T003115Z-1-001/IMG_6375.MOV',
  'imgsvideos/drive-download-20260818T003115Z-1-001/IMG_6379.MOV',
  'imgsvideos/drive-download-20260818T003115Z-1-001/IMG_6426.MOV',
  'imgsvideos/drive-download-20260818T003115Z-1-001/IMG_6508.MOV'
];

for (const f of files) {
  // Check astats or bandpass filter for speech frequencies (300Hz-3400Hz)
  try {
    const stats = execSync(`ffmpeg -vn -i "${f}" -af "astats=metadata=1:reset=1" -f null - 2>&1`, { encoding: 'utf8' });
    const dynMatch = stats.match(/Dynamic range:\s*([-\d.]+)\s*dB/);
    console.log(f, 'Dynamic range:', dynMatch ? dynMatch[1] : 'N/A');
  } catch(e) {
    console.log(f, 'Error astats:', e.message);
  }
}
