import type { ComponentType } from "react";

export type ToolModuleProps = {
  name: string;
  title: string;
};

export type HomeAudioToolIconKey =
  | "music"
  | "minimize-2"
  | "arrow-left-right"
  | "file-audio"
  | "scissors"
  | "audio-waveform"
  | "disc"
  | "file-music"
  | "volume-2"
  | "tags";

export type ToolListEntry = {
  id: string;
  name: string;
  title: string;
  iconKey: HomeAudioToolIconKey;
  component: ComponentType<ToolModuleProps>;
};
