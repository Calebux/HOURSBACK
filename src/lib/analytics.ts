import posthog from 'posthog-js';

type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

export function track(event: string, props: AnalyticsProps = {}) {
  try {
    posthog.capture(event, props);
  } catch {
    // Analytics must never break the product flow.
  }
}

