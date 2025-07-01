export class StorageService {
  private static readonly PREFIX = "nijalaya-";

  static setItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(this.PREFIX + key, serialized);
    } catch (error) {
      console.error(`Failed to store item ${key}:`, error);
    }
  }

  static getItem<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const item = localStorage.getItem(this.PREFIX + key);
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch (error) {
      console.error(`Failed to retrieve item ${key}:`, error);
      return defaultValue;
    }
  }

  static removeItem(key: string): void {
    try {
      localStorage.removeItem(this.PREFIX + key);
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
    }
  }

  static clear(): void {
    try {
      // Remove only items with our prefix
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.PREFIX)
      );
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error("Failed to clear storage:", error);
    }
  }

  static exportData(): string {
    try {
      const data: Record<string, any> = {};
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.PREFIX)
      );
      
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          data[key.replace(this.PREFIX, "")] = JSON.parse(value);
        }
      });

      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error("Failed to export data:", error);
      return "{}";
    }
  }

  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      Object.entries(data).forEach(([key, value]) => {
        this.setItem(key, value);
      });

      return true;
    } catch (error) {
      console.error("Failed to import data:", error);
      return false;
    }
  }

  static getStorageUsage(): { used: number; available: number; total: number } {
    try {
      let used = 0;
      const keys = Object.keys(localStorage).filter(key => 
        key.startsWith(this.PREFIX)
      );
      
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          used += value.length;
        }
      });

      // Estimate total localStorage capacity (usually 5-10MB)
      const total = 5 * 1024 * 1024; // 5MB estimate
      const available = total - used;

      return { used, available, total };
    } catch (error) {
      console.error("Failed to calculate storage usage:", error);
      return { used: 0, available: 0, total: 0 };
    }
  }
}
