import { Logger } from './Logger';

/**
 * Documentation metadata for classes and methods
 */
export interface DocumentationMetadata {
  name: string;
  description: string;
  version?: string;
  author?: string;
  since?: string;
  deprecated?: boolean;
  deprecationMessage?: string;
  examples?: string[];
  see?: string[];
  category?: string;
  complexity?: 'low' | 'medium' | 'high';
  performance?: 'fast' | 'moderate' | 'slow';
  stability?: 'experimental' | 'beta' | 'stable' | 'legacy';
}

/**
 * Parameter documentation
 */
export interface ParameterDoc {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  defaultValue?: any;
  deprecated?: boolean;
}

/**
 * Method documentation
 */
export interface MethodDoc extends DocumentationMetadata {
  parameters: ParameterDoc[];
  returns?: {
    type: string;
    description: string;
  };
  throws?: {
    type: string;
    description: string;
  }[];
  async?: boolean;
  generator?: boolean;
}

/**
 * Class documentation
 */
export interface ClassDoc extends DocumentationMetadata {
  extends?: string;
  implements?: string[];
  constructors?: MethodDoc[];
  methods: Map<string, MethodDoc>;
  properties: Map<string, ParameterDoc>;
}

/**
 * Comprehensive documentation system for runtime code documentation
 */
export class DocumentationSystem {
  private static instance: DocumentationSystem;
  private logger: Logger;
  private classDocs: Map<string, ClassDoc> = new Map();
  private disposed: boolean = false;

  private constructor() {
    this.logger = Logger.getInstance();
  }

  public static getInstance(): DocumentationSystem {
    if (!DocumentationSystem.instance) {
      DocumentationSystem.instance = new DocumentationSystem();
    }
    return DocumentationSystem.instance;
  }

  /**
   * Register documentation for a class
   */
  public registerClass(targetClass: any, doc: ClassDoc): void {
    if (this.disposed) {
      this.logger.warn('DocumentationSystem', 'Cannot register class - DocumentationSystem is disposed');
      return;
    }

    const className = targetClass.name || targetClass.constructor.name;
    this.classDocs.set(className, doc);

    this.logger.debug('DocumentationSystem', `Registered documentation for class: ${className}`);
  }

  /**
   * Get documentation for a class
   */
  public getClassDoc(className: string): ClassDoc | null {
    return this.classDocs.get(className) || null;
  }

  /**
   * Get documentation for a method
   */
  public getMethodDoc(className: string, methodName: string): MethodDoc | null {
    const classDoc = this.classDocs.get(className);
    return classDoc ? classDoc.methods.get(methodName) || null : null;
  }

  /**
   * Generate comprehensive documentation report
   */
  public generateReport(): {
    totalClasses: number;
    totalMethods: number;
    undocumentedClasses: string[];
    undocumentedMethods: string[];
    coverage: number;
  } {
    let totalMethods = 0;
    let documentedMethods = 0;
    const undocumentedClasses: string[] = [];
    const undocumentedMethods: string[] = [];

    for (const [className, classDoc] of this.classDocs) {
      let classHasDoc = false;
      if (classDoc.description) {
        classHasDoc = true;
      }

      if (!classHasDoc) {
        undocumentedClasses.push(className);
      }

      for (const [methodName, methodDoc] of classDoc.methods) {
        totalMethods++;
        if (methodDoc.description) {
          documentedMethods++;
        } else {
          undocumentedMethods.push(`${className}.${methodName}`);
        }
      }
    }

    const coverage = totalMethods > 0 ? (documentedMethods / totalMethods) * 100 : 0;

    return {
      totalClasses: this.classDocs.size,
      totalMethods,
      undocumentedClasses,
      undocumentedMethods,
      coverage,
    };
  }

  /**
   * Validate documentation completeness
   */
  public validateDocumentation(): {
    isComplete: boolean;
    missing: string[];
    warnings: string[];
    recommendations: string[];
  } {
    const report = this.generateReport();
    const result = {
      isComplete: report.coverage >= 80,
      missing: [...report.undocumentedClasses, ...report.undocumentedMethods],
      warnings: [] as string[],
      recommendations: [] as string[],
    };

    if (report.coverage < 50) {
      result.warnings.push(`Low documentation coverage: ${report.coverage.toFixed(1)}%`);
      result.recommendations.push('Add documentation for core classes and methods');
    }

    if (report.undocumentedClasses.length > 0) {
      result.warnings.push(`${report.undocumentedClasses.length} undocumented classes`);
      result.recommendations.push('Document all public classes');
    }

    if (report.undocumentedMethods.length > 0) {
      result.warnings.push(`${report.undocumentedMethods.length} undocumented methods`);
      result.recommendations.push('Document all public methods');
    }

    return result;
  }

  /**
   * Decorator for documenting classes
   */
  public static Class(doc: ClassDoc) {
    return function (target: any) {
      DocumentationSystem.getInstance().registerClass(target, doc);
    };
  }

  /**
   * Decorator for documenting methods
   */
  public static Method(doc: MethodDoc) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const className = target.constructor.name;
      const classDoc = DocumentationSystem.getInstance().getClassDoc(className);

      if (classDoc) {
        classDoc.methods.set(propertyKey, doc);
      } else {
        // Create class documentation if it doesn't exist
        const newClassDoc: ClassDoc = {
          name: className,
          description: '',
          methods: new Map([[propertyKey, doc]]),
          properties: new Map(),
        };
        DocumentationSystem.getInstance().registerClass(target.constructor, newClassDoc);
      }

      return descriptor;
    };
  }

  /**
   * Decorator for documenting properties
   */
  public static Property(doc: ParameterDoc) {
    return function (target: any, propertyKey: string) {
      const className = target.constructor.name;
      const classDoc = DocumentationSystem.getInstance().getClassDoc(className);

      if (classDoc) {
        classDoc.properties.set(propertyKey, doc);
      } else {
        // Create class documentation if it doesn't exist
        const newClassDoc: ClassDoc = {
          name: className,
          description: '',
          methods: new Map(),
          properties: new Map([[propertyKey, doc]]),
        };
        DocumentationSystem.getInstance().registerClass(target.constructor, newClassDoc);
      }
    };
  }

  /**
   * Generate JSDoc comments for a class
   */
  public generateJSDoc(className: string): string {
    const classDoc = this.getClassDoc(className);
    if (!classDoc) {
      return `/** Class: ${className} */\n`;
    }

    let jsdoc = '/**\n';

    if (classDoc.description) {
      jsdoc += ` * ${classDoc.description}\n`;
    }

    if (classDoc.version) {
      jsdoc += ` * @version ${classDoc.version}\n`;
    }

    if (classDoc.author) {
      jsdoc += ` * @author ${classDoc.author}\n`;
    }

    if (classDoc.since) {
      jsdoc += ` * @since ${classDoc.since}\n`;
    }

    if (classDoc.deprecated) {
      jsdoc += ` * @deprecated ${classDoc.deprecationMessage || 'This class is deprecated'}\n`;
    }

    if (classDoc.category) {
      jsdoc += ` * @category ${classDoc.category}\n`;
    }

    if (classDoc.complexity) {
      jsdoc += ` * @complexity ${classDoc.complexity}\n`;
    }

    if (classDoc.performance) {
      jsdoc += ` * @performance ${classDoc.performance}\n`;
    }

    if (classDoc.stability) {
      jsdoc += ` * @stability ${classDoc.stability}\n`;
    }

    if (classDoc.extends) {
      jsdoc += ` * @extends ${classDoc.extends}\n`;
    }

    if (classDoc.implements && classDoc.implements.length > 0) {
      jsdoc += ` * @implements ${classDoc.implements.join(', ')}\n`;
    }

    if (classDoc.examples && classDoc.examples.length > 0) {
      classDoc.examples.forEach(example => {
        jsdoc += ` * @example\n * ${example}\n`;
      });
    }

    if (classDoc.see && classDoc.see.length > 0) {
      classDoc.see.forEach(see => {
        jsdoc += ` * @see ${see}\n`;
      });
    }

    jsdoc += ' */\n';

    return jsdoc;
  }

  /**
   * Generate JSDoc comments for a method
   */
  public generateMethodJSDoc(className: string, methodName: string): string {
    const methodDoc = this.getMethodDoc(className, methodName);
    if (!methodDoc) {
      return `/** Method: ${methodName} */\n`;
    }

    let jsdoc = '/**\n';

    if (methodDoc.description) {
      jsdoc += ` * ${methodDoc.description}\n`;
    }

    // Parameters
    methodDoc.parameters.forEach(param => {
      jsdoc += ` * @param ${param.name} ${param.description}`;
      if (param.required === false) {
        jsdoc += ' (optional)';
      }
      if (param.defaultValue !== undefined) {
        jsdoc += ` (default: ${param.defaultValue})`;
      }
      jsdoc += '\n';
    });

    // Returns
    if (methodDoc.returns) {
      jsdoc += ` * @returns ${methodDoc.returns.description}\n`;
    }

    // Throws
    if (methodDoc.throws && methodDoc.throws.length > 0) {
      methodDoc.throws.forEach(thr => {
        jsdoc += ` * @throws ${thr.description}\n`;
      });
    }

    // Async/Generator
    if (methodDoc.async) {
      jsdoc += ' * @async\n';
    }

    if (methodDoc.generator) {
      jsdoc += ' * @generator\n';
    }

    // Other metadata
    if (methodDoc.version) {
      jsdoc += ` * @version ${methodDoc.version}\n`;
    }

    if (methodDoc.deprecated) {
      jsdoc += ` * @deprecated ${methodDoc.deprecationMessage || 'This method is deprecated'}\n`;
    }

    if (methodDoc.complexity) {
      jsdoc += ` * @complexity ${methodDoc.complexity}\n`;
    }

    if (methodDoc.performance) {
      jsdoc += ` * @performance ${methodDoc.performance}\n`;
    }

    if (methodDoc.examples && methodDoc.examples.length > 0) {
      methodDoc.examples.forEach(example => {
        jsdoc += ` * @example\n * ${example}\n`;
      });
    }

    jsdoc += ' */\n';

    return jsdoc;
  }

  /**
   * Dispose of the DocumentationSystem
   */
  public dispose(): void {
    this.disposed = true;
    this.classDocs.clear();
  }
}