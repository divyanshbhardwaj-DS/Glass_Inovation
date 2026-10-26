const fs = require('fs');

async function downloadAndSave() {
  // Use direct Unsplash CDN URL pattern - these are the known photo IDs
  // Photo: black-metal-framed-glass-top-table-3dEh2OsJrLk by Point3D Commercial Imaging
  // Unsplash CDN image URL format: images.unsplash.com/photo-{timestamp}-{hash}
  // The photo slug 3dEh2OsJrLk maps to known CDN ID: photo-1556742049-0cfed4f6a45d
  
  const candidates = [
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1200&q=80&auto=format&fit=crop', // glass dining table
    'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=1200&q=80&auto=format&fit=crop', // glass table interior
    'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1200&q=80&auto=format&fit=crop', // glass table
    'https://images.unsplash.com/photo-1617817546260-4dae3e2c4f2d?w=1200&q=80&auto=format&fit=crop', // glass coffee table
  ];
  
  for (let i = 0; i < candidates.length; i++) {
    const url = candidates[i];
    const res = await fetch(url);
    if (res.ok) {
      const ct = res.headers.get('content-type');
      const buf = Buffer.from(await res.arrayBuffer());
      const outPath = `server/data/tabletop-candidate-${i}.jpg`;
      fs.writeFileSync(outPath, buf);
      console.log(`Saved ${i}: ${url.split('?')[0].split('/').pop()} (${buf.length} bytes, ${ct})`);
    } else {
      console.log(`Failed ${i}: ${res.status} ${url}`);
    }
  }
}

downloadAndSave().catch(e => console.error(e));
