/**
 * Y2K Digital Synth Aesthetic - Shared Node Styles
 * Inspired by: Emulator X3, Virtual Piano Keyboard, Leopard print, Y2K vaporwave
 */

// Base metallic chrome gradient
export const chromeGradient = `
  linear-gradient(145deg,
    rgba(255,255,255,0.9) 0%,
    rgba(230,230,240,0.8) 25%,
    rgba(180,190,210,0.7) 50%,
    rgba(150,160,180,0.8) 75%,
    rgba(200,210,230,0.9) 100%
  )
`;

// Blue metallic gradient (Emulator X3 style)
export const blueMetallicGradient = `
  linear-gradient(135deg,
    #1e3a8a 0%,
    #2563eb 25%,
    #3b82f6 50%,
    #1e40af 75%,
    #1e3a8a 100%
  )
`;

// Purple vaporwave gradient
export const vaporwaveGradient = `
  linear-gradient(135deg,
    #ec4899 0%,
    #a855f7 33%,
    #3b82f6 66%,
    #06b6d4 100%
  )
`;

// Leopard print data URL (small tileable pattern)
export const leopardPrintOverlay = `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='leopard' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Crect width='60' height='60' fill='%23D2691E'/%3E%3Cellipse cx='15' cy='15' rx='8' ry='6' fill='%23000' opacity='0.5'/%3E%3Cellipse cx='45' cy='20' rx='7' ry='9' fill='%23000' opacity='0.4'/%3E%3Cellipse cx='25' cy='40' rx='9' ry='7' fill='%23000' opacity='0.45'/%3E%3Cellipse cx='50' cy='45' rx='6' ry='8' fill='%23000' opacity='0.5'/%3E%3Cellipse cx='10' cy='50' rx='8' ry='6' fill='%23000' opacity='0.4'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='60' height='60' fill='url(%23leopard)'/%3E%3C/svg%3E")`;

// Grid pattern overlay (digital synth style)
export const gridPattern = `
  repeating-linear-gradient(
    0deg,
    rgba(255,255,255,0.03) 0px,
    transparent 1px,
    transparent 4px,
    rgba(255,255,255,0.03) 5px
  ),
  repeating-linear-gradient(
    90deg,
    rgba(255,255,255,0.03) 0px,
    transparent 1px,
    transparent 4px,
    rgba(255,255,255,0.03) 5px
  )
`;

// Glossy plastic button style
export const glossyPlasticStyle = {
  background: `
    linear-gradient(180deg,
      rgba(255,255,255,0.4) 0%,
      rgba(255,255,255,0.1) 40%,
      rgba(0,0,0,0.1) 60%,
      rgba(0,0,0,0.3) 100%
    )
  `,
  boxShadow: `
    0 2px 4px rgba(0,0,0,0.3),
    inset 0 1px 0 rgba(255,255,255,0.5),
    inset 0 -1px 0 rgba(0,0,0,0.3)
  `
};

// Y2K Node Base Style Generator
export const getNodeBaseStyle = (primaryColor, accentColor, useGrid = true) => ({
  position: 'relative',
  background: `
    ${useGrid ? gridPattern + ',' : ''}
    linear-gradient(145deg,
      rgba(255,255,255,0.15) 0%,
      transparent 50%,
      rgba(0,0,0,0.2) 100%
    ),
    linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)
  `,
  border: '3px solid rgba(255, 255, 255, 0.3)',
  borderRadius: 12,
  padding: 20,
  minWidth: 260,
  color: '#fff',
  fontSize: '1em',
  fontFamily: '"Arial", "Helvetica", sans-serif',
  fontWeight: 'bold',
  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  boxShadow: `
    0 8px 32px rgba(0,0,0,0.4),
    0 4px 8px rgba(0,0,0,0.3),
    inset 0 1px 0 rgba(255,255,255,0.2),
    inset 0 -2px 0 rgba(0,0,0,0.2),
    inset 1px 0 0 rgba(255,255,255,0.1),
    inset -1px 0 0 rgba(0,0,0,0.1)
  `,
  backdropFilter: 'blur(10px)',
  overflow: 'visible'
});

// Handle style (connection points)
export const handleStyle = {
  background: 'linear-gradient(145deg, #ffffff, #c0c0c0)',
  width: 16,
  height: 16,
  border: '2px solid rgba(255, 255, 255, 0.8)',
  boxShadow: `
    0 2px 6px rgba(0,0,0,0.4),
    inset 0 1px 0 rgba(255,255,255,0.6),
    inset 0 -1px 0 rgba(0,0,0,0.3)
  `
};

// Title bar style (chrome effect)
export const titleBarStyle = {
  background: `
    linear-gradient(180deg,
      rgba(255,255,255,0.3) 0%,
      rgba(200,200,220,0.2) 50%,
      rgba(150,150,170,0.3) 100%
    )
  `,
  padding: '8px 12px',
  marginBottom: 12,
  borderRadius: 8,
  textAlign: 'center',
  fontSize: '1.1em',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  boxShadow: `
    0 2px 4px rgba(0,0,0,0.2),
    inset 0 1px 0 rgba(255,255,255,0.3)
  `,
  cursor: 'move'
};

// Slider/knob container style
export const controlContainerStyle = {
  background: 'rgba(0,0,0,0.2)',
  padding: '8px 12px',
  borderRadius: 6,
  marginBottom: 10,
  border: '1px solid rgba(0,0,0,0.3)',
  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
};

// Color palettes for different node types
export const nodeColors = {
  oscillator: {
    sine: { primary: '#4a9eff', accent: '#2563eb' },
    square: { primary: '#ff4a4a', accent: '#dc2626' },
    sawtooth: { primary: '#4aff4a', accent: '#16a34a' },
    triangle: { primary: '#ffff4a', accent: '#eab308' },
    pulse: { primary: '#ff9d4a', accent: '#ea580c' },
    noise: { primary: '#ff4aff', accent: '#c026d3' }
  },
  envelope: { primary: '#f093fb', accent: '#f5576c' },
  filter: { primary: '#ff9d4a', accent: '#ea580c' },
  reverb: { primary: '#a8edea', accent: '#4facfe' },
  delay: { primary: '#ffecd2', accent: '#fcb69f' },
  chorus: { primary: '#667eea', accent: '#764ba2' },
  distortion: { primary: '#ff512f', accent: '#dd2476' },
  output: { primary: '#ff4aff', accent: '#c026d3' },
  piano: { primary: '#3b82f6', accent: '#1e40af' },
  sequencer: { primary: '#06b6d4', accent: '#0891b2' }
};
