import { mockUsers } from "../data/mockUsers.js";
import { STORAGE_KEYS } from "./storage.js";
export const authService = {
  demoCredentials: {
    username: mockUsers[0].email,
    password: mockUsers[0].password,
  },
  async getSession() {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.session) || "null",
      );
      const match = mockUsers.find((u) => u.id === saved?.id);
      if (!match) return null;
      const { password: _PASSWORD, ...session } = match;
      return session;
    } catch {
      return null;
    }
  },
  async login(username, password) {
    const user = mockUsers.find(
      (u) =>
        (u.email === username.trim().toLowerCase() ||
          u.username === username.trim().toLowerCase()) &&
        u.password === password,
    );
    if (!user) throw new Error("Usuario o contraseña incorrectos.");
    const { password: _PASSWORD, ...session } = user;
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
    return session;
  },
  async logout() {
    localStorage.removeItem(STORAGE_KEYS.session);
  },
};
