import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AiProxyService {
  constructor(private readonly config: ConfigService) {}

  private serviceHeaders(userAuthorization?: string): Record<string, string> {
    const token = this.config.get<string>('app.internalServiceToken', '');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (!token) {
      if (this.config.get<string>('NODE_ENV') === 'production') {
        throw new ServiceUnavailableException('AI proxy is not configured');
      }
      if (userAuthorization) {
        headers.Authorization = userAuthorization;
      }
      return headers;
    }

    headers['X-QalaGo-Service-Token'] = token;
    if (userAuthorization) {
      headers.Authorization = userAuthorization;
    }
    return headers;
  }

  private baseUrl(): string {
    return `${this.config.get<string>('app.aiOrchestratorUrl', 'http://localhost:3004')}/api/v1`;
  }

  async post<T>(
    path: string,
    body: unknown,
    userAuthorization?: string,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl()}${path}`, {
      method: 'POST',
      headers: this.serviceHeaders(userAuthorization),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new InternalServerErrorException(text || response.statusText);
    }

    return response.json() as Promise<T>;
  }
}
