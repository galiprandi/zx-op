import axios from 'axios';

// Types para SystemSetting
export interface SystemSetting {
  id: string;
  maxOccupancy: number;
  siteName?: string;
  logoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const systemSettingsApi = {
  // Obtener configuración del sistema
  async getSettings(): Promise<SystemSetting> {
    const response = await axios.get(`${API_BASE_URL}/api/system/settings`);
    return response.data;
  },

  // Actualizar configuración del sistema
  async updateSettings(settings: Partial<SystemSetting>): Promise<SystemSetting> {
    const response = await axios.put(`${API_BASE_URL}/api/system/settings`, settings);
    return response.data;
  }
};
