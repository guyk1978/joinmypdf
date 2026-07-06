import type { IMediaTool } from "../types/IMediaTool";

export class MediaToolRegistry {
  private static instance: MediaToolRegistry | null = null;
  private readonly tools = new Map<string, IMediaTool>();

  static getInstance(): MediaToolRegistry {
    if (!MediaToolRegistry.instance) {
      MediaToolRegistry.instance = new MediaToolRegistry();
    }
    return MediaToolRegistry.instance;
  }

  register(tool: IMediaTool): void {
    this.tools.set(tool.toolId, tool);
  }

  unregister(toolId: string): boolean {
    return this.tools.delete(toolId);
  }

  get<T extends IMediaTool = IMediaTool>(toolId: string): T | undefined {
    return this.tools.get(toolId) as T | undefined;
  }

  list(): IMediaTool[] {
    return Array.from(this.tools.values());
  }

  clear(): void {
    this.tools.clear();
  }
}

export const mediaToolRegistry = MediaToolRegistry.getInstance();
