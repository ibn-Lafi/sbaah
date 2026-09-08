import { NextResponse, type NextRequest } from 'next/server';
import { buildCorsHeaders } from './lib/http/cors';

export function middleware(request: NextRequest) {
  const corsHeaders = buildCorsHeaders(request.nextUrl.pathname, request.headers.get('origin'));

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const response = NextResponse.next();
  corsHeaders.forEach((value, key) => response.headers.set(key, value));
  return response;
}

export const config = {
  matcher: '/v1/:path*',
};
