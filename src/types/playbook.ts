export interface Step {
  id: string;
  stepNumber: number;
  title: string;
  instruction: string;
  promptTemplate?: string;
  expectedOutput?: string;
  screenshotUrl?: string;
  tips?: string;
  tools?: string[];
  hideCodePreview?: boolean;
  hideCopilot?: boolean;
}

export interface WebhookInput {
  id: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'url' | 'email';
}

export interface WebhookConfig {
  supportedTools: ('make' | 'zapier' | 'clay')[];
  inputs: WebhookInput[];
}

export interface Playbook {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeToComplete: number;
  timeSaved: number;
  completionCount: number;
  rating: number;
  isPro: boolean;
  isNew?: boolean;
  coworkCompatible?: boolean;
  supportsCodePreview?: boolean;
  tools: string[];
  beforeYouStart: string[];
  expectedOutcome: string;
  troubleshooting: { problem: string; solution: string }[];
  steps: Step[];
  agentAutomation?: {
    description: string;
    trigger: string;
    actions: string[];
    setupSteps: { title: string; description: string; }[];
    tools: string[];
  };
  webhookConfig?: WebhookConfig;
  relatedPlaybooks: { id: string; title: string; slug: string }[];
}
