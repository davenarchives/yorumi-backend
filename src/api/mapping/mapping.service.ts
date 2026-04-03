import { redis } from './mapper';

// Redis Key Prefix for AniList -> Scraper mapping
const KEY_PREFIX = 'map:anilist:';
const MAPPING_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const mappingService = {
    getMapping: async (anilistId: string) => {
        try {
            const data = await redis.get<{ id: string; title: string; timestamp: number }>(KEY_PREFIX + anilistId);
            if (data?.timestamp && (Date.now() - Number(data.timestamp)) > MAPPING_TTL_MS) {
                await redis.del(KEY_PREFIX + anilistId).catch(() => undefined);
                return null;
            }
            return data || null;
        } catch (error) {
            console.error('Error reading mapping from Redis:', error);
            return null;
        }
    },

    saveMapping: async (anilistId: string, scraperId: string, title?: string) => {
        try {
            const mappingData = {
                id: scraperId,
                title: title || '',
                timestamp: Date.now()
            };

            await redis.set(KEY_PREFIX + anilistId, mappingData, { ex: Math.ceil(MAPPING_TTL_MS / 1000) });
            return true;
        } catch (error) {
            console.error('Error saving mapping to Redis:', error);
            return false;
        }
    },

    deleteMapping: async (anilistId: string) => {
        try {
            await redis.del(KEY_PREFIX + anilistId);
            console.log(`Deleted mapping for AniList ID: ${anilistId}`);
            return true;
        } catch (error) {
            console.error('Error deleting mapping from Redis:', error);
            return false;
        }
    }
};
