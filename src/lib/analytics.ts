// Analytics tracking and A/B testing utilities for Coach2Coach

import { getApiUrl } from './apiConfig';

export interface AnalyticsEvent {
  eventName: string;
  userId?: string;
  anonId: string;
  sessionId: string;
  path?: string;
  referrer?: string;
  userAgent?: string;
  country?: string;
  properties?: Record<string, any>;
  experimentExposures?: Record<string, string>;
}

// Analytics configuration
export const ANALYTICS_CONFIG = {
  enabled: true,
  respectDNT: true,
  disableForAdmins: true,
  vendor: 'builtin'
};

// Generate anonymous ID for tracking
export function generateAnonId(): string {
  const existing = localStorage.getItem('coach2coach_anon_id');
  if (existing) return existing;
  
  const anonId = 'anon_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  localStorage.setItem('coach2coach_anon_id', anonId);
  return anonId;
}

// Generate session ID
export function generateSessionId(): string {
  const existing = sessionStorage.getItem('coach2coach_session_id');
  if (existing) return existing;
  
  const sessionId = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  sessionStorage.setItem('coach2coach_session_id', sessionId);
  return sessionId;
}

// Check if user has opted out of analytics
export function hasOptedOut(): boolean {
  return localStorage.getItem('coach2coach_analytics_opt_out') === 'true';
}

// Track analytics event
export async function trackEvent(event: Omit<AnalyticsEvent, 'anonId' | 'sessionId'>): Promise<void> {
  try {
    // Check if analytics is disabled
    if (!ANALYTICS_CONFIG.enabled || hasOptedOut()) {
      return;
    }

    // Respect Do Not Track
    if (ANALYTICS_CONFIG.respectDNT && navigator.doNotTrack === '1') {
      return;
    }

    const fullEvent: AnalyticsEvent = {
      ...event,
      anonId: generateAnonId(),
      sessionId: generateSessionId(),
      path: event.path || window.location.pathname,
      referrer: event.referrer || document.referrer,
      userAgent: navigator.userAgent,
      country: 'US'
    };

    // Send to analytics API
    await fetch(getApiUrl('/api/analytics/track'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullEvent)
    });
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
}

// Track page view
export function trackPageView(path?: string): void {
  trackEvent({
    eventName: 'page_view',
    path: path || window.location.pathname,
    properties: {
      title: document.title
    }
  });
}

// Track conversion event
export function trackConversion(eventName: string, properties?: Record<string, any>): void {
  trackEvent({
    eventName,
    properties: properties || {}
  });
}

// A/B Testing utilities
class ExperimentManager {
  private assignments: Map<string, string> = new Map();

  async getVariant(experimentKey: string, userId?: string): Promise<string> {
    try {
      // Check cache first
      if (this.assignments.has(experimentKey)) {
        return this.assignments.get(experimentKey)!;
      }

      // Get variant from server
      const response = await fetch(getApiUrl('/api/experiments/assign'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experimentKey,
          subjectId: userId || generateAnonId()
        })
      });

      const data = await response.json();
      const variant = data.success ? data.variant : 'control';
      
      // Cache assignment
      this.assignments.set(experimentKey, variant);
      
      // Track exposure
      trackEvent({
        eventName: 'experiment_exposure',
        userId,
        properties: {
          experiment_key: experimentKey,
          variant
        }
      });

      return variant;
    } catch (error) {
      console.error('Experiment assignment error:', error);
      return 'control';
    }
  }

  async trackConversion(experimentKey: string, userId?: string): Promise<void> {
    const variant = this.assignments.get(experimentKey);
    if (variant) {
      trackEvent({
        eventName: 'experiment_conversion',
        userId,
        properties: {
          experiment_key: experimentKey,
          variant
        }
      });
    }
  }
}

export const experimentManager = new ExperimentManager();