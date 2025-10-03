import { NodeSpec, EdgeSpec, GroupSpec } from '../types';

/**
 * Validation error with detailed information
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  suggestion?: string;
}

/**
 * Result of spec validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validates a complete Spec object with detailed error messages
 */
export function validateSpec(spec: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!spec || typeof spec !== 'object') {
    errors.push({
      field: 'spec',
      message: 'Spec must be a non-null object',
      value: spec,
      suggestion:
        'Provide a valid Spec object with data, style, layout, camera, controls, performance, and interaction properties',
    });
    return { isValid: false, errors, warnings };
  }

  // Validate data structure
  validateDataStructure(spec, errors, warnings);

  // Validate style structure
  validateStyleStructure(spec, errors, warnings);

  // Validate layout structure
  validateLayoutStructure(spec, errors, warnings);

  // Validate camera structure
  validateCameraStructure(spec, errors, warnings);

  // Validate controls structure
  validateControlsStructure(spec, errors, warnings);

  // Validate performance structure
  validatePerformanceStructure(spec, errors, warnings);

  // Validate interaction structure
  validateInteractionStructure(spec, errors, warnings);

  // Validate HUD structure if present
  if (spec.hud) {
    validateHUDStructure(spec, errors, warnings);
  }

  // Cross-reference validation
  validateDataReferences(spec, errors, warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates the data structure (nodes, edges, groups)
 */
function validateDataStructure(
  spec: any,
  errors: ValidationError[],
  warnings: ValidationError[]
) {
  if (!spec.data || typeof spec.data !== 'object') {
    errors.push({
      field: 'data',
      message: 'Spec.data must be an object',
      value: spec.data,
      suggestion:
        'Provide data as { nodes: NodeSpec[], edges: EdgeSpec[], groups?: GroupSpec[] }',
    });
    return;
  }

  // Validate nodes
  if (!Array.isArray(spec.data.nodes)) {
    errors.push({
      field: 'data.nodes',
      message: 'data.nodes must be an array',
      value: spec.data.nodes,
      suggestion: 'Provide nodes as an array of NodeSpec objects',
    });
  } else {
    spec.data.nodes.forEach((node: any, index: number) => {
      validateNode(node, `data.nodes[${index}]`, errors, warnings);
    });
  }

  // Validate edges
  if (!Array.isArray(spec.data.edges)) {
    errors.push({
      field: 'data.edges',
      message: 'data.edges must be an array',
      value: spec.data.edges,
      suggestion: 'Provide edges as an array of EdgeSpec objects',
    });
  } else {
    spec.data.edges.forEach((edge: any, index: number) => {
      validateEdge(edge, `data.edges[${index}]`, errors, warnings);
    });
  }

  // Validate groups (optional)
  if (spec.data.groups !== undefined) {
    if (!Array.isArray(spec.data.groups)) {
      errors.push({
        field: 'data.groups',
        message: 'data.groups must be an array if provided',
        value: spec.data.groups,
        suggestion:
          'Provide groups as an array of GroupSpec objects or omit the property',
      });
    } else {
      spec.data.groups.forEach((group: any, index: number) => {
        validateGroup(group, `data.groups[${index}]`, errors, warnings);
      });
    }
  }
}

/**
 * Validates a single node
 */
function validateNode(
  node: any,
  path: string,
  errors: ValidationError[],
  warnings: ValidationError[]
) {
  if (!node || typeof node !== 'object') {
    errors.push({
      field: path,
      message: 'Node must be an object',
      value: node,
      suggestion:
        'Provide a valid NodeSpec object with at least an id and type',
    });
    return;
  }

  if (!node.id || typeof node.id !== 'string') {
    errors.push({
      field: `${path}.id`,
      message: 'Node id must be a non-empty string',
      value: node.id,
      suggestion: 'Provide a unique string identifier for the node',
    });
  }

  if (!node.type || typeof node.type !== 'string') {
    errors.push({
      field: `${path}.type`,
      message: 'Node type must be a string',
      value: node.type,
      suggestion: 'Valid types: "sphere", "box", "text", "html", "custom"',
    });
  } else {
    const validTypes = ['sphere', 'box', 'text', 'html', 'custom'];
    if (!validTypes.includes(node.type)) {
      warnings.push({
        field: `${path}.type`,
        message: `Unknown node type "${node.type}"`,
        value: node.type,
        suggestion: `Valid types: ${validTypes.join(', ')}`,
      });
    }
  }

  // Validate position if provided
  if (node.position !== undefined) {
    validatePosition(node.position, `${path}.position`, errors, warnings);
  }

  // Validate color if provided
  if (node.color !== undefined && typeof node.color !== 'string') {
    warnings.push({
      field: `${path}.color`,
      message: 'Node color should be a string',
      value: node.color,
      suggestion: 'Use hex colors like "#ff0000" or color names like "red"',
    });
  }

  // Validate pinning if provided
  if (node.pinning !== undefined) {
    if (typeof node.pinning === 'string') {
      // String pinning (group reference)
      if (typeof node.pinning !== 'string' || node.pinning.trim() === '') {
        errors.push({
          field: `${path}.pinning`,
          message: 'String pinning must be a non-empty string (group id)',
          value: node.pinning,
          suggestion:
            'Provide a valid group id or use position object {x, y, z}',
        });
      }
    } else if (typeof node.pinning === 'object') {
      validatePosition(node.pinning, `${path}.pinning`, errors, warnings);
    } else {
      errors.push({
        field: `${path}.pinning`,
        message:
          'Pinning must be a position object {x, y, z} or group id string',
        value: node.pinning,
        suggestion:
          'Use {x: number, y: number, z: number} or a group id string',
      });
    }
  }
}

/**
 * Validates a single edge
 */
function validateEdge(
  edge: any,
  path: string,
  errors: ValidationError[],
  warnings: ValidationError[]
) {
  if (!edge || typeof edge !== 'object') {
    errors.push({
      field: path,
      message: 'Edge must be an object',
      value: edge,
      suggestion: 'Provide a valid EdgeSpec object with id, source, and target',
    });
    return;
  }

  if (!edge.id || typeof edge.id !== 'string') {
    errors.push({
      field: `${path}.id`,
      message: 'Edge id must be a non-empty string',
      value: edge.id,
      suggestion: 'Provide a unique string identifier for the edge',
    });
  }

  if (!edge.source || typeof edge.source !== 'string') {
    errors.push({
      field: `${path}.source`,
      message: 'Edge source must be a string (node id)',
      value: edge.source,
      suggestion: 'Provide the id of the source node',
    });
  }

  if (!edge.target || typeof edge.target !== 'string') {
    errors.push({
      field: `${path}.target`,
      message: 'Edge target must be a string (node id)',
      value: edge.target,
      suggestion: 'Provide the id of the target node',
    });
  }

  if (edge.type !== undefined) {
    const validTypes = ['straight', 'curved', 'dashed'];
    if (typeof edge.type !== 'string' || !validTypes.includes(edge.type)) {
      warnings.push({
        field: `${path}.type`,
        message: `Invalid edge type "${edge.type}"`,
        value: edge.type,
        suggestion: `Valid types: ${validTypes.join(', ')}`,
      });
    }
  }

  if (
    edge.width !== undefined &&
    (typeof edge.width !== 'number' || edge.width <= 0)
  ) {
    warnings.push({
      field: `${path}.width`,
      message: 'Edge width must be a positive number',
      value: edge.width,
      suggestion: 'Use values like 1, 2, 3 for different thicknesses',
    });
  }

  if (
    edge.curvature !== undefined &&
    (typeof edge.curvature !== 'number' ||
      edge.curvature < 0 ||
      edge.curvature > 1)
  ) {
    warnings.push({
      field: `${path}.curvature`,
      message: 'Edge curvature must be a number between 0 and 1',
      value: edge.curvature,
      suggestion: 'Use values between 0 (straight) and 1 (highly curved)',
    });
  }
}

/**
 * Validates a single group
 */
function validateGroup(
  group: any,
  path: string,
  errors: ValidationError[],
  warnings: ValidationError[]
) {
  if (!group || typeof group !== 'object') {
    errors.push({
      field: path,
      message: 'Group must be an object',
      value: group,
      suggestion: 'Provide a valid GroupSpec object with id and nodes array',
    });
    return;
  }

  if (!group.id || typeof group.id !== 'string') {
    errors.push({
      field: `${path}.id`,
      message: 'Group id must be a non-empty string',
      value: group.id,
      suggestion: 'Provide a unique string identifier for the group',
    });
  }

  if (!Array.isArray(group.nodes)) {
    errors.push({
      field: `${path}.nodes`,
      message: 'Group nodes must be an array of node ids',
      value: group.nodes,
      suggestion: 'Provide an array of strings (node ids)',
    });
  } else {
    group.nodes.forEach((nodeId: any, index: number) => {
      if (typeof nodeId !== 'string') {
        errors.push({
          field: `${path}.nodes[${index}]`,
          message: 'Group node ids must be strings',
          value: nodeId,
          suggestion: 'Use valid node id strings',
        });
      }
    });
  }

  if (group.position !== undefined) {
    validatePosition(group.position, `${path}.position`, errors, warnings);
  }
}

/**
 * Validates a position object {x, y, z}
 */
function validatePosition(
  position: any,
  path: string,
  errors: ValidationError[],
  warnings: ValidationError[]
) {
  if (!position || typeof position !== 'object') {
    errors.push({
      field: path,
      message: 'Position must be an object with x, y, z properties',
      value: position,
      suggestion: 'Use {x: number, y: number, z: number}',
    });
    return;
  }

  ['x', 'y', 'z'].forEach((coord) => {
    if (typeof position[coord] !== 'number') {
      if (position[coord] === undefined) {
        warnings.push({
          field: `${path}.${coord}`,
          message: `Position ${coord} is missing, defaulting to 0`,
          value: position[coord],
          suggestion: `Add ${coord}: number to the position object`,
        });
      } else {
        errors.push({
          field: `${path}.${coord}`,
          message: `Position ${coord} must be a number`,
          value: position[coord],
          suggestion: `Use a numeric value for ${coord}`,
        });
      }
    }
  });
}

/**
 * Validates style structure
 */
function validateStyleStructure(
  spec: any,
  errors: ValidationError[],
  warnings: ValidationError[]
) {
  if (!spec.style || typeof spec.style !== 'object') {
    errors.push({
      field: 'style',
      message: 'Spec.style must be an object',
      value: spec.style,
      suggestion: 'Provide style configuration for node/edge states',
    });
    return;
  }

  // Style validation is mostly permissive, just check it's an object
  const validStyleKeys = [
    'node:hover',
    'node:selected',
    'edge:hover',
    'edge:selected',
    'edge:source-selected',
    'edge:target-selected',
    'edge:both-selected',
  ];

  Object.keys(spec.style).forEach((key) => {
    if (!validStyleKeys.includes(key)) {
      warnings.push({
        field: `style.${key}`,
        message: `Unknown style key "${key}"`,
        value: spec.style[key],
        suggestion: `Valid keys: ${validStyleKeys.join(', ')}`,
      });
    }
  });
}

/**
 * Validates layout structure
 */
function validateLayoutStructure(
  spec: any,
  errors: ValidationError[],
  _warnings: ValidationError[]
) {
  if (!spec.layout || typeof spec.layout !== 'object') {
    errors.push({
      field: 'layout',
      message: 'Spec.layout must be an object',
      value: spec.layout,
      suggestion: 'Provide layout configuration with type and options',
    });
    return;
  }

  if (!spec.layout.type || typeof spec.layout.type !== 'string') {
    errors.push({
      field: 'layout.type',
      message: 'Layout type must be a string',
      value: spec.layout.type,
      suggestion:
        'Valid types: "force-directed", "grid", "circle", "column", "row", "random"',
    });
  } else {
    const validTypes = [
      'force-directed',
      'grid',
      'circle',
      'column',
      'row',
      'random',
    ];
    if (!validTypes.includes(spec.layout.type)) {
      errors.push({
        field: 'layout.type',
        message: `Unknown layout type "${spec.layout.type}"`,
        value: spec.layout.type,
        suggestion: `Valid types: ${validTypes.join(', ')}`,
      });
    }
  }
}

/**
 * Validates camera structure
 */
function validateCameraStructure(
  spec: any,
  errors: ValidationError[],
  warnings: ValidationError[]
) {
  if (!spec.camera || typeof spec.camera !== 'object') {
    errors.push({
      field: 'camera',
      message: 'Spec.camera must be an object',
      value: spec.camera,
      suggestion:
        'Provide camera configuration with target, phi, theta, distance',
    });
    return;
  }

  if (!spec.camera.target || typeof spec.camera.target !== 'object') {
    errors.push({
      field: 'camera.target',
      message: 'Camera target must be an object with x, y, z',
      value: spec.camera.target,
      suggestion: 'Use {x: number, y: number, z: number} for target position',
    });
  } else {
    validatePosition(spec.camera.target, 'camera.target', errors, warnings);
  }

  ['phi', 'theta', 'distance'].forEach((prop) => {
    if (typeof spec.camera[prop] !== 'number') {
      errors.push({
        field: `camera.${prop}`,
        message: `Camera ${prop} must be a number`,
        value: spec.camera[prop],
        suggestion: `Provide a numeric value for ${prop}`,
      });
    }
  });
}

/**
 * Validates controls structure
 */
function validateControlsStructure(
  spec: any,
  errors: ValidationError[],
  warnings: ValidationError[]
) {
  if (!spec.controls || typeof spec.controls !== 'object') {
    errors.push({
      field: 'controls',
      message: 'Spec.controls must be an object',
      value: spec.controls,
      suggestion: 'Provide controls configuration',
    });
    return;
  }

  if (!spec.controls.keyboard || typeof spec.controls.keyboard !== 'object') {
    errors.push({
      field: 'controls.keyboard',
      message: 'Controls keyboard must be an object',
      value: spec.controls.keyboard,
      suggestion: 'Provide keyboard controls configuration',
    });
    return;
  }

  ['enabled', 'panSpeed', 'zoomSpeed', 'orbitSpeed'].forEach((prop) => {
    if (spec.controls.keyboard[prop] === undefined) {
      warnings.push({
        field: `controls.keyboard.${prop}`,
        message: `Keyboard control ${prop} is missing`,
        suggestion: `Add ${prop} to keyboard controls`,
      });
    } else if (
      prop !== 'enabled' &&
      typeof spec.controls.keyboard[prop] !== 'number'
    ) {
      errors.push({
        field: `controls.keyboard.${prop}`,
        message: `Keyboard control ${prop} must be a number`,
        value: spec.controls.keyboard[prop],
        suggestion: `Use a numeric value for ${prop}`,
      });
    } else if (
      prop === 'enabled' &&
      typeof spec.controls.keyboard[prop] !== 'boolean'
    ) {
      errors.push({
        field: `controls.keyboard.${prop}`,
        message: `Keyboard control ${prop} must be a boolean`,
        value: spec.controls.keyboard[prop],
        suggestion: `Use true or false for ${prop}`,
      });
    }
  });
}

/**
 * Validates performance structure
 */
function validatePerformanceStructure(
  spec: any,
  errors: ValidationError[],
  warnings: ValidationError[]
) {
  if (!spec.performance || typeof spec.performance !== 'object') {
    errors.push({
      field: 'performance',
      message: 'Spec.performance must be an object',
      value: spec.performance,
      suggestion: 'Provide performance configuration',
    });
    return;
  }

  if (typeof spec.performance.instancingThreshold !== 'number') {
    errors.push({
      field: 'performance.instancingThreshold',
      message: 'Performance instancingThreshold must be a number',
      value: spec.performance.instancingThreshold,
      suggestion:
        'Use a number like 100 for when to switch to instanced rendering',
    });
  }

  [
    'enableLOD',
    'enableCulling',
    'enableMemoryManagement',
    'useBasicRenderer',
  ].forEach((prop) => {
    if (
      spec.performance[prop] !== undefined &&
      typeof spec.performance[prop] !== 'boolean'
    ) {
      warnings.push({
        field: `performance.${prop}`,
        message: `Performance ${prop} should be a boolean`,
        value: spec.performance[prop],
        suggestion: `Use true or false for ${prop}`,
      });
    }
  });
}

/**
 * Validates interaction structure
 */
function validateInteractionStructure(
  spec: any,
  errors: ValidationError[],
  _warnings: ValidationError[]
) {
  if (!spec.interaction || typeof spec.interaction !== 'object') {
    errors.push({
      field: 'interaction',
      message: 'Spec.interaction must be an object',
      value: spec.interaction,
      suggestion: 'Provide interaction state configuration',
    });
    return;
  }

  if (
    spec.interaction.hoveredElementId !== null &&
    spec.interaction.hoveredElementId !== undefined &&
    typeof spec.interaction.hoveredElementId !== 'string'
  ) {
    errors.push({
      field: 'interaction.hoveredElementId',
      message: 'Interaction hoveredElementId must be a string or null',
      value: spec.interaction.hoveredElementId,
      suggestion: 'Use a valid element id string or null',
    });
  }

  if (!Array.isArray(spec.interaction.selectedElementIds)) {
    errors.push({
      field: 'interaction.selectedElementIds',
      message: 'Interaction selectedElementIds must be an array',
      value: spec.interaction.selectedElementIds,
      suggestion: 'Use an array of element id strings',
    });
  } else {
    spec.interaction.selectedElementIds.forEach((id: any, index: number) => {
      if (typeof id !== 'string') {
        errors.push({
          field: `interaction.selectedElementIds[${index}]`,
          message: 'Selected element ids must be strings',
          value: id,
          suggestion: 'Use valid element id strings',
        });
      }
    });
  }
}

/**
 * Validates HUD structure
 */
function validateHUDStructure(
  spec: any,
  errors: ValidationError[],
  warnings: ValidationError[]
) {
  if (typeof spec.hud !== 'object') {
    errors.push({
      field: 'hud',
      message: 'Spec.hud must be an object if provided',
      value: spec.hud,
      suggestion: 'Provide HUD configuration or omit the property',
    });
    return;
  }

  if (spec.hud.visible !== undefined && typeof spec.hud.visible !== 'boolean') {
    warnings.push({
      field: 'hud.visible',
      message: 'HUD visible should be a boolean',
      value: spec.hud.visible,
      suggestion: 'Use true or false',
    });
  }
}

/**
 * Validates cross-references between data elements
 */
function validateDataReferences(
  spec: any,
  errors: ValidationError[],
  warnings: ValidationError[]
) {
  const nodeIds = new Set((spec.data?.nodes || []).map((n: NodeSpec) => n.id));
  const groupIds = new Set(
    (spec.data?.groups || []).map((g: GroupSpec) => g.id)
  );

  // Check edge references
  (spec.data?.edges || []).forEach((edge: EdgeSpec, index: number) => {
    if (edge.source && !nodeIds.has(edge.source)) {
      errors.push({
        field: `data.edges[${index}].source`,
        message: `Edge source "${edge.source}" references non-existent node`,
        value: edge.source,
        suggestion: 'Ensure the source node exists in the nodes array',
      });
    }

    if (edge.target && !nodeIds.has(edge.target)) {
      errors.push({
        field: `data.edges[${index}].target`,
        message: `Edge target "${edge.target}" references non-existent node`,
        value: edge.target,
        suggestion: 'Ensure the target node exists in the nodes array',
      });
    }
  });

  // Check group node references
  (spec.data?.groups || []).forEach((group: GroupSpec, index: number) => {
    (group.nodes || []).forEach((nodeId: string, nodeIndex: number) => {
      if (!nodeIds.has(nodeId)) {
        errors.push({
          field: `data.groups[${index}].nodes[${nodeIndex}]`,
          message: `Group "${group.id}" references non-existent node "${nodeId}"`,
          value: nodeId,
          suggestion:
            'Ensure all node ids in the group exist in the nodes array',
        });
      }
    });
  });

  // Check node group references
  (spec.data?.nodes || []).forEach((node: NodeSpec, index: number) => {
    if (node.groupId && !groupIds.has(node.groupId)) {
      warnings.push({
        field: `data.nodes[${index}].groupId`,
        message: `Node "${node.id}" references non-existent group "${node.groupId}"`,
        value: node.groupId,
        suggestion: 'Ensure the group exists or remove the groupId reference',
      });
    }

    // Check pinning group references
    if (typeof node.pinning === 'string' && !groupIds.has(node.pinning)) {
      warnings.push({
        field: `data.nodes[${index}].pinning`,
        message: `Node "${node.id}" pinning references non-existent group "${node.pinning}"`,
        value: node.pinning,
        suggestion: 'Ensure the group exists or use position coordinates',
      });
    }
  });
}

/**
 * Formats validation result as a readable string
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.errors.length > 0) {
    lines.push(`❌ Validation failed with ${result.errors.length} error(s):`);
    result.errors.forEach((error) => {
      lines.push(`  • ${error.field}: ${error.message}`);
      if (error.suggestion) {
        lines.push(`    💡 ${error.suggestion}`);
      }
    });
  }

  if (result.warnings.length > 0) {
    lines.push(`⚠️  ${result.warnings.length} warning(s):`);
    result.warnings.forEach((warning) => {
      lines.push(`  • ${warning.field}: ${warning.message}`);
      if (warning.suggestion) {
        lines.push(`    💡 ${warning.suggestion}`);
      }
    });
  }

  if (result.isValid && result.warnings.length === 0) {
    lines.push('✅ Spec validation passed');
  }

  return lines.join('\n');
}
