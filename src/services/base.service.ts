const DEFAULT_TOKEN_KEY = 'mahjongToken';

export abstract class BaseService {
  protected readonly baseUrl = import.meta.env.VITE_API_BASE_URL as string;

  protected get tokenKey(): string {
    return DEFAULT_TOKEN_KEY;
  }

  protected getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  protected setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  protected clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  protected getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  protected async get<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    this.captureRefreshedToken(res);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  protected async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    this.captureRefreshedToken(res);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  protected async delete<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    this.captureRefreshedToken(res);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  private captureRefreshedToken(res: Response): void {
    const authHeader = res.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      this.setToken(authHeader.slice(7));
    }
  }
}
