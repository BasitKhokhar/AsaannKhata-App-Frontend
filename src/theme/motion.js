// Shared durations/spring configs consumed by src/components/motion/*
// primitives so every animated element in the app moves consistently.
export const motion = {
  duration: {
    fast: 180,
    base: 300,
    slow: 500,
    float: 3500,
    pulse: 2400,
    gradientShift: 6000,
    dotGlow: 1200,
    shimmer: 2200,
    breathe: 2800,
    countUp: 1200,
  },
  spring: {
    entrance: { damping: 16, stiffness: 140, mass: 0.9 },
    snappy: { damping: 18, stiffness: 220, mass: 0.7 },
  },
  stagger: 60, // ms delay per list-row index for StaggeredList
  easing: {
    standard: [0.4, 0.0, 0.2, 1],
  },
};
