import pg from 'pg'

const { Pool } = pg

let pool: pg.Pool | null = null

export function useDb() {
    const config = useRuntimeConfig()

    if (!pool) {
        pool = new Pool({
            connectionString: config.databaseUrl
        })
    }

    return pool
}