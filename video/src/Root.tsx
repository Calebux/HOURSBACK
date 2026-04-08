import React from 'react';
import { Composition } from "remotion";
import { HoursbackVideo, VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS, TOTAL_FRAMES } from "./HoursbackVideo";
import { Format1Hook, FORMAT1_TOTAL_FRAMES } from "./Format1_Hook";
import { Format2Split, FORMAT2_TOTAL_FRAMES } from "./Format2_Split";
import { Format3Stats, FORMAT3_TOTAL_FRAMES } from "./Format3_Stats";
import { Format5Reply, FORMAT5_TOTAL_FRAMES } from "./Format5_Reply";
import { Format6Web, FORMAT6_TOTAL_FRAMES } from "./Format6_Web";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Original walkthrough video */}
      <Composition
        id="HoursbackVideo"
        component={HoursbackVideo}
        durationInFrames={TOTAL_FRAMES}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />

      {/* Ad: Format 1 — Problem Hook (60s) */}
      <Composition
        id="AdProblemHook"
        component={Format1Hook}
        durationInFrames={FORMAT1_TOTAL_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Ad: Format 2 — Before/After Split (54s) */}
      <Composition
        id="AdBeforeAfter"
        component={Format2Split}
        durationInFrames={FORMAT2_TOTAL_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Ad: Format 3 — Stat Shock (31s) */}
      <Composition
        id="AdStatShock"
        component={Format3Stats}
        durationInFrames={FORMAT3_TOTAL_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Ad: Format 5 — The Reply (60s) */}
      <Composition
        id="AdTheReply"
        component={Format5Reply}
        durationInFrames={FORMAT5_TOTAL_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Ad: Format 6 — Web Features (60s) */}
      <Composition
        id="AdWebFeatures"
        component={Format6Web}
        durationInFrames={FORMAT6_TOTAL_FRAMES}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
