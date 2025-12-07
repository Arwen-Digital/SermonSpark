/**
 * Password utilities for custom authentication
 * Uses Web Crypto API for hashing (compatible with Convex runtime)
 */

/**
 * Password validation requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export interface PasswordValidationResult {
    isValid: boolean;
    errors: string[];
}

// Common weak passwords to reject
const WEAK_PASSWORDS = new Set([
    'password', 'password1', 'password123', '12345678', '123456789',
    'qwerty123', 'letmein', 'welcome', 'admin123', 'abc12345',
    'iloveyou', 'sunshine', 'princess', 'football', 'monkey123',
]);

/**
 * Validate password strength according to requirements
 */
export function validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (WEAK_PASSWORDS.has(password.toLowerCase())) {
        errors.push('This password is too common. Please choose a stronger password');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Generate a random salt for password hashing
 */
function generateSalt(length: number = 16): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a password using PBKDF2 with SHA-256
 * Returns format: algorithm$iterations$salt$hash
 */
export async function hashPassword(password: string): Promise<string> {
    const salt = generateSalt();
    const iterations = 100000; // High iteration count for security

    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = encoder.encode(salt);

    // Import password as key
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits']
    );

    // Derive hash using PBKDF2
    const hashBuffer = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: saltBuffer,
            iterations,
            hash: 'SHA-256',
        },
        keyMaterial,
        256 // 256 bits = 32 bytes
    );

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return `pbkdf2$${iterations}$${salt}$${hashHex}`;
}

/**
 * Verify a password against a stored hash
 * Uses constant-time comparison to prevent timing attacks
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const parts = storedHash.split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
        return false;
    }

    const [, iterationsStr, salt, expectedHash] = parts;
    const iterations = parseInt(iterationsStr, 10);

    if (isNaN(iterations) || iterations < 1) {
        return false;
    }

    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = encoder.encode(salt);

    try {
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveBits']
        );

        const hashBuffer = await crypto.subtle.deriveBits(
            {
                name: 'PBKDF2',
                salt: saltBuffer,
                iterations,
                hash: 'SHA-256',
            },
            keyMaterial,
            256
        );

        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        // Constant-time comparison
        return constantTimeEqual(computedHash, expectedHash);
    } catch {
        return false;
    }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
}

/**
 * Hash a token (for storing refresh token hashes)
 */
export async function hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
