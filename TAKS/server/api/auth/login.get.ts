export default defineEventHandler((event) => {
    const config = useRuntimeConfig()

    const params = new URLSearchParams({
        client_id: config.googleClientId,
        redirect_uri: config.googleRedirectUri,
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
        scope: [
            'openid',
            'email',
            'profile',
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.metadata.readonly'
        ].join(' ')
    })

    return sendRedirect(
        event,
        `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    )
})