export interface User {
  _id: string;
  username: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Session {
  sessionId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  totalTokens?: number;
  model?: string;
  status?: string;
  title?: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: Source[];
  toolCalls?: ToolCall[];
}

export interface Source {
  type: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface ToolCall {
  toolName: string;
  input: Record<string, any>;
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface Tool {
  name: string;
  description: string;
  category: string;
  requiredPermission: string;
  parameters: Record<string, any>;
}

export interface ApprovalRequest {
  _id: string;
  userId: string;
  sessionId: string;
  toolName: string;
  input: Record<string, any>;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: number;
}

export interface ChatResponse {
  sessionId: string;
  response: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  duration: number;
  toolsUsed: string[];
  timestamp: string;
}
