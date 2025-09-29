import { animate } from 'popmotion';

export interface AnimationCurve {
  name: string;
  easing: (t: number) => number;
}

export const AnimationCurves: Record<string, AnimationCurve> = {
  linear: { name: 'Linear', easing: t => t },
  easeInOut: { name: 'Ease In Out', easing: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t },
  easeIn: { name: 'Ease In', easing: t => t * t },
  easeOut: { name: 'Ease Out', easing: t => t * (2 - t) },
  bounce: {
    name: 'Bounce',
    easing: t => {
      if (t < 1/2.75) return 7.5625 * t * t;
      if (t < 2/2.75) return 7.5625 * (t -= 1.5/2.75) * t + 0.75;
      if (t < 2.5/2.75) return 7.5625 * (t -= 2.25/2.75) * t + 0.9375;
      return 7.5625 * (t -= 2.625/2.75) * t + 0.984375;
    }
  },
  elastic: {
    name: 'Elastic',
    easing: t => {
      if (t === 0) return 0;
      if (t === 1) return 1;
      const p = 0.3;
      const s = p / 4;
      return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1;
    }
  },
  back: {
    name: 'Back',
    easing: (t: number) => {
      const s = 1.70158;
      return t * t * ((s + 1) * t - s);
    }
  },
  circ: {
    name: 'Circular',
    easing: (t: number) => 1 - Math.sqrt(1 - t * t)
  },
  expo: {
    name: 'Exponential',
    easing: (t: number) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1))
  },
  quad: {
    name: 'Quadratic',
    easing: (t: number) => t * t
  }
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
  easing: (t: number) => number = t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
): () => void {
  const animation = animate({
    from,
    to,
    duration,
    ease: easing,
    onUpdate
  });
  
  return () => animation.stop();
}