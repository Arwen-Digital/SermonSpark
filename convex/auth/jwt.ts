/**
 * JWT utilities for custom authentication
 * Uses jose library for JWT operations
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

// JWT configuration
const JWT_ALGORITHM = 'HS256';
const JWT_EXPIRY_HOURS = 24;
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

export interface TokenPayload extends JWTPayload {
    userId: string;
    email: string;
    type: 'access' | 'refresh';
}

/**
 * Get the JWT secret as a Uint8Array for jose
 */
function getSecretKey(secret: string): Uint8Array {
    return new TextEncoder().encode(secret);
}

/**
 * Generate an access token (short-lived)
 */
export async function generateAccessToken(
    userId: string,
    email: string,
    secret: string
): Promise<string> {
    const secretKey = getSecretKey(secret);

    const token = await new SignJWT({
        userId,
        email,
        type: 'access',
    } as TokenPayload)
        .setProtectedHeader({ alg: JWT_ALGORITHM })
        .setIssuedAt()
        .setExpirationTime(`${JWT_EXPIRY_HOURS}h`)
        .setSubject(userId)
        .sign(secretKey);

    return token;
}

/**
 * Generate a refresh token (long-lived)
 */
export async function generateRefreshToken(
    userId: string,
    email: string,
    secret: string
): Promise<string> {
    const secretKey = getSecretKey(secret);

    const token = await new SignJWT({
        userId,
        email,
        type: 'refresh',
    } as TokenPayload)
        .setProtectedHeader({ alg: JWT_ALGORITHM })
        .setIssuedAt()
        .setExpirationTime(`${REFRESH_TOKEN_EXPIRY_DAYS}d`)
        .setSubject(userId)
        .sign(secretKey);

    return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(
    token: string,
    secret: string
): Promise<TokenPayload | null> {
    try {
        const secretKey = getSecretKey(secret);
        const { payload } = await jwtVerify(token, secretKey, {
            algorithms: [JWT_ALGORITHM],
        });

        return payload as TokenPayload;
    } catch {
        return null;
    }
}

/**
 * Extract user ID from a token without full verification
 * (Use only when you need to identify the user but will verify later)
 */
export function extractUserIdFromToken(token: string): string | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = JSON.parse(atob(parts[1]));
        return payload.userId || payload.sub || null;
    } catch {
        return null;
    }
}

/**
 * Check if a token is expired (without verification)
 */
export function isTokenExpired(token: string): boolean {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return true;

        const payload = JSON.parse(atob(parts[1]));
        if (!payload.exp) return true;

        return Date.now() >= payload.exp * 1000;
    } catch {
        return true;
    }
}

/**
 * Get token expiration timestamp
 */
export function getTokenExpiration(token: string): Date | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;

        const payload = JSON.parse(atob(parts[1]));
        if (!payload.exp) return null;

        return new Date(payload.exp * 1000);
    } catch {
        return null;
    }
}

/**
 * Calculate refresh token expiry date
 */
export function getRefreshTokenExpiry(): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    return expiry;
}
