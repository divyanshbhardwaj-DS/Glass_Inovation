// Verified, publicly accessible Unsplash CDN images (no local paths, no blobs).
// Each export is reused deliberately across sections rather than left as a dead asset.
const u = (id: string, w: number) =>
  `https://images.unsplash.com/${id}?q=80&w=${w}&auto=format&fit=crop`;

export const img = {
  heroPool: u('photo-1758448756167-88dc934c58e4', 1800),
  staircase: u('photo-1771904488645-fa6ebf7a2d06', 1200),
  shower: u('photo-1771929662486-f793e08f0f16', 1200),
  splashback: u('photo-1746439305879-74bb5db52ee2', 1200),
  poolBalustrade: u('photo-1635122212082-c4b6f108f36a', 1200),
  mirror: u('photo-1721394744838-c80ea8ee31c1', 1200),
  frostedScreen: u('photo-1747727968638-5aa093953d3d', 1200),
  commercial: u('photo-1745015446589-7ee6f702d8c1', 1200),
};
