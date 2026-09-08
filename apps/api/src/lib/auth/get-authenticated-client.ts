import type { NextRequest } from 'next/server';
import { createUserScopedClient, extractBearerToken } from '@sbaah/shared';
import { ApiError } from '@/lib/http';

/** Every authenticated /v1 endpoint starts with this — throws a 401 ApiError if no bearer token is present. */
export function getAuthenticatedClient(request: NextRequest) {
  const accessToken = extractBearerToken(request.headers.get('authorization'));
  if (!accessToken) {
    throw new ApiError(401, 'unauthenticated', 'رمز الدخول مفقود أو غير صالح');
  }
  return { supabase: createUserScopedClient(accessToken), accessToken };
}
