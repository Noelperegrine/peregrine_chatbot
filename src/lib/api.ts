import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add JWT token
    this.client.interceptors.request.use(
      (config) => {
        // Read token from Zustand persist storage
        if (typeof window !== 'undefined') {
          try {
            const authStorage = localStorage.getItem('auth-storage');
            if (authStorage) {
              const { state } = JSON.parse(authStorage);
              if (state?.token) {
                config.headers.Authorization = `Bearer ${state.token}`;
              }
            }
          } catch (error) {
            console.error('Failed to read auth token:', error);
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - clear storage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-storage');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(email: string, password: string) {
    const response = await this.client.post('/api/auth/login', { email, password });
    return response.data;
  }

  async register(email: string, password: string, role: string = 'user') {
    const response = await this.client.post('/api/auth/register', { email, password, role });
    return response.data;
  }

  // Sessions
  async createSession(userId: string) {
    const response = await this.client.post('/api/sessions', { userId });
    return response.data;
  }

  async getSessions() {
    // The API automatically filters by authenticated user from JWT
    const response = await this.client.get('/api/sessions');
    return response.data;
  }

  async getSession(sessionId: string) {
    const response = await this.client.get(`/api/sessions/${sessionId}`);
    return response.data;
  }

  // Chat
  async sendQuery(sessionId: string | undefined, query: string, stream: boolean = false) {
    const body: any = {
      query,
      stream,
    };
    
    // Only include sessionId if it exists
    if (sessionId) {
      body.sessionId = sessionId;
    }
    
    const response = await this.client.post('/api/chat', body);
    return response.data;
  }

  // SSE Stream (for streaming responses)
  createEventSource(sessionId: string, query: string, token: string): EventSource {
    const url = `${API_BASE_URL}/chat/stream?sessionId=${sessionId}&query=${encodeURIComponent(query)}&token=${token}`;
    return new EventSource(url);
  }

  // Tools
  async getTools() {
    const response = await this.client.get('/api/tools');
    return response.data;
  }

  // Health
  async healthCheck() {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Approvals
  async getApprovals(status?: string) {
    // The API automatically filters by authenticated user from JWT
    const params = status ? { status } : {};
    const response = await this.client.get('/api/approvals', { params });
    return response.data;
  }

  async approveRequest(requestId: string, userId: string) {
    const response = await this.client.post(`/api/approvals/${requestId}/approve`, { userId });
    return response.data;
  }

  async denyRequest(requestId: string, userId: string, reason?: string) {
    const response = await this.client.post(`/api/approvals/${requestId}/deny`, { userId, reason });
    return response.data;
  }

  // Cache
  async getCacheStats() {
    const response = await this.client.get('/api/cache/stats');
    return response.data;
  }

  async clearCache() {
    const response = await this.client.post('/api/cache/clear');
    return response.data;
  }

  // Document Upload & Ingestion
  async uploadDocument(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ chunks: number; embeddings: number; documentId: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return response.data;
  }

  async getDocuments() {
    const response = await this.client.get('/api/documents');
    return response.data;
  }

  async deleteDocument(documentId: string) {
    const response = await this.client.delete(`/api/documents/${documentId}`);
    return response.data;
  }
}

export const api = new ApiClient();
export default api;
