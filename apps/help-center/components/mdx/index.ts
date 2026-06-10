import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import { Step, Steps } from './steps';
import { VideoEmbed } from './video-embed';
import { ScreenshotZoom } from './screenshot-zoom';
import { RoleHint } from './role-hint';
import { CodeTabs } from './code-tabs';

// Custom components made available to every MDX page (see components/mdx.tsx).
export const mdxComponents = {
  Steps,
  Step,
  ImageZoom,
  VideoEmbed,
  ScreenshotZoom,
  RoleHint,
  CodeTabs,
};

export { Step, Steps, VideoEmbed, ScreenshotZoom, RoleHint, CodeTabs };
