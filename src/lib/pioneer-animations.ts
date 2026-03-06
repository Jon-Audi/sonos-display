// Pioneer OEL animations available for display mode.
// GIF files must be present in public/animations/ — copy from pioneer-gallery/public/animations/
// Run: cp -r ../pioneer-gallery/public/animations/* ./public/animations/

export interface PioneerAnim {
  id:     string
  name:   string
  file:   string
  width:  number
  height: number
}

// Procedural (audio-themed) + best grayscale animations
export const PIONEER_ANIMS: PioneerAnim[] = [
  { id: 'PROC_vumeter',      name: 'VU Meters',     file: 'PROC_vumeter.gif',      width: 248, height: 64 },
  { id: 'PROC_spectrum',     name: 'Spectrum',       file: 'PROC_spectrum.gif',     width: 248, height: 64 },
  { id: 'PROC_oscilloscope', name: 'Oscilloscope',   file: 'PROC_oscilloscope.gif', width: 248, height: 64 },
  { id: 'PROC_synthwave',    name: 'Synthwave',      file: 'PROC_synthwave.gif',    width: 248, height: 64 },
  { id: 'PROC_starwarp',     name: 'Star Warp',      file: 'PROC_starwarp.gif',     width: 248, height: 64 },
  { id: 'PROC_plasma',       name: 'Plasma',         file: 'PROC_plasma.gif',       width: 248, height: 64 },
  { id: 'PROC_matrix',       name: 'Matrix Rain',    file: 'PROC_matrix.gif',       width: 248, height: 64 },
  { id: 'PROC_scanner',      name: 'Scanner',        file: 'PROC_scanner.gif',      width: 248, height: 64 },
  { id: 'ANIM_00',           name: 'Dolphins',       file: 'ANIM_00.gif',           width: 248, height: 64 },
  { id: 'ANIM_01',           name: 'Airship',        file: 'ANIM_01.gif',           width: 248, height: 64 },
  { id: 'ANIM_06',           name: 'Metropolis',     file: 'ANIM_06.gif',           width: 248, height: 64 },
  { id: 'ANIM_02',           name: 'DragonRide',     file: 'ANIM_02.gif',           width: 248, height: 64 },
]
