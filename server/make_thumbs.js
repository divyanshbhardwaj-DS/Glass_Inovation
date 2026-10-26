const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const thumbDir = path.resolve(__dirname, 'data', 'thumbs');
if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

const dir = path.resolve(__dirname, '..', 'imgsvideos', 'drive-download-20260818T003115Z-1-001');
const files = fs.readdirSync(dir).filter(f => /\.(png|heic|jpe?g)$/i.test(f));

for (const f of files) {
  const src = path.join(dir, f);
  const out = path.join(thumbDir, f.replace(/\.[^.]+$/, '.jpg'));
  if (!fs.existsSync(out)) {
    try {
      execSync(`ffmpeg -i "${src}" -vf "scale=400:-1" -q:v 3 "${out}" -y`, { stdio: 'ignore' });
      console.log('Thumbnail created for', f);
    } catch(e) {
      console.log('Failed for', f);
    }
  }
}
