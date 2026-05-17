import crypto from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'

function getEncryptionKey() {
    const config = useRuntimeConfig()
    return crypto
        .createHash('sha256')
        .update(config.tokenEncryptionKey)
        .digest()
}

export function encryptToken(token: string | null | undefined) {
    if (!token) return null

    const key = getEncryptionKey()
    const iv = crypto.randomBytes(12)

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    const encrypted = Buffer.concat([
        cipher.update(token, 'utf8'),
        cipher.final()
    ])

    const authTag = cipher.getAuthTag()

    return [
        iv.toString('base64'),
        authTag.toString('base64'),
        encrypted.toString('base64')
    ].join(':')
}

export function decryptToken(encryptedToken: string | null | undefined) {
    if (!encryptedToken) return null

    const parts = encryptedToken.split(':')

    if (parts.length !== 3) {
        throw new Error('Token chiffré invalide')
    }

    const [ivBase64, authTagBase64, encryptedBase64] = parts as [
        string,
        string,
        string
    ]

    const key = getEncryptionKey()

    const iv = Buffer.from(ivBase64, 'base64')
    const authTag = Buffer.from(authTagBase64, 'base64')
    const encrypted = Buffer.from(encryptedBase64, 'base64')

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
    ])

    return decrypted.toString('utf8')
}