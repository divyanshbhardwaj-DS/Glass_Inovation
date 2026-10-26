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
  try {
    // Extract metadata/audio sample or check audio properties
    const info = execSync(`ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,bit_rate,channels,sample_rate -of json "${f}"`, { encoding: 'utf8' });
    console.log(f, 'Audio stream info:', info.trim());
  } catch(e) {
    console.log(f, 'Error:', e.message);
  }
}
