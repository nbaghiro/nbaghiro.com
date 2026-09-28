/**
 * Chat Budget - daily spend cap and per-visitor question limit
 * Counters live in Render Key Value (Redis) when REDIS_URL is set, so they
 * survive the free web instance sleeping and restarting. Without it (local
 * dev) they fall back to this process's memory.
 */

import { createClient } from "redis";

const DAILY_CAP_USD = Number(process.env.CHAT_DAILY_CAP_USD || 5);
const QUESTIONS_PER_VISITOR = Number(process.env.CHAT_QUESTIONS_PER_VISITOR || 10);
const KEY_TTL_SECONDS = 2 * 24 * 60 * 60;

// USD per million tokens. Fallbacks may run on another model; Opus-tier
// prices are the highest of the fallback targets, so this never undercounts.
const PRICING = {
    "claude-opus-5": { input: 5, output: 25 },
    "claude-sonnet-5": { input: 2, output: 10 },
};
const DEFAULT_PRICE = PRICING["claude-opus-5"];

const memory = new Map();
let redis = null;

async function getRedis() {
    if (!process.env.REDIS_URL) return null;
    if (!redis) {
        redis = createClient({ url: process.env.REDIS_URL });
        redis.on("error", (error) => console.error("[ChatBudget] Redis error:", error.message));
        await redis.connect();
    }
    return redis;
}

function today() {
    return new Date().toISOString().slice(0, 10);
}

async function increment(key, by) {
    const store = await getRedis();
    if (store) {
        const value = await store.incrByFloat(key, by);
        await store.expire(key, KEY_TTL_SECONDS);
        return Number(value);
    }
    const value = (memory.get(key) || 0) + by;
    memory.set(key, value);
    return value;
}

async function read(key) {
    const store = await getRedis();
    if (store) return Number((await store.get(key)) || 0);
    return memory.get(key) || 0;
}

/**
 * Cost of one API response in USD
 * @param {string} model
 * @param {Object} usage - response.usage
 */
export function costOf(model, usage) {
    const price = PRICING[model] || DEFAULT_PRICE;
    const input =
        (usage.input_tokens || 0) +
        (usage.cache_creation_input_tokens || 0) * 1.25 +
        (usage.cache_read_input_tokens || 0) * 0.1;
    return (input * price.input + (usage.output_tokens || 0) * price.output) / 1e6;
}

export async function recordSpend(usd) {
    await increment(`chat:spend:${today()}`, usd);
}

/**
 * Check both limits before a question runs, and count the question
 * @param {string} visitorKey - client IP
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
export async function checkLimits(visitorKey) {
    if ((await read(`chat:spend:${today()}`)) >= DAILY_CAP_USD) {
        return { ok: false, reason: "The chat has reached its daily budget. It will be back tomorrow." };
    }
    const asked = await increment(`chat:visitor:${today()}:${visitorKey}`, 1);
    if (asked > QUESTIONS_PER_VISITOR) {
        return { ok: false, reason: "You have reached today's question limit. Try again tomorrow." };
    }
    return { ok: true };
}
