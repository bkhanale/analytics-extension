export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export interface Rule {
  id: string;
  urlPattern: string; // glob
  methods: HttpMethod[];
  requestVar?: string;
  responseVar?: string;
}

export interface PageConfig {
  id: string;
  pagePattern: string; // glob
  enabled: boolean;
  rules: Rule[];
}

export interface NetworkLog {
  id: string;
  method: string;
  url: string;
  status: number;
  requestBody?: string | object | null;
  responseBody?: string | object | null;
  timestamp: number;
  type: 'fetch' | 'xhr';
  // Extracted values
  extractedRequestVar?: any;
  extractedResponseVar?: any;
}

export interface NetworkEventMessage {
  type: 'NETWORK_EVENT';
  payload: NetworkLog;
}
