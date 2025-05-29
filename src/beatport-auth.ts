import axios from 'axios';
import { URLSearchParams } from 'url';

export interface BeatportCredentials {
  username: string;
  password: string;
  clientId?: string;
  clientSecret?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

/**
 * Handles Beatport OAuth2 authentication
 */
export class BeatportAuth {
  private credentials: BeatportCredentials;
  private accessToken?: string;
  private refreshToken?: string;
  private tokenExpiry?: Date;

  // Default Beatport API client credentials
  private static readonly DEFAULT_CLIENT_ID = process.env.BEATPORT_DEFAULT_CLIENT_ID || 'MTZS0g1HCT1RIyBeJFCq7N6aBRbeEDDJlDC397ht';
  private static readonly DEFAULT_CLIENT_SECRET = process.env.BEATPORT_DEFAULT_CLIENT_SECRET || '';

  constructor(credentials: BeatportCredentials) {
    this.credentials = {
      ...credentials,
      clientId: credentials.clientId || BeatportAuth.DEFAULT_CLIENT_ID,
      clientSecret: credentials.clientSecret || BeatportAuth.DEFAULT_CLIENT_SECRET,
    };

    if (!this.credentials.clientId) {
      throw new Error('Beatport client ID is required. Please set BEATPORT_DEFAULT_CLIENT_ID environment variable.');
    }

    // Client secret might not be required for public clients
    if (!this.credentials.clientSecret) {
      console.warn('Warning: No client secret provided. Attempting public client flow.');
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getAccessToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.accessToken!;
    }

    if (this.refreshToken) {
      try {
        await this.refreshAccessToken();
        return this.accessToken!;
      } catch (error) {
        console.warn('Failed to refresh token, requesting new one:', error);
      }
    }

    await this.requestNewToken();
    return this.accessToken!;
  }

  /**
   * Get authorization headers for API requests
   */
  async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.getAccessToken();
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  /**
   * Check if current token is valid
   */
  private isTokenValid(): boolean {
    return !!(
      this.accessToken &&
      this.tokenExpiry &&
      this.tokenExpiry > new Date(Date.now() + 60000) // 1 minute buffer
    );
  }

  /**
   * Request a new access token using username/password
   */
  private async requestNewToken(): Promise<void> {
    try {
      const requestData = new URLSearchParams({
        client_id: this.credentials.clientId!,
        username: this.credentials.username,
        password: this.credentials.password,
        grant_type: 'password',
      });

      // Only include client_secret if we have one
      if (this.credentials.clientSecret) {
        requestData.append('client_secret', this.credentials.clientSecret);
      }

      const response = await axios.post<TokenResponse>(
        'https://api.beatport.com/v4/auth/o/token/', 
        requestData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.setTokenData(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data ? 
          `${error.response.status} ${error.response.statusText}: ${JSON.stringify(error.response.data)}` :
          `${error.response?.status} ${error.response?.statusText}`;
        throw new Error(`Beatport authentication failed: ${errorMsg}`);
      }
      throw error;
    }
  }

  /**
   * Refresh the access token using refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const requestData = new URLSearchParams({
        client_id: this.credentials.clientId!,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      });

      // Only include client_secret if we have one
      if (this.credentials.clientSecret) {
        requestData.append('client_secret', this.credentials.clientSecret);
      }

      const response = await axios.post<TokenResponse>(
        'https://api.beatport.com/v4/auth/o/token/', 
        requestData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.setTokenData(response.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMsg = error.response?.data ? 
          `${error.response.status} ${error.response.statusText}: ${JSON.stringify(error.response.data)}` :
          `${error.response?.status} ${error.response?.statusText}`;
        throw new Error(`Token refresh failed: ${errorMsg}`);
      }
      throw error;
    }
  }

  /**
   * Set token data from API response
   */
  private setTokenData(tokenData: TokenResponse): void {
    this.accessToken = tokenData.access_token;
    this.refreshToken = tokenData.refresh_token;
    this.tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);
  }
}
