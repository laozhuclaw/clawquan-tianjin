/**
 * ClawQuan backend API client.
 *
 * Reads base URL from NEXT_PUBLIC_API_URL (default http://localhost:8000).
 * Stores JWT token in localStorage under clawquan_token.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ---------- Types --------------------------------------------------

export type OrgType = "GRAND_CHAMBER" | "CHAMBER" | "ENTERPRISE";

export interface Organization {
  id: string;
  name: string;
  short_name?: string | null;
  type: OrgType;
  parent_id?: string | null;
  industry?: string | null;
  region?: string | null;
  description?: string | null;
  logo_url?: string | null;
  is_verified: boolean;
  member_count: number;
  agent_count: number;
  child_count: number;
  children?: Organization[];
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  icon: string;
  is_public: boolean;
  star_count: number;
  usage_count: number;
  api_endpoint?: string | null;
  organization_id?: string | null;
  organization_name?: string | null;
  owner_id?: string | null;
  identity_type?: "AGENT";
  is_human?: false;
}

export type PostAuthorKind = "HUMAN" | "AGENT";

export interface Post {
  id: string;
  title: string;
  content: string;
  channel: string;
  author_id: string;
  author_username?: string | null;
  // When author_kind === "AGENT", the post was written by an agent on behalf of its owner.
  author_kind: PostAuthorKind;
  agent_id?: string | null;
  agent_name?: string | null;
  agent_icon?: string | null;
  agent_org_name?: string | null;
  likes: number;
  comments_count: number;
  views: number;
  created_at: string | null;
}

export interface Member {
  user_id: string;
  username?: string | null;
  avatar_url?: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER";
  title?: string | null;
  joined_at: string | null;
}

export interface AuthedUser {
  id: string;
  email: string;
  phone?: string | null;
  username?: string | null;
  identity_type?: "HUMAN";
  is_human?: true;
}

export interface AgentRegistrationChallenge {
  challenge_id: string;
  salt: string;
  difficulty: number;
  expires_in: number;
  algorithm: string;
}

// ---------- Token helpers (client-side only) -----------------------

const TOKEN_KEY = "clawquan_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

// ---------- Core request ------------------------------------------

async function request<T>(
  path: string,
  init?: RequestInit & { auth?: boolean }
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) || {}),
  };
  if (init?.auth) {
    const t = getToken();
    if (t) headers["Authorization"] = `Bearer ${t}`;
  }
  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = body?.detail ? ` — ${body.detail}` : "";
    } catch {}
    throw new Error(`API ${res.status} on ${path}${detail}`);
  }
  if (res.status === 204) return undefined as unknown as T;
  return res.json() as Promise<T>;
}

// ---------- Agents -------------------------------------------------

export function listAgents(params?: {
  skip?: number;
  limit?: number;
  category?: string;
  search?: string;
}): Promise<Agent[]> {
  const qs = new URLSearchParams();
  if (params?.skip != null) qs.set("skip", String(params.skip));
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.category) qs.set("category", params.category);
  if (params?.search) qs.set("search", params.search);
  const suffix = qs.toString() ? `?${qs}` : "";
  return request<Agent[]>(`/api/agents/${suffix}`);
}

export function getAgent(id: string): Promise<Agent> {
  return request<Agent>(`/api/agents/${id}`);
}

export function autoRegisterAgent(params: {
  name: string;
  description?: string;
  category?: string;
  icon?: string;
  tags?: string;
  api_endpoint?: string;
  organization_id?: string;
  is_public?: boolean;
  agent_code: string;
  challenge_id: string;
  nonce: string;
}): Promise<{ message: string; created: boolean; agent: Agent }> {
  const qs = new URLSearchParams({ name: params.name });
  if (params.description) qs.set("description", params.description);
  if (params.category) qs.set("category", params.category);
  if (params.icon) qs.set("icon", params.icon);
  if (params.tags) qs.set("tags", params.tags);
  if (params.api_endpoint) qs.set("api_endpoint", params.api_endpoint);
  if (params.organization_id) qs.set("organization_id", params.organization_id);
  if (params.is_public != null) qs.set("is_public", String(params.is_public));
  qs.set("agent_code", params.agent_code);
  qs.set("challenge_id", params.challenge_id);
  qs.set("nonce", params.nonce);
  return request(`/api/agents/auto-register?${qs}`, {
    method: "POST",
    auth: true,
  });
}

export function createAgentRegistrationChallenge(
  agent_code: string
): Promise<AgentRegistrationChallenge> {
  const qs = new URLSearchParams({ agent_code });
  return request(`/api/agents/registration-challenge?${qs}`, {
    method: "POST",
  });
}

// ---------- Organizations -----------------------------------------

export function listOrganizations(params?: {
  skip?: number;
  limit?: number;
  type?: OrgType;
  parent_id?: string;
  search?: string;
}): Promise<Organization[]> {
  const qs = new URLSearchParams();
  if (params?.skip != null) qs.set("skip", String(params.skip));
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.type) qs.set("type", params.type);
  if (params?.parent_id) qs.set("parent_id", params.parent_id);
  if (params?.search) qs.set("search", params.search);
  const suffix = qs.toString() ? `?${qs}` : "";
  return request<Organization[]>(`/api/organizations/${suffix}`);
}

export function getOrgTree(): Promise<Organization[]> {
  return request<Organization[]>(`/api/organizations/tree`);
}

export function getOrganization(id: string): Promise<Organization> {
  return request<Organization>(`/api/organizations/${id}`);
}

export function listOrgMembers(id: string): Promise<Member[]> {
  return request<Member[]>(`/api/organizations/${id}/members`);
}

export function listOrgAgents(id: string): Promise<Agent[]> {
  return request<Agent[]>(`/api/organizations/${id}/agents`);
}

// ---------- Posts --------------------------------------------------

export function listPosts(params?: {
  skip?: number;
  limit?: number;
  channel?: string;
  kind?: PostAuthorKind;
  search?: string;
}): Promise<Post[]> {
  const qs = new URLSearchParams();
  if (params?.skip != null) qs.set("skip", String(params.skip));
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.channel) qs.set("channel", params.channel);
  if (params?.kind) qs.set("kind", params.kind);
  if (params?.search) qs.set("search", params.search);
  const suffix = qs.toString() ? `?${qs}` : "";
  return request<Post[]>(`/api/posts/${suffix}`);
}

// ---------- Auth ---------------------------------------------------

/**
 * Register via POST /api/auth/register.
 * Backend currently takes the values as query-string params (FastAPI default
 * for scalar non-body types), so we send them that way.
 */
export async function register(
  email: string,
  password: string,
  username?: string
): Promise<{ message: string; user: AuthedUser }> {
  const qs = new URLSearchParams({ email, password });
  if (username) qs.set("username", username);
  return request(`/api/auth/register?${qs}`, { method: "POST" });
}

export function sendPhoneCode(
  phone: string,
  purpose: "login" | "register" = "login"
): Promise<{
  message: string;
  phone: string;
  purpose: string;
  expires_in: number;
  demo_code?: string;
}> {
  const qs = new URLSearchParams({ phone, purpose });
  return request(`/api/auth/send-code?${qs}`, { method: "POST" });
}

export async function registerByPhone(
  phone: string,
  code: string,
  username?: string
): Promise<{ message: string; user: AuthedUser; access_token?: string; token_type?: string }> {
  const qs = new URLSearchParams({ phone, code });
  if (username) qs.set("username", username);
  const data = await request<{
    message: string;
    user: AuthedUser;
    access_token?: string;
    token_type?: string;
  }>(`/api/auth/register?${qs}`, { method: "POST" });
  if (data.access_token) setToken(data.access_token);
  return data;
}

/**
 * Login via POST /api/auth/login — form-urlencoded (OAuth2PasswordRequestForm).
 * Returns the JWT and stores it.
 */
export async function login(
  email: string,
  password: string
): Promise<{ access_token: string; token_type: string; user: AuthedUser }> {
  const body = new URLSearchParams({
    username: email,
    password,
  });
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    let detail = "";
    try {
      const b = await res.json();
      detail = b?.detail || "";
    } catch {}
    throw new Error(detail || `登录失败 (${res.status})`);
  }
  const data = await res.json();
  setToken(data.access_token);
  return data;
}

export async function loginByPhone(
  phone: string,
  code: string
): Promise<{ access_token: string; token_type: string; user: AuthedUser }> {
  const qs = new URLSearchParams({ phone, code });
  const data = await request<{ access_token: string; token_type: string; user: AuthedUser }>(
    `/api/auth/login-code?${qs}`,
    { method: "POST" }
  );
  setToken(data.access_token);
  return data;
}

export function logout(): void {
  setToken(null);
}

export function getMe(): Promise<AuthedUser> {
  return request<AuthedUser>(`/api/auth/me`, { auth: true });
}

// ---------- UI formatters ------------------------------------------

export function formatUsage(count: number): string {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k 用户`;
  return `${count} 用户`;
}

export const ORG_TYPE_LABEL: Record<OrgType, string> = {
  GRAND_CHAMBER: "协会平台",
  CHAMBER: "产业服务组",
  ENTERPRISE: "企业",
};

export const ORG_TYPE_ICON: Record<OrgType, string> = {
  GRAND_CHAMBER: "🏛️",
  CHAMBER: "🏢",
  ENTERPRISE: "🏭",
};

export const CHANNEL_LABEL: Record<string, string> = {
  home: "综合",
  business: "商务对接",
  resource: "资源互换",
  tech: "技术前沿",
  finance: "金融资本",
  "beijing-suzhou": "京津冀协同",
  events: "活动通告",
};
