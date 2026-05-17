export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const query = getQuery(event)

    const code = query.code as string | undefined

    if (!code) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Code OAuth manquant'
        })
    }

    const tokenResponse = await $fetch<{
        access_token: string
        refresh_token?: string
        expires_in: number
        token_type: string
        scope: string
        id_token?: string
    }>('https://oauth2.googleapis.com/token', {
        method: 'POST',
        body: {
            code,
            client_id: config.googleClientId,
            client_secret: config.googleClientSecret,
            redirect_uri: config.googleRedirectUri,
            grant_type: 'authorization_code'
        }
    })

    const googleUser = await $fetch<{
        id: string
        email: string
        name: string
        picture: string
    }>('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`
        }
    })

    const db = useDb()

    const encryptedAccessToken = encryptToken(tokenResponse.access_token)
    const encryptedRefreshToken = encryptToken(tokenResponse.refresh_token)
    const tokenExpiresAt = new Date(
        Date.now() + tokenResponse.expires_in * 1000
    )

    await db.query(
        `
  insert into google_connections (
    google_user_id,
    email,
    name,
    picture,
    access_token,
    refresh_token,
    token_expires_at,
    scopes,
    updated_at
  )
  values ($1, $2, $3, $4, $5, $6, $7, $8, now())
  on conflict (google_user_id)
  do update set
    email = excluded.email,
    name = excluded.name,
    picture = excluded.picture,
    access_token = excluded.access_token,
    refresh_token = coalesce(excluded.refresh_token, google_connections.refresh_token),
    token_expires_at = excluded.token_expires_at,
    scopes = excluded.scopes,
    updated_at = now()
  `,
        [
            googleUser.id,
            googleUser.email,
            googleUser.name,
            googleUser.picture,
            encryptedAccessToken,
            encryptedRefreshToken ?? null,
            tokenExpiresAt,
            tokenResponse.scope
        ]
    )

    await setUserSession(event, {
        user: {
            googleId: googleUser.id,
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture
        },
    })

    return sendRedirect(event, '/')
})