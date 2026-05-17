export default defineEventHandler(async (event) => {
    const session = await getUserSession(event)

    if (!session.user) {
        throw createError({
            statusCode: 401,
            statusMessage: 'Utilisateur non connecté'
        })
    }

    return {
        user: session.user
    }
})