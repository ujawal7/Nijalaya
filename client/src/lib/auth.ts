import { User } from "@shared/schema";

export class AuthService {
  private static readonly CURRENT_USER_KEY = "nijalaya-current-user";
  private static readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  static getCurrentUser(): User | null {
    try {
      const stored = localStorage.getItem(this.CURRENT_USER_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored);
      const user = data.user;
      const timestamp = data.timestamp;

      // Check if session has expired
      if (Date.now() - timestamp > this.SESSION_TIMEOUT) {
        this.clearCurrentUser();
        return null;
      }

      return user;
    } catch (error) {
      console.error("Failed to get current user:", error);
      this.clearCurrentUser();
      return null;
    }
  }

  static setCurrentUser(user: User): void {
    try {
      const data = {
        user,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to store current user:", error);
    }
  }

  static clearCurrentUser(): void {
    try {
      localStorage.removeItem(this.CURRENT_USER_KEY);
    } catch (error) {
      console.error("Failed to clear current user:", error);
    }
  }

  static refreshSession(): void {
    const user = this.getCurrentUser();
    if (user) {
      this.setCurrentUser(user);
    }
  }

  static validatePin(storedPin: string | null, enteredPin: string): boolean {
    if (!storedPin) return true; // No PIN required
    return storedPin === enteredPin;
  }

  static generateAvatar(name: string): string {
    // Generate a simple avatar based on initials
    const initials = name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    // Generate a consistent color based on the name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = Math.abs(hash) % 360;
    const backgroundColor = `hsl(${hue}, 70%, 60%)`;

    // Create a simple SVG avatar
    const svg = `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" fill="${backgroundColor}" rx="20"/>
        <text x="20" y="26" font-family="Inter, sans-serif" font-size="14" font-weight="600" 
              fill="white" text-anchor="middle">${initials}</text>
      </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }
}
