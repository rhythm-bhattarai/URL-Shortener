export interface URLRecord {
    id: number;
    original_url: string;
    short_url: string;
    created_at: string;
}

export interface ShortenUrlRequest {
    original_url: string;
}

export interface RateLimiterResponse {
    error: string;
    retry_after_seconds: number; 
}