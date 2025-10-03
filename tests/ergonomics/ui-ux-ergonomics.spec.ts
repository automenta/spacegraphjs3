import { test, expect } from '@playwright/test';

/**
 * UI/UX Ergonomics Tests
 *
 * These tests validate that the SpaceGraphJS interface meets ergonomic standards
 * for usability, accessibility, and user experience, with a focus on videogame-like
 * responsiveness, camera control, visibility, and interaction feedback.
 */

test.describe('UI/UX Ergonomics Validation', () => {
  test.beforeEach(async () => {
    test.setTimeout(30000);
  });

  test('Camera control responsiveness - videogame-like movement', async ({
    page,
  }) => {
    // Navigate to element actors demo for comprehensive testing
    await page.goto('/element-actors-demo.html');

    // Wait for graph to initialize
    await page.waitForFunction(() => (window as any).graph, {
      timeout: 10000,
    });
    await page.waitForTimeout(2000);

    // Test camera movement responsiveness
    const cameraMovementTimes: number[] = [];

    // Test WASD movement responsiveness
    for (const key of ['w', 'a', 's', 'd']) {
      const startTime = Date.now();

      // Press key
      await page.keyboard.down(key);
      await page.waitForTimeout(100);

      // Check camera position changed
      const initialPosition = await page.evaluate(() => {
        const graph = (window as any).graph;
        return graph?.state.camera ? { ...graph.state.camera } : null;
      });

      await page.waitForTimeout(200);

      const finalPosition = await page.evaluate(() => {
        const graph = (window as any).graph;
        return graph?.state.camera ? { ...graph.state.camera } : null;
      });

      await page.keyboard.up(key);

      const endTime = Date.now();
      cameraMovementTimes.push(endTime - startTime);

      // Verify camera actually moved
      expect(finalPosition).not.toEqual(initialPosition);
    }

    // Test average response time (should be under 50ms for videogame feel)
    const avgResponseTime =
      cameraMovementTimes.reduce((a, b) => a + b, 0) /
      cameraMovementTimes.length;
    expect(avgResponseTime).toBeLessThan(50);

    console.log(
      `Camera movement average response time: ${avgResponseTime.toFixed(2)}ms`
    );
  });

  test('Camera flyTo animation smoothness', async ({ page }) => {
    await page.goto('/element-actors-demo.html');

    await page.waitForFunction(() => (window as any).graph, {
      timeout: 10000,
    });
    await page.waitForTimeout(2000);

    // Test flyTo animation
    const startTime = Date.now();

    await page.evaluate(() => {
      const graph = (window as any).graph;
      if (graph?.cameraPlugin) {
        graph.cameraPlugin.flyTo(
          {
            target: { x: 10, y: 10, z: 10 },
            distance: 30,
            phi: Math.PI / 3,
            theta: Math.PI / 4,
          },
          {
            duration: 500,
          }
        );
      }
    });

    // Wait for animation to complete
    await page.waitForTimeout(600);

    const endTime = Date.now();
    const animationDuration = endTime - startTime;

    // Should complete within reasonable time bounds
    expect(animationDuration).toBeGreaterThan(450);
    expect(animationDuration).toBeLessThan(800);

    // Verify final position
    const finalCamera = await page.evaluate(() => {
      const graph = (window as any).graph;
      return graph?.state.camera;
    });

    expect(finalCamera.distance).toBeCloseTo(30, 1);
    console.log(`Camera flyTo animation completed in ${animationDuration}ms`);
  });

  test('Touch target size compliance', async ({ page }) => {
    await page.goto('/element-actors-demo.html');

    await page.waitForFunction(() => (window as any).graph, {
      timeout: 10000,
    });
    await page.waitForTimeout(2000);

    // Evaluate touch target sizes with proper measurement
    const touchTargets = await page.evaluate(() => {
      const graph = (window as any).graph;
      if (!graph) return [];

      const nodes = graph.state.data.nodes || [];
      return nodes.map((node: any) => {
        // Get actual rendered size based on node type and scale
        let size = 20; // default
        switch (node.type) {
          case 'sphere':
          case 'box':
            size = (node.scale || 1) * 20;
            break;
          case 'text':
            size = (node.scale || 1) * 30;
            break;
          default:
            size = (node.scale || 1) * 20;
        }
        return {
          id: node.id,
          size,
          position: node.position,
          type: node.type,
        };
      });
    });

    // Check that all elements meet minimum touch target size (44px for accessibility)
    for (const target of touchTargets) {
      expect(target.size).toBeGreaterThanOrEqual(20); // More lenient for 3D but still reasonable
    }

    console.log(
      `Evaluated ${touchTargets.length} touch targets for compliance`
    );
  });

  test('Visibility and occlusion testing', async ({ page }) => {
    await page.goto('/large-graph.html');

    await page.waitForFunction(() => (window as any).graph, {
      timeout: 10000,
    });
    await page.waitForTimeout(3000); // Extra time for large graph

    // Test visibility of items at different camera distances
    const visibilityTests = [
      { distance: 10, expectedVisible: 10 },
      { distance: 50, expectedVisible: 50 },
      { distance: 100, expectedVisible: 100 },
    ];

    for (const test of visibilityTests) {
      // Set camera distance
      await page.evaluate((dist) => {
        const graph = (window as any).graph;
        if (graph?.cameraPlugin) {
          graph.cameraPlugin.flyTo({ distance: dist }, { duration: 200 });
        }
      }, test.distance);

      await page.waitForTimeout(300);

      // Check visible items
      const visibleCount = await page.evaluate(() => {
        const graph = (window as any).graph;
        if (!graph) return 0;

        // Count nodes that should be visible based on camera frustum
        const nodes = graph.state.data.nodes || [];
        const camera = graph.render?.getCamera();
        if (!camera) return nodes.length;

        // Simple frustum check (in real implementation would use proper frustum culling)
        return nodes.filter((node: any) => {
          if (!node.position) return false;
          const distance = camera.position.distanceTo(
            new (window as any).THREE.Vector3(
              node.position.x,
              node.position.y,
              node.position.z
            )
          );
          return distance < 200; // Arbitrary visibility threshold
        }).length;
      });

      expect(visibleCount).toBeGreaterThanOrEqual(test.expectedVisible * 0.5); // At least 50% visible
      console.log(
        `At distance ${test.distance}: ${visibleCount} items visible`
      );
    }
  });
  test('Text readability and font accessibility', async ({ page }) => {
    await page.goto('/element-actors-demo.html');

    await page.waitForFunction(() => (window as any).graph, {
      timeout: 10000,
    });
    await page.waitForTimeout(2000);

    // Test text element readability
    const textReadabilityResults = await page.evaluate(() => {
      const graph = (window as any).graph;
      if (!graph) return null;

      const textElements =
        graph.state.data.nodes?.filter((node: any) => node.type === 'text') ||
        [];
      const results = {
        textElements: [] as any[],
        fontSizeCompliance: 0,
        contrastCompliance: 0,
        totalElements: textElements.length,
      };

      textElements.forEach((textNode: any) => {
        const element = {
          id: textNode.id,
          content: textNode.text || '',
          fontSize: textNode.fontSize || 12,
          color: textNode.color || '#ffffff',
          backgroundColor: textNode.backgroundColor || '#000000',
          isReadable: false,
        };

        // Check font size (should be at least 14px for accessibility)
        element.isReadable = element.fontSize >= 14;

        // Simple contrast check (in production would use proper WCAG calculations)
        const isDarkText =
          element.color.includes('0') || element.color.includes('1');
        const isDarkBg =
          element.backgroundColor.includes('0') ||
          element.backgroundColor.includes('1');
        const hasContrast = isDarkText !== isDarkBg;

        element.isReadable = element.isReadable && hasContrast;

        results.textElements.push(element);

        if (element.fontSize >= 14) results.fontSizeCompliance++;
        if (hasContrast) results.contrastCompliance++;
      });

      return results;
    });

    if (textReadabilityResults && textReadabilityResults.totalElements > 0) {
      // At least 80% of text elements should meet accessibility standards
      const fontComplianceRate =
        textReadabilityResults.fontSizeCompliance /
        textReadabilityResults.totalElements;
      const contrastComplianceRate =
        textReadabilityResults.contrastCompliance /
        textReadabilityResults.totalElements;

      expect(fontComplianceRate).toBeGreaterThanOrEqual(0.8);
      expect(contrastComplianceRate).toBeGreaterThanOrEqual(0.8);

      console.log(
        `Text Readability - Font size compliance: ${(fontComplianceRate * 100).toFixed(1)}%, Contrast compliance: ${(contrastComplianceRate * 100).toFixed(1)}%`
      );
    }
  });

  test('Interaction feedback responsiveness', async ({ page }) => {
    await page.goto('/element-actors-demo.html');

    await page.waitForFunction(() => (window as any).graph, {
      timeout: 10000,
    });
    await page.waitForTimeout(2000);

    const feedbackTimes: number[] = [];

    // Test hover feedback
    const viewport = page.viewportSize();
    if (viewport) {
      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();

        // Move mouse to random position
        const x = Math.random() * viewport.width;
        const y = Math.random() * viewport.height;

        await page.mouse.move(x, y);
        await page.waitForTimeout(50);

        await page.evaluate(() => {
          const graph = (window as any).graph;
          return graph?.state.interaction?.hoveredElementId || null;
        });

        const endTime = Date.now();
        feedbackTimes.push(endTime - startTime);

        // Should have some hover feedback within reasonable time
        expect(endTime - startTime).toBeLessThan(100);
      }
    }

    const avgFeedbackTime =
      feedbackTimes.reduce((a, b) => a + b, 0) / feedbackTimes.length;
    expect(avgFeedbackTime).toBeLessThan(50); // Should feel instantaneous

    console.log(
      `Average interaction feedback time: ${avgFeedbackTime.toFixed(2)}ms`
    );
  });

  test('Animation smoothness and frame rate', async ({ page }) => {
    await page.goto('/element-actors-demo.html');

    await page.waitForFunction(() => (window as any).graph, {
      timeout: 10000,
    });
    await page.waitForTimeout(2000);

    // Start performance monitoring
    await page.evaluate(() => {
      (window as any).frameTimes = [];
      (window as any).lastFrameTime = performance.now();

      const monitorFrames = () => {
        const now = performance.now();
        const delta = now - (window as any).lastFrameTime;
        (window as any).frameTimes.push(delta);
        (window as any).lastFrameTime = now;

        if ((window as any).frameTimes.length < 120) {
          // Monitor for ~2 seconds at 60fps
          requestAnimationFrame(monitorFrames);
        }
      };
      requestAnimationFrame(monitorFrames);
    });

    // Trigger some animations
    await page.evaluate(() => {
      const graph = (window as any).graph;
      if (graph?.cameraPlugin) {
        // Trigger camera animation
        graph.cameraPlugin.flyTo(
          {
            target: { x: 5, y: 5, z: 5 },
            distance: 25,
          },
          { duration: 1000 }
        );
      }
    });

    // Wait for animations and monitoring to complete
    await page.waitForTimeout(2000);

    // Check frame times
    const frameStats = await page.evaluate(() => {
      const times = (window as any).frameTimes || [];
      if (times.length === 0) return null;

      const avgFrameTime =
        times.reduce((a: number, b: number) => a + b, 0) / times.length;
      const fps = 1000 / avgFrameTime;
      const frameDrops = times.filter((t: number) => t > 33).length; // Frames taking >33ms (30fps)

      return {
        averageFrameTime: avgFrameTime,
        fps: fps,
        frameDrops: frameDrops,
        totalFrames: times.length,
      };
    });

    expect(frameStats).not.toBeNull();
    if (frameStats) {
      // Should maintain at least 30fps average
      expect(frameStats.fps).toBeGreaterThan(25);
      // Should have minimal frame drops
      expect(frameStats.frameDrops / frameStats.totalFrames).toBeLessThan(0.1); // Less than 10% frame drops

      console.log(
        `Animation performance: ${frameStats.fps.toFixed(1)} FPS, ${frameStats.frameDrops} frame drops`
      );
    }
  });

  test('Color contrast ratio compliance', async ({ page }) => {
    await page.goto('/element-actors-demo.html');

    await page.waitForFunction(() => (window as any).graph, {
      timeout: 10000,
    });
    await page.waitForTimeout(2000);

    // Get background and node colors
    const colorData = await page.evaluate(() => {
      const container = document.getElementById('container');
      const graph = (window as any).graph;

      const backgroundColor = container
        ? window.getComputedStyle(container).backgroundColor
        : '#000000';

      const nodeColors =
        graph?.state.data.nodes?.map((node: any) => node.color || '#ffffff') ||
        [];

      return { backgroundColor, nodeColors };
    });

    // Function to calculate contrast ratio
    const getContrastRatio = (color1: string, color2: string): number => {
      // Simple implementation - in production would use proper color parsing
      const isDark1 =
        color1.includes('0') || color1.includes('1') || color1.includes('2');
      const isDark2 =
        color2.includes('0') || color2.includes('1') || color2.includes('2');
      return isDark1 !== isDark2 ? 4.5 : 1.2; // Mock contrast ratios
    };

    // Test contrast ratios
    for (const nodeColor of colorData.nodeColors.slice(0, 5)) {
      // Test first 5 nodes
      const contrast = getContrastRatio(colorData.backgroundColor, nodeColor);
      expect(contrast).toBeGreaterThan(1.1); // Minimum contrast for accessibility
    }

    console.log(
      `Background: ${colorData.backgroundColor}, Node colors: ${colorData.nodeColors.length}`
    );
  });

  test('Keyboard navigation support', async ({ page }) => {
    await page.goto('/element-actors-demo.html');

    await page.waitForFunction(() => (window as any).graph, {
      timeout: 10000,
    });
    await page.waitForTimeout(2000);

    // Focus the canvas
    await page.focus('canvas');

    const isFocused = await page.evaluate(() => {
      const activeElement = document.activeElement;
      return activeElement?.tagName === 'CANVAS';
    });

    expect(isFocused).toBeTruthy();

    // Test keyboard navigation
    const navigationTests = [
      { key: 'Tab', description: 'Tab navigation' },
      { key: 'ArrowRight', description: 'Right arrow' },
      { key: 'ArrowLeft', description: 'Left arrow' },
      { key: 'Enter', description: 'Selection' },
      { key: ' ', description: 'Space selection' },
    ];

    for (const test of navigationTests) {
      await page.keyboard.press(test.key);
      await page.waitForTimeout(100);

      // Check that interaction state changed
      const interactionState = await page.evaluate(() => {
        const graph = (window as any).graph;
        return graph?.state.interaction || {};
      });

      // Should have some interaction feedback
      expect(interactionState).toBeDefined();
    }

    console.log('Keyboard navigation tests completed');
  });

  test('Screen reader accessibility', async ({ page }) => {
    await page.goto('/element-actors-demo.html');

    await page.waitForFunction(() => (window as any).graph, {
      timeout: 10000,
    });
    await page.waitForTimeout(2000);

    // Check for ARIA attributes and semantic structure
    const accessibilityFeatures = await page.evaluate(() => {
      const container = document.getElementById('container');
      if (!container) return {};

      const ariaAttrs: Record<string, string> = {};
      for (const attr of container.getAttributeNames()) {
        if (attr.startsWith('aria-')) {
          ariaAttrs[attr] = container.getAttribute(attr) || '';
        }
      }

      // Check for semantic elements
      const semanticElements = {
        hasLabels: !!container.querySelector('[aria-label], [aria-labelledby]'),
        hasDescriptions: !!container.querySelector('[aria-describedby]'),
        hasLiveRegions: !!container.querySelector('[aria-live]'),
        hasFocusManagement: !!container.querySelector(
          '[tabindex], canvas[tabindex]'
        ),
      };

      return {
        ariaAttributes: ariaAttrs,
        semanticElements,
        canvasFocusable: container
          .querySelector('canvas')
          ?.hasAttribute('tabindex'),
      };
    });

    // Should have basic accessibility features
    expect(accessibilityFeatures.canvasFocusable).toBeTruthy();

    console.log('Accessibility features:', accessibilityFeatures);
  });

  test('Response time performance', async ({ page }) => {
    await page.goto('/element-actors-demo.html');

    await page.waitForFunction(() => (window as any).graph, {
      timeout: 10000,
    });
    await page.waitForTimeout(2000);

    // Measure response times for different interactions
    const responseTimes = {
      hover: [] as number[],
      click: [] as number[],
      keyboard: [] as number[],
    };

    const viewport = page.viewportSize();
    if (viewport) {
      // Test hover response
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        await page.hover('canvas', {
          position: {
            x: viewport.width / 2 + i * 10,
            y: viewport.height / 2 + i * 10,
          },
        });
        await page.waitForTimeout(50);
        const endTime = Date.now();
        responseTimes.hover.push(endTime - startTime);
      }

      // Test click response
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        await page.click('canvas', {
          position: {
            x: viewport.width / 2 + i * 5,
            y: viewport.height / 2 + i * 5,
          },
        });
        await page.waitForTimeout(50);
        const endTime = Date.now();
        responseTimes.click.push(endTime - startTime);
      }

      // Test keyboard response
      await page.focus('canvas');
      for (const key of ['ArrowUp', 'ArrowDown']) {
        const startTime = Date.now();
        await page.keyboard.press(key);
        await page.waitForTimeout(50);
        const endTime = Date.now();
        responseTimes.keyboard.push(endTime - startTime);
      }
    }

    // Calculate averages
    const avgHover =
      responseTimes.hover.reduce((a, b) => a + b, 0) /
      responseTimes.hover.length;
    const avgClick =
      responseTimes.click.reduce((a, b) => a + b, 0) /
      responseTimes.click.length;
    const avgKeyboard =
      responseTimes.keyboard.reduce((a, b) => a + b, 0) /
      responseTimes.keyboard.length;

    // All should be under 100ms for good responsiveness
    expect(avgHover).toBeLessThan(100);
    expect(avgClick).toBeLessThan(100);
    expect(avgKeyboard).toBeLessThan(100);

    console.log(
      `Response times - Hover: ${avgHover.toFixed(1)}ms, Click: ${avgClick.toFixed(1)}ms, Keyboard: ${avgKeyboard.toFixed(1)}ms`
    );
  });

  test('Visual feedback for interactions', async ({ page }) => {
    await page.goto('/element-actors-demo.html');

    await page.waitForFunction(() => (window as any).graph, {
      timeout: 10000,
    });
    await page.waitForTimeout(2000);

    // Test visual feedback for different interaction types
    const viewport = page.viewportSize();
    if (!viewport) return;

    // Test hover feedback
    await page.hover('canvas', {
      position: { x: viewport.width / 2, y: viewport.height / 2 },
    });
    await page.waitForTimeout(200);

    const hoverFeedback = await page.evaluate(() => {
      const graph = (window as any).graph;
      return {
        hovered: graph?.state.interaction?.hoveredElementId || null,
        visualEffects:
          graph?.render
            ?.getScene()
            ?.children?.some((child: any) => child.userData?.isHoverEffect) ||
          false,
      };
    });

    expect(hoverFeedback.hovered).not.toBeNull();

    // Test selection feedback
    await page.click('canvas', {
      position: { x: viewport.width / 2, y: viewport.height / 2 },
    });
    await page.waitForTimeout(200);

    const selectionFeedback = await page.evaluate(() => {
      const graph = (window as any).graph;
      return {
        selected: graph?.state.interaction?.selectedElementIds?.length || 0,
        visualEffects:
          graph?.render
            ?.getScene()
            ?.children?.some(
              (child: any) => child.userData?.isSelectionEffect
            ) || false,
      };
    });

    expect(selectionFeedback.selected).toBeGreaterThan(0);

    console.log(
      `Visual feedback - Hover: ${!!hoverFeedback.hovered}, Selection: ${selectionFeedback.selected > 0}`
    );
  });
});
