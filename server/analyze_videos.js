const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const videoPaths = [
  'vid.mp4',
  'vid1.mp4',
  'vid2.mp4',
  'media/work/frameless-sliding-door-demo.mp4',
  'media/work/frameless-sliding-walkthrough.mp4',
  'media/work/install-frameless-corner-screen.mp4',
  'media/work/install-patterned-shower.mp4',
  'media/work/sealing-frameless-walk-in.mp4',
  'media/work/walkthrough-patterned-shower.mp4',
  'imgsvideos/drive-download-20260818T003115Z-1-001/IMG_6309.MOV',
  'imgsvideos/drive-download-20260818T003115Z-1-001/IMG_6311.MOV',
  'imgsvideos/drive-download-20260818T003115Z-1-001/IMG_6373.MOV',
  'imgsvideos/drive-download-20260818T003115Z-1-001/IMG_6375.MOV',
  'imgsvideos/drive-download-20260818T003115Z-1-001/IMG_6379.MOV',
  'imgsvideos/drive-download-20260818T003115Z-1-001/IMG_6426.MOV',
  'imgsvideos/drive-download-20260818T003115Z-1-001/IMG_6508.MOV'
];

const results = [];

for (const rel of videoPaths) {
  const full = path.resolve(__dirname, '..', rel);
  if (!fs.existsSync(full)) {
    console.log('Missing:', rel);
    continue;
  }
  const stat = fs.statSync(full);
  const sizeMB = (stat.size / (1024 * 1024)).toFixed(2) + ' MB';

  // ffprobe
  let probeOut = '';
  try {
    probeOut = execSync(`ffprobe -v error -show_entries format=duration:stream=index,codec_type,codec_name,width,height,r_frame_rate,bit_rate,channels -of json "${full}"`, { encoding: 'utf8' });
  } catch (e) {
    probeOut = '{}';
  }
  const probe = JSON.parse(probeOut || '{}');
  const duration = probe.format && probe.format.duration ? parseFloat(probe.format.duration).toFixed(1) + 's' : 'N/A';
  const vStream = (probe.streams || []).find(s => s.codec_type === 'video');
  const aStream = (probe.streams || []).find(s => s.codec_type === 'audio');

  const resolution = vStream ? `${vStream.width}x${vStream.height}` : 'N/A';
  let fps = 'N/A';
  if (vStream && vStream.r_frame_rate) {
    const parts = vStream.r_frame_rate.split('/');
    if (parts.length === 2 && parseInt(parts[1]) > 0) {
      fps = (parseInt(parts[0]) / parseInt(parts[1])).toFixed(1);
    }
  }

  // volumedetect with -vn so we don't decode video frames
  let meanVol = 'N/A';
  let maxVol = 'N/A';
  let classification = 'NO AUDIO STREAM';

  if (aStream) {
    try {
      const volOut = execSync(`ffmpeg -vn -i "${full}" -af volumedetect -f null - 2>&1`, { encoding: 'utf8' });
      const meanMatch = volOut.match(/mean_volume:\s*([-\d.]+)\s*dB/);
      const maxMatch = volOut.match(/max_volume:\s*([-\d.]+)\s*dB/);
      if (meanMatch) meanVol = meanMatch[1] + ' dB';
      if (maxMatch) maxVol = maxMatch[1] + ' dB';

      const meanNum = meanMatch ? parseFloat(meanMatch[1]) : -999;
      if (meanNum > -50) {
        classification = 'HAS AUDIO';
      } else {
        classification = 'SILENT TRACK';
      }
    } catch (e) {
      classification = 'AUDIO DETECT ERROR';
    }
  }

  const row = {
    file: rel,
    duration,
    resolution,
    fps,
    size: sizeMB,
    audio: classification,
    meanVol,
    maxVol,
    aCodec: aStream ? aStream.codec_name : 'none'
  };
  results.push(row);
  console.log(`Processed: ${rel} => ${classification} (mean: ${meanVol}, max: ${maxVol})`);
}

fs.writeFileSync(path.resolve(__dirname, 'video_analysis_output.json'), JSON.stringify(results, null, 2));
console.log('Wrote video_analysis_output.json');
