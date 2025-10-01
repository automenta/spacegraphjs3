import { SpaceGraph } from '../core/SpaceGraph';
import { GraphEventMap } from '../types';

/**
 * Log levels for the logging system
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// Use the log event type from GraphEventMap
type LogEntry = GraphEventMap['log'];

/**
 * Logger class for standardized logging throughout the application
 */
export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;
  private graph: SpaceGraph | null = null;

  private constructor() {}

  /**
   * Get the singleton instance of the Logger
   * @returns The Logger instance
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set the SpaceGraph instance for event-based logging
   * @param graph - The SpaceGraph instance
   */
  public setGraph(graph: SpaceGraph): void {
    this.graph = graph;
  }

  /**
   * Set the maximum log level to output
   * @param level - The maximum log level
   */
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Set the maximum number of logs to keep in memory
   * @param maxLogs - The maximum number of logs
   */
  public setMaxLogs(maxLogs: number): void {
    // Validate input
    if (maxLogs <= 0) {
      this.error('Logger', 'Invalid maxLogs value, must be positive', { maxLogs });
      return;
    }
    
    this.maxLogs = maxLogs;
    // Trim logs if necessary
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  /**
   * Log an error message
   * @param source - The source of the log message
   * @param message - The log message
   * @param data - Optional data to include
   */
  public error(source: string, message: string, data?: any): void {
    if (!this.validateInputs(source, message, 'error')) return;
    this.log(LogLevel.ERROR, source, message, data);
  }

  /**
   * Log a warning message
   * @param source - The source of the log message
   * @param message - The log message
   * @param data - Optional data to include
   */
  public warn(source: string, message: string, data?: any): void {
    if (!this.validateInputs(source, message, 'warn')) return;
    this.log(LogLevel.WARN, source, message, data);
  }

  /**
   * Log an info message
   * @param source - The source of the log message
   * @param message - The log message
   * @param data - Optional data to include
   */
  public info(source: string, message: string, data?: any): void {
    if (!this.validateInputs(source, message, 'info')) return;
    this.log(LogLevel.INFO, source, message, data);
  }

  /**
   * Log a debug message
   * @param source - The source of the log message
   * @param message - The log message
   * @param data - Optional data to include
   */
  public debug(source: string, message: string, data?: any): void {
    if (!this.validateInputs(source, message, 'debug')) return;
    this.log(LogLevel.DEBUG, source, message, data);
  }

  /**
   * Validate log inputs
   * @param source - The source of the log message
   * @param message - The log message
   * @param level - The log level for console output
   * @returns boolean indicating if inputs are valid
   */
  private validateInputs(source: string, message: string, level: string): boolean {
    // Validate source
    if (!source || typeof source !== 'string') {
      // Fallback to prevent infinite recursion
      const fallbackMessage = `[Logger] Invalid source for ${level} log:`;
      switch (level) {
        case 'error':
          console.error(fallbackMessage, source);
          break;
        case 'warn':
          console.warn(fallbackMessage, source);
          break;
        case 'info':
          console.info(fallbackMessage, source);
          break;
        case 'debug':
          console.debug(fallbackMessage, source);
          break;
        default:
          console.error(fallbackMessage, source);
      }
      return false;
    }
    
    // Validate message
    if (!message || typeof message !== 'string') {
      const formattedMessage = `[${source}] Invalid message for ${level} log:`;
      switch (level) {
        case 'error':
          console.error(formattedMessage, message);
          break;
        case 'warn':
          console.warn(formattedMessage, message);
          break;
        case 'info':
          console.info(formattedMessage, message);
          break;
        case 'debug':
          console.debug(formattedMessage, message);
          break;
        default:
          console.error(formattedMessage, message);
      }
      return false;
    }
    
    return true;
  }

  /**
   * Internal logging method
   * @param level - The log level
   * @param source - The source of the log message
   * @param message - The log message
   * @param data - Optional data to include
   */
  private log(level: LogLevel, source: string, message: string, data?: any): void {
    // Check if we should output this log level
    if (level > this.logLevel) {
      return;
    }

    // Since this is an internal method, we can assume source and message are already validated
    // by the public methods, but we'll keep minimal validation for safety
    if (!source || typeof source !== 'string') {
      // Prevent infinite recursion by using console directly
      console.error('[Logger] Invalid source in internal log method:', source);
      return;
    }
    if (!message || typeof message !== 'string') {
      console.error(`[${source}] Invalid message in internal log method:`, message);
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      source,
      data,
    };

    // Add to logs array
    this.logs.push(entry);

    // Trim logs if necessary
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Output to console based on level
    const formattedMessage = `[${source}] ${message}`;
    try {
      switch (level) {
        case LogLevel.ERROR:
          console.error(formattedMessage, data || '');
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, data || '');
          break;
        case LogLevel.INFO:
          console.info(formattedMessage, data || '');
          break;
        case LogLevel.DEBUG:
          console.debug(formattedMessage, data || '');
          break;
      }
    } catch (consoleError) {
      // If console output fails, we still want to emit the event
      // This can happen in some environments or with circular references in data
      // Silently handle the error to prevent breaking the application
      void consoleError; // Intentionally unused, keeping for potential debugging
      try {
        // Try a simpler output
        console.log(formattedMessage);
      } catch (fallbackError) {
        // Silently handle the fallback error to prevent breaking the application
        void fallbackError; // Intentionally unused, keeping for potential debugging
        // If all else fails, we'll still emit the event
        // We don't want logging failures to break the application
      }
    }

    // Emit log event if graph is available
    if (this.graph) {
      try {
        this.graph.events.emit('log', entry);
      } catch (emitError) {
        // If event emission fails, log to console as a fallback
        console.error('[Logger] Failed to emit log event:', emitError);
      }
    }
  }

  /**
   * Get all logs
   * @returns Array of log entries
   */
  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  public clearLogs(): void {
    this.logs = [];
  }

  /**
   * Filter logs by level
   * @param level - The level to filter by
   * @returns Array of log entries with the specified level
   */
  public getLogsByLevel(level: number): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Filter logs by source
   * @param source - The source to filter by
   * @returns Array of log entries from the specified source
   */
  public getLogsBySource(source: string): LogEntry[] {
    return this.logs.filter(log => log.source === source);
  }

  /**
   * Export logs to JSON string
   * @returns JSON string of all logs
   */
  public exportLogs(): string {
    try {
      return JSON.stringify(this.logs, null, 2);
    } catch (error) {
      // Handle serialization errors (e.g., circular references)
      this.error('Logger', 'Failed to export logs due to serialization error', error);
      // Return a safe fallback
      return JSON.stringify(this.logs.map(log => ({
        ...log,
        data: '[SERIALIZATION_ERROR]'
      })), null, 2);
    }
  }
}