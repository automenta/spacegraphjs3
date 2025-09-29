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
    this.log(LogLevel.ERROR, source, message, data);
  }

  /**
   * Log a warning message
   * @param source - The source of the log message
   * @param message - The log message
   * @param data - Optional data to include
   */
  public warn(source: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, source, message, data);
  }

  /**
   * Log an info message
   * @param source - The source of the log message
   * @param message - The log message
   * @param data - Optional data to include
   */
  public info(source: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, source, message, data);
  }

  /**
   * Log a debug message
   * @param source - The source of the log message
   * @param message - The log message
   * @param data - Optional data to include
   */
  public debug(source: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, source, message, data);
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

    // Emit log event if graph is available
    if (this.graph) {
      this.graph.events.emit('log', entry);
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
    return JSON.stringify(this.logs, null, 2);
  }
}