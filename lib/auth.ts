import { fetchAPI } from './api';

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const formData = new URLSearchParams();
  formData.append('username', email); // FastAPI OAuth2 uses 'username'
  formData.append('password', password);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8100/api/v1"}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Login failed');
  }

  return response.json();
}

export async function signup(data: SignupData) {
  return fetchAPI('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
  }
}
