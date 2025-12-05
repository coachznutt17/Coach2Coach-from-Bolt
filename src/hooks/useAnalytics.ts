// React hooks for analytics and A/B testing
import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { trackEvent, trackPageView, experimentManager } from '../lib/analytics';

// Hook to track page views
export function usePageView(path?: string) {
  const pathRef = useRef<string>();

  useEffect(() => {
    const currentPath = path || window.location.pathname;
    
    // Only track if path changed
    if (pathRef.current !== currentPath) {
      pathRef.current = currentPath;
      trackPageView(currentPath);
    }
  }, [path]);
}

// Hook to track events
export function useTrack() {
  const { user } = useAuth();

  return {
    track: (eventName: string, properties?: Record<string, any>) => {
      trackEvent({
        eventName,
        userId: user?.id,
        properties
      });
    },
    
    trackConversion: (eventName: string, properties?: Record<string, any>) => {
      trackEvent({
        eventName,
        userId: user?.id,
        properties: {
          ...properties,
          conversion: true
        }
      });
    }
  };
}

// Hook for A/B testing
export function useExperiment(experimentKey: string) {
  const { user } = useAuth();
  const [variant, setVariant] = React.useState('control');
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    let mounted = true;

    experimentManager.getVariant(experimentKey, user?.id).then(v => {
      if (mounted) {
        setVariant(v);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
    };
  }, [experimentKey, user?.id]);

  const trackConversion = () => {
    experimentManager.trackConversion(experimentKey, user?.id);
  };

  return { variant, loading, trackConversion };
}