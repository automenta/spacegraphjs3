import { describe, expect, it, vi } from 'vitest';
import { SpaceGraph } from '../../src/core/SpaceGraph';

const error = new Error('Test rendering error');
const mockRenderer = {
  render: vi.fn().mockImplementation(() => {
    throw error;
  }),
  setSize: vi.fn(),
  domElement: document.createElement('canvas'),
};

vi.mock('three', async () => {
  const actual = await vi.importActual('three');
  return {
    ...actual,
    WebGLRenderer: vi.fn().mockImplementation(() => mockRenderer),
  };
});

describe('RenderingManager Error Handling', () => {
  it('should catch rendering errors and display an error message', async () => {
    // Mock console.error for this specific test
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    // Mock requestAnimationFrame
    const requestAnimationFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb) => {
        // Allow the animation frame to run once to catch the error
        setTimeout(() => cb(0), 0);
        return 0;
      });

    // Create a container element
    const container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Initialize SpaceGraph
    new SpaceGraph('#test-container', {
      data: {
        nodes: [{ id: '1' }],
        edges: [],
      },
    });

    // Wait for the error to be displayed
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that the error message is displayed
    const errorElement = container.querySelector('div');
    expect(errorElement).not.toBeNull();
    expect(errorElement?.style.color).toBe('red');
    expect(errorElement?.textContent).toContain('Something went wrong');
    expect(errorElement?.textContent).toContain(error.message);

    // Check that the render method was called
    expect(mockRenderer.render).toHaveBeenCalled();

    // Clean up
    document.body.removeChild(container);
    requestAnimationFrame.mockRestore();
    consoleError.mockRestore();
  });
});
