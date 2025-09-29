import { animate } from 'popmotion';

export interface AnimationCurve {
  name: string;
  easing: (t: number) => number;
}

export const AnimationCurves: Record<string, AnimationCurve>;

/**
 * Animate a property value with easing
 * @param from - Starting value
 * @param to - Target value
 * @param duration - Animation duration in ms
 * @param onUpdate - Callback for each animation frame
 * @param easing - Easing function
 * @returns A function to stop the animation
 */
export function animateProperty(
  from: number,
  to: number,
  duration: number,
  onUpdate: (value: number) => void,
  easing?: (t: number) => number
): () => void;