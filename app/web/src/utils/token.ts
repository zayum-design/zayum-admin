const MEMBER_TOKEN_KEY = 'member_token';

export const token = {
  get(): string | null {
    return localStorage.getItem(MEMBER_TOKEN_KEY);
  },
  
  set(token: string): void {
    localStorage.setItem(MEMBER_TOKEN_KEY, token);
  },
  
  remove(): void {
    localStorage.removeItem(MEMBER_TOKEN_KEY);
  },
};
