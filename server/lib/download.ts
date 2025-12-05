import jwt from 'jsonwebtoken';

const DOWNLOAD_TOKEN_SECRET = process.env.DOWNLOAD_TOKEN_SECRET || 'fallback-secret-key-change-in-production';

export interface DownloadTokenPayload {
  userId: string;
  productId: string;
  exp: number;
}

export function createDownloadToken(userId: string, productId: string): string {
  const payload: DownloadTokenPayload = {
    userId,
    productId,
    exp: Math.floor(Date.now() / 1000) + (10 * 60) // 10 minutes
  };

  return jwt.sign(payload, DOWNLOAD_TOKEN_SECRET);
}

export function verifyDownloadToken(token: string): DownloadTokenPayload | null {
  try {
    const payload = jwt.verify(token, DOWNLOAD_TOKEN_SECRET) as DownloadTokenPayload;
    
    // Check if token is expired
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}