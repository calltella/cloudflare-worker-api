import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ findUserByEmail: vi.fn(), initializeUserSettings: vi.fn(), saveLoginHistory: vi.fn() }));
vi.mock('@/src/service/user.service', () => ({ findUserByEmail: mocks.findUserByEmail, saveLoginHistory: mocks.saveLoginHistory }));
vi.mock('@/src/service/settings.service', () => ({ initializeUserSettings: mocks.initializeUserSettings }));
vi.mock('next/headers', () => ({ headers: async () => new Headers() }));

import { requireAuth } from '@/lib/utils/auth';
import { POST as login, DELETE as logout } from '@/app/api/internal/token/access/route';
import { POST as refresh } from '@/app/api/internal/token/refresh/route';
import { POST as changePassword } from '@/app/api/user/password/route';

const identity = { id: '11111111-1111-4111-8111-111111111111', email: 'user@example.com', email_confirmed_at: '2026-01-01T00:00:00Z', role: 'authenticated', user_metadata: { role: 'admin' }, app_metadata: {} };
const applicationUser = { id: 'existing-d1-id', email: identity.email, name: 'Test user', role: 'user', isActive: true, deletedAt: null };
const jwt = `${Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')}.${Buffer.from(JSON.stringify({ sub: identity.id, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.signature`;
const session = { access_token: jwt, refresh_token: 'rotated-refresh-token', token_type: 'bearer', expires_in: 3600, user: identity };
let fetchMock: ReturnType<typeof vi.fn>;

function request(path: string, body?: unknown, token?: string, method = 'POST') {
  return new NextRequest(`http://localhost:3001/api/${path}`, {
    method,
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
function respond(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
}

beforeEach(() => {
  vi.stubEnv('SUPABASE_URL', 'https://auth.example.test');
  vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
  mocks.findUserByEmail.mockReset().mockResolvedValue(applicationUser);
  mocks.initializeUserSettings.mockReset().mockResolvedValue({ id: applicationUser.id, avatarURL: 'default.png', role: 'admin' });
  mocks.saveLoginHistory.mockReset().mockResolvedValue(undefined);
  fetchMock = vi.fn().mockImplementation(async (input: string | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes('/token?')) return respond(session);
    if (url.endsWith('/user')) return respond(identity);
    if (url.includes('/logout')) return new Response(null, { status: 204 });
    throw new Error(`Unexpected Supabase request: ${url} ${init?.method}`);
  });
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('Supabase authentication through the API', () => {
  it('logs in through Supabase, retains the D1 identity and role, and returns expiry timestamps', async () => {
    const res = await login(request('internal/token/access', { email: identity.email, password: 'password123' }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toMatchObject({ id: applicationUser.id, role: 'user', email: identity.email });
    expect(data.tokens).toMatchObject({ accessToken: jwt, refreshToken: session.refresh_token });
    expect(data.tokens.accessTokenExpiry).toBeGreaterThan(Date.now());
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('grant_type=password');
    expect(JSON.parse(init.body)).toMatchObject({ email: identity.email, password: 'password123' });
    expect(init.cache).toBe('no-store');
  });

  it('rejects invalid JSON without contacting Supabase', async () => {
    const res = await login(new NextRequest('http://localhost/api/internal/token/access', { method: 'POST', body: '{' }));
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects incorrect credentials', async () => {
    fetchMock.mockResolvedValue(respond({ code: 'invalid_credentials', msg: 'Invalid login credentials' }, 400));
    expect((await login(request('internal/token/access', { email: identity.email, password: 'wrong' }))).status).toBe(401);
    expect(mocks.findUserByEmail).not.toHaveBeenCalled();
  });

  it.each([
    ['unconfirmed', { ...identity, email_confirmed_at: undefined }],
    ['anonymous', { ...identity, is_anonymous: true }],
  ])('rejects a %s Supabase identity', async (_, user) => {
    fetchMock.mockImplementation(async (input: string | URL) => String(input).includes('/logout') ? new Response(null, { status: 204 }) : respond({ ...session, user }));
    expect((await login(request('internal/token/access', { email: identity.email, password: 'password123' }))).status).toBe(403);
    expect(mocks.findUserByEmail).not.toHaveBeenCalled();
  });

  it.each([null, { ...applicationUser, isActive: false }, { ...applicationUser, deletedAt: '2026-01-01' }])('rejects unregistered, disabled and deleted D1 users', async (user) => {
    mocks.findUserByEmail.mockResolvedValue(user);
    const result = await requireAuth(request('user', undefined, jwt, 'GET'));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it('verifies the bearer token with Supabase and uses D1 authorization, ignoring metadata', async () => {
    const result = await requireAuth(request('user', undefined, jwt, 'GET'));
    expect(result).toEqual({ ok: true, user: { sub: applicationUser.id, role: 'user', email: identity.email, name: applicationUser.name, supabaseId: identity.id } });
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://auth.example.test/auth/v1/user');
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('Authorization')).toBe(`Bearer ${jwt}`);
  });

  it('rejects missing bearer credentials without contacting Supabase', async () => {
    const result = await requireAuth(request('user', undefined, undefined, 'GET'));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects forged or expired tokens without querying D1', async () => {
    fetchMock.mockResolvedValue(respond({ code: 'bad_jwt', msg: 'Invalid JWT' }, 401));
    const result = await requireAuth(request('user', undefined, 'forged', 'GET'));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
    expect(mocks.findUserByEmail).not.toHaveBeenCalled();
  });

  it('refreshes without an access token and returns the rotated refresh token', async () => {
    const res = await refresh(request('internal/token/refresh', { refreshToken: 'old-refresh-token' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ refreshToken: 'rotated-refresh-token', accessToken: jwt });
    expect(String(fetchMock.mock.calls[0][0])).toContain('grant_type=refresh_token');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({ refresh_token: 'old-refresh-token' });
  });

  it('rejects an invalid refresh token', async () => {
    fetchMock.mockResolvedValue(respond({ code: 'refresh_token_not_found', msg: 'Invalid refresh token' }, 400));
    expect((await refresh(request('internal/token/refresh', { refreshToken: 'invalid' }))).status).toBe(401);
  });

  it('revokes the Supabase session on logout', async () => {
    const res = await logout(request('internal/token/access', undefined, jwt, 'DELETE'));
    expect(res.status).toBe(200);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/logout?scope=local'))).toBe(true);
  });

  it('changes the password at Supabase after verifying the current password', async () => {
    const res = await changePassword(request('user/password', { currentPassword: 'password123', newPassword: 'new-password123' }, jwt));
    expect(res.status).toBe(200);
    const update = fetchMock.mock.calls.find(([url, init]) => String(url).endsWith('/user') && init.method === 'PUT');
    expect(update).toBeDefined();
    expect(JSON.parse(update![1].body)).toMatchObject({ password: 'new-password123' });
  });
});
