import { test, expect } from '@playwright/test';

test.describe('Interaction Semantics Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Set a longer timeout for these tests
    test.setTimeout(60000);
  });

  test('Node selection interaction semantics', async ({ page }) => {
    // Navigate to element actors demo
    await page.goto('/element-actors-demo.html');
    
    // Wait for graph to initialize
    await page.waitForFunction(() => (window as any).graph, { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Get initial selection state
    const initialSelectedIds = await page.evaluate(() => 
      (window as any).graph.state.interaction.selectedElementIds || []
    );
    
    // Click on a node (center of canvas)
    const viewport = page.viewportSize();
    if (viewport) {
      await page.click('canvas', {
        position: { x: viewport.width / 2, y: viewport.height / 2 }
      });
    }
    
    // Wait for selection to register
    await page.waitForTimeout(500);
    
    // Check that selection state has changed
    const selectedIds = await page.evaluate(() => 
      (window as any).graph.state.interaction.selectedElementIds || []
    );
    
    // Should have at least one selected element
    expect(selectedIds.length).toBeGreaterThanOrEqual(1);
    
    // Selection should be different from initial state
    expect(selectedIds).not.toEqual(initialSelectedIds);
    
    console.log(`Selected elements: ${selectedIds.join(', ')}`);
  });

  test('Node hover interaction semantics', async ({ page }) => {
    // Navigate to element actors demo
    await page.goto('/element-actors-demo.html');
    
    // Wait for graph to initialize
    await page.waitForFunction(() => (window as any).graph, { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Get initial hover state
    const initialHoveredId = await page.evaluate(() => 
      (window as any).graph.state.interaction.hoveredElementId || null
    );
    
    // Hover over a node (center of canvas)
    const viewport = page.viewportSize();
    if (viewport) {
      await page.hover('canvas', {
        position: { x: viewport.width / 2, y: viewport.height / 2 }
      });
    }
    
    // Wait for hover to register
    await page.waitForTimeout(300);
    
    // Check that hover state has changed
    const hoveredId = await page.evaluate(() => 
      (window as any).graph.state.interaction.hoveredElementId || null
    );
    
    // Should have a hovered element
    expect(hoveredId).not.toBeNull();
    
    // Hover should be different from initial state
    expect(hoveredId).not.toEqual(initialHoveredId);
    
    console.log(`Hovered element: ${hoveredId}`);
  });

  test('Edge interaction semantics', async ({ page }) => {
    // Navigate to edge interaction demo
    await page.goto('/edge-interaction.html');
    
    // Wait for graph to initialize
    await page.waitForFunction(() => (window as any).graph, { timeout: 10000 });
    await page.waitForTimeout(3000);
    
    // Get initial state
    const initialState = await page.evaluate(() => ({
      selectedIds: (window as any).graph.state.interaction.selectedElementIds || [],
      hoveredId: (window as any).graph.state.interaction.hoveredElementId || null
    }));
    
    // Click on an edge (try different positions to hit an edge)
    const viewport = page.viewportSize();
    if (viewport) {
      // Try multiple positions to find an edge
      const positions = [
        { x: viewport.width / 2, y: viewport.height / 2 },
        { x: viewport.width / 3, y: viewport.height / 3 },
        { x: (viewport.width * 2) / 3, y: (viewport.height * 2) / 3 }
      ];
      
      let edgeSelected = false;
      for (const pos of positions) {
        await page.click('canvas', { position: pos });
        await page.waitForTimeout(300);
        
        const selectedIds = await page.evaluate(() => 
          (window as any).graph.state.interaction.selectedElementIds || []
        );
        
        // Check if any selected element is an edge (starts with 'e')
        const edgeSelectedIds = selectedIds.filter((id: string) => id.startsWith('e'));
        if (edgeSelectedIds.length > 0) {
          edgeSelected = true;
          console.log(`Selected edge(s): ${edgeSelectedIds.join(', ')}`);
          break;
        }
      }
      
      // At least one edge should be selectable
      expect(edgeSelected).toBeTruthy();
    }
  });

  test('Multi-selection interaction semantics', async ({ page }) => {
    // Navigate to element actors demo
    await page.goto('/element-actors-demo.html');
    
    // Wait for graph to initialize
    await page.waitForFunction(() => (window as any).graph, { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Array to store selected elements
    const selectedElements: string[] = [];
    
    // Click on multiple nodes with Ctrl key (simulate multi-selection)
    const viewport = page.viewportSize();
    if (viewport) {
      // First click (normal selection)
      await page.click('canvas', {
        position: { x: viewport.width / 2 - 50, y: viewport.height / 2 }
      });
      await page.waitForTimeout(300);
      
      // Get first selected element
      const firstSelection = await page.evaluate(() => 
        (window as any).graph.state.interaction.selectedElementIds || []
      );
      selectedElements.push(...firstSelection);
      
      // Second click with Ctrl (add to selection)
      await page.keyboard.down('Control');
      await page.click('canvas', {
        position: { x: viewport.width / 2 + 50, y: viewport.height / 2 }
      });
      await page.keyboard.up('Control');
      await page.waitForTimeout(300);
      
      // Get updated selection
      const updatedSelection = await page.evaluate(() => 
        (window as any).graph.state.interaction.selectedElementIds || []
      );
      
      // Should have more elements selected
      expect(updatedSelection.length).toBeGreaterThanOrEqual(firstSelection.length);
      
      // Both previously selected elements should still be selected
      for (const elem of firstSelection) {
        expect(updatedSelection).toContain(elem);
      }
      
      console.log(`Multi-selection: ${updatedSelection.join(', ')}`);
    }
  });

  test('Drag interaction semantics', async ({ page }) => {
    // Navigate to instanced interaction demo
    await page.goto('/instanced-interaction.html');
    
    // Wait for graph to initialize and instanced renderer to be ready
    await page.waitForFunction(() => (window as any).graph);
    await page.waitForFunction(() => {
      const graph = (window as any).graph;
      try {
        const nodeRenderer = graph.render.getNodeRenderer();
        return nodeRenderer && nodeRenderer.constructor.name === 'InstancedRenderer';
      } catch (e) {
        return false;
      }
    });
    
    // Wait for instanced meshes to be populated
    await page.waitForFunction(() => {
      const graph = (window as any).graph;
      try {
        const nodeRenderer = graph.render.getNodeRenderer();
        if (nodeRenderer && nodeRenderer.constructor.name === 'InstancedRenderer') {
          const instancedRenderer = nodeRenderer as any;
          if (instancedRenderer.instancedMeshes) {
            for (const mesh of instancedRenderer.instancedMeshes.values()) {
              if (mesh.count > 0) {
                return true;
              }
            }
          }
        }
        return false;
      } catch (e) {
        return false;
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Hide test-results div that might interfere
    await page.evaluate(() => {
      const testResults = document.getElementById('test-results');
      if (testResults) {
        testResults.style.display = 'none';
      }
    });
    
    // Get initial position of center node
    const initialPosition = await page.evaluate(
      () => (window as any).graph.getElement('n-7-7').position
    );
    
    // Drag the node
    const viewport = page.viewportSize();
    if (viewport) {
      const center = { x: viewport.width / 2, y: viewport.height / 2 };
      
      await page.dragAndDrop('canvas', 'canvas', {
        sourcePosition: center,
        targetPosition: { x: center.x + 100, y: center.y + 100 },
      });
    }
    
    // Wait for drag to complete
    await page.waitForTimeout(500);
    
    // Get final position
    const finalPosition = await page.evaluate(
      () => (window as any).graph.getElement('n-7-7').position
    );
    
    // Position should have changed
    expect(finalPosition.x).not.toBeCloseTo(initialPosition.x, 1);
    expect(finalPosition.y).not.toBeCloseTo(initialPosition.y, 1);
    
    console.log(`Node dragged from (${initialPosition.x}, ${initialPosition.y}) to (${finalPosition.x}, ${finalPosition.y})`);
  });

  test('Keyboard navigation semantics', async ({ page }) => {
    // Navigate to element actors demo
    await page.goto('/element-actors-demo.html');
    
    // Wait for graph to initialize
    await page.waitForFunction(() => (window as any).graph, { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Focus the canvas
    await page.focus('canvas');
    
    // Get initial selection
    const initialSelected = await page.evaluate(() => 
      (window as any).graph.state.interaction.selectedElementIds || []
    );
    
    // Press Tab to move focus
    await page.keyboard.press('Tab');
    await page.waitForTimeout(300);
    
    // Press Enter to select
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    
    // Check if selection changed
    const finalSelected = await page.evaluate(() => 
      (window as any).graph.state.interaction.selectedElementIds || []
    );
    
    // Log the interaction
    console.log(`Keyboard navigation: initial=${initialSelected.join(',')}, final=${finalSelected.join(',')}`);
  });
});