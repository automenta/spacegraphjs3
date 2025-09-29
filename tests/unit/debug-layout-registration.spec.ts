import { describe, expect, it } from 'vitest';
import { SpaceGraph } from '../../src';

describe('Layout Registration Debug', () => {
  it('should have new layouts registered', () => {
    const registry = SpaceGraph.getLayoutEngineRegistry();
    
    console.log('Available layouts:', Array.from(registry.keys()));
    
    expect(registry.has('force-directed')).toBe(true);
    expect(registry.has('random')).toBe(true);
    expect(registry.has('circle')).toBe(true);
    expect(registry.has('column')).toBe(true);
    expect(registry.has('row')).toBe(true);
  });
});