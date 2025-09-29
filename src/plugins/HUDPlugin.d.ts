import { ISpaceGraphPlugin } from '../core/plugin';
import { SpaceGraph } from '../core/SpaceGraph';
/**
 * Enhanced HUDPlugin with REPL console functionality
 */
export declare class HUDPlugin implements ISpaceGraphPlugin {
    private graph;
    private hudContainer;
    private consoleContainer;
    private inputElement;
    private outputElement;
    private replCommands;
    private commandHistory;
    private historyIndex;
    init(graph: SpaceGraph): void;
    private createHUDElements;
    private setupEventListeners;
    private executeCommand;
    private evaluateCommand;
    private addOutput;
    private clearOutput;
    private scrollToBottom;
    private navigateHistory;
    private handleAutoComplete;
    private applyTheme;
    updateHUD(): void;
    dispose(): void;
}
