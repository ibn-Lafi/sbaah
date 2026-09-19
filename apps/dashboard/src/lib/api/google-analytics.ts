import { apiDelete, apiGet, apiPatch, apiPost } from './client';

export interface GoogleAnalyticsIntegration {
  installed: boolean;
  status: 'installed' | 'connected' | 'error' | null;
  measurement_id: string | null;
  property_id: string | null;
  connected_at: string | null;
}

export function getGoogleAnalyticsIntegration(accessToken: string) {
  return apiGet<GoogleAnalyticsIntegration>('/integrations/google-analytics', accessToken);
}

export function saveGoogleAnalyticsMeasurementId(accessToken: string, measurementId: string) {
  return apiPatch<GoogleAnalyticsIntegration>(
    '/integrations/google-analytics',
    { measurement_id: measurementId },
    accessToken,
  );
}

export function removeGoogleAnalyticsIntegration(accessToken: string) {
  return apiDelete<{ removed: true }>('/integrations/google-analytics', accessToken);
}

export function connectGoogleAnalytics(accessToken: string) {
  return apiPost<{ authorization_url: string }>('/integrations/google-analytics/connect', {}, accessToken);
}
