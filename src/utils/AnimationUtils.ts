import { animate } from 'popmotion';
import { EasingFunctions } from './UnifiedAnimationSystem';

export interface AnimationCurve {
  name: string;
  easing: (t: number) => number;
}

export const AnimationCurves: Record<string, AnimationCurve> = {
  linear: { name: 'Linear', easing: EasingFunctions.linear },
  easeInOut: {
    name: 'Ease In Out',
    easing: EasingFunctions.easeInOut,
  },
  easeIn: { name: 'Ease In', easing: EasingFunctions.easeIn },
  easeOut: { name: 'Ease Out', easing: EasingFunctions.easeOut },
  bounce: {
    name: 'Bounce',
    easing: EasingFunctions.bounce,
  },
  elastic: {
    name: 'Elastic',
    easing: EasingFunctions.elastic,
  },
  back: {
    name: 'Back',
    easing: EasingFunctions.back,
  },
  circ: {
    name: 'Circular',
    easing: EasingFunctions.circ,
  },
  expo: {
    name: 'Exponential',
    easing: EasingFunctions.expo,
  },
  quad: {
    name: 'Quadratic',
    easing: EasingFunctions.quad,
  },
};

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
  easing: (t: number) => number = (t) =>
    t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
): () => void {
  const animation = animate({
    from,
    to,
    duration,
    ease: easing,
    onUpdate,
  });

  return () => animation.stop();
}
