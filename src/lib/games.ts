import { eq, asc, and } from 'drizzle-orm';
import type { Database } from './db';
import { games, categories, publishers } from '../../db/schema';
import type { Game } from '../types/game';

export interface GameFilters {
    publisherId?: number | null;
    categoryId?: number | null;
}

const gameSelection = {
    id: games.id,
    title: games.title,
    description: games.description,
    starRating: games.starRating,
    categoryId: categories.id,
    categoryName: categories.name,
    publisherId: publishers.id,
    publisherName: publishers.name,
};

type GameSelectionRow = {
    id: number;
    title: string;
    description: string;
    starRating: number | null;
    categoryId: number | null;
    categoryName: string | null;
    publisherId: number | null;
    publisherName: string | null;
};

function mapGame(row: GameSelectionRow): Game {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        starRating: row.starRating,
        category:
            row.categoryId !== null && row.categoryName !== null
                ? { id: row.categoryId, name: row.categoryName }
                : null,
        publisher:
            row.publisherId !== null && row.publisherName !== null
                ? { id: row.publisherId, name: row.publisherName }
                : null,
    };
}

function applyGameFilters(query: ReturnType<typeof baseGamesQuery>, filters: GameFilters = {}) {
    const conditions = [];

    if (filters.publisherId !== undefined && filters.publisherId !== null) {
        conditions.push(eq(games.publisherId, filters.publisherId));
    }

    if (filters.categoryId !== undefined && filters.categoryId !== null) {
        conditions.push(eq(games.categoryId, filters.categoryId));
    }

    return conditions.length > 0 ? query.where(and(...conditions)) : query;
}

function baseGamesQuery(db: Database) {
    return db
        .select(gameSelection)
        .from(games)
        .leftJoin(categories, eq(games.categoryId, categories.id))
        .leftJoin(publishers, eq(games.publisherId, publishers.id));
}

/** All games ordered by title, optionally filtered by publisher or category. */
export async function getAllGames(db: Database, filters: GameFilters = {}): Promise<Game[]> {
    const rows = await applyGameFilters(baseGamesQuery(db), filters).orderBy(asc(games.title));
    return rows.map(mapGame);
}

/** All game ids ordered by title, optionally filtered by publisher or category. */
export async function getAllGameIds(db: Database, filters: GameFilters = {}): Promise<number[]> {
    const conditions = [];

    if (filters.publisherId !== undefined && filters.publisherId !== null) {
        conditions.push(eq(games.publisherId, filters.publisherId));
    }

    if (filters.categoryId !== undefined && filters.categoryId !== null) {
        conditions.push(eq(games.categoryId, filters.categoryId));
    }

    const query =
        conditions.length > 0
            ? db.select({ id: games.id }).from(games).where(and(...conditions))
            : db.select({ id: games.id }).from(games);

    const rows = await query.orderBy(asc(games.title));
    return rows.map((row) => row.id);
}

/** A single game by id, or null when it does not exist. */
export async function getGameById(db: Database, id: number): Promise<Game | null> {
    const row = await baseGamesQuery(db).where(eq(games.id, id)).get();
    return row ? mapGame(row) : null;
}
