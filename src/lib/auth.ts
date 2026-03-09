const SENHA_CORRETA = ["Jota1@@jota79", "Jota1@@jota80"] ;
const STORAGE_KEY = 'jota-auth';

export function isAuthenticated(): boolean {
  return localStorage.getItem(STORAGE_KEY) === '1';
}

export function login(senha: string): boolean {

  if (SENHA_CORRETA.includes(senha)) {
    localStorage.setItem(STORAGE_KEY, '1');
    return true;
  }
  return false;
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEY);
}
