import "dotenv/config";

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient, type PrismaClient as PrismaDbClient } from "../generated/prisma/client";

const connectionString = `${process.env["DATABASE_URL"]}`;

const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

/**
 * Payload used to store a queue telemetry sample.
 */
export interface CreateMetricTelemetryInput {
  readonly connectionId: string;
  readonly queueName?: string | null;
  readonly timestampIso: string;
  readonly opsPerSecond?: number | null;
  readonly usedMemoryBytes?: number | null;
  readonly connectedClients?: number | null;
  readonly hitRate?: number | null;
}

/**
 * Query input for telemetry reads.
 */
export interface ListMetricTelemetryInput {
  readonly connectionId: string;
  readonly queueName?: string;
  readonly limit: number;
}

/**
 * Prisma repository for queue and Redis telemetry samples.
 */
export class MetricTelemetryRepository {
  /**
   * Creates a telemetry repository.
   */
  public constructor(private readonly db: PrismaDbClient) {}

  /**
   * Saves one telemetry sample.
   */
  public async create(input: CreateMetricTelemetryInput): Promise<void> {
    await this.db.metricTelemetry.create({
      data: {
        connectionId: input.connectionId,
        queueName: input.queueName ?? null,
        timestampIso: input.timestampIso,
        opsPerSecond: input.opsPerSecond ?? null,
        usedMemoryBytes: input.usedMemoryBytes ?? null,
        connectedClients: input.connectedClients ?? null,
        hitRate: input.hitRate ?? null
      }
    });
  }

  /**
   * Lists telemetry samples ordered by latest timestamp first.
   */
  public async list(input: ListMetricTelemetryInput): Promise<
    readonly {
      readonly timestampIso: string;
      readonly opsPerSecond: number | null;
      readonly usedMemoryBytes: number | null;
      readonly connectedClients: number | null;
      readonly hitRate: number | null;
      readonly queueName: string | null;
    }[]
  > {
    const safeLimit = this.normalizeLimit(input.limit);
    const rows = await this.db.metricTelemetry.findMany({
      where: {
        connectionId: input.connectionId,
        ...(input.queueName === undefined ? {} : { queueName: input.queueName })
      },
      orderBy: {
        timestampIso: "desc"
      },
      take: safeLimit
    });

    return rows.map((row) => ({
      timestampIso: row.timestampIso,
      opsPerSecond: row.opsPerSecond,
      usedMemoryBytes: row.usedMemoryBytes,
      connectedClients: row.connectedClients,
      hitRate: row.hitRate,
      queueName: row.queueName
    }));
  }

  /**
   * Deletes old telemetry rows for a connection and optional queue.
   */
  public async prune(connectionId: string, keepLatest: number, queueName?: string): Promise<number> {
    const safeKeepLatest = this.normalizeLimit(keepLatest);
    const threshold = await this.db.metricTelemetry.findMany({
      where: {
        connectionId,
        ...(queueName === undefined ? {} : { queueName })
      },
      select: {
        id: true
      },
      orderBy: {
        timestampIso: "desc"
      },
      skip: safeKeepLatest
    });

    if (threshold.length === 0) return 0;
    const ids = threshold.map((row) => row.id);
    const result = await this.db.metricTelemetry.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    });

    return result.count;
  }

  /**
   * Bounds user-provided limits to predictable values.
   */
  private normalizeLimit(limit: number): number {
    if (!Number.isFinite(limit) || limit < 1) return 50;
    if (limit > 1000) return 1000;
    return Math.floor(limit);
  }
}

/**
 * Prisma repository for saved module settings.
 */
export class ModuleSettingsRepository {
  /**
   * Creates a module settings repository.
   */
  public constructor(private readonly db: PrismaDbClient) {}

  /**
   * Reads one setting value by module and key.
   */
  public async get(moduleId: string, key: string): Promise<string | null> {
    const row = await this.db.moduleSetting.findFirst({
      where: {
        moduleId,
        key
      },
      orderBy: {
        updatedAt: "desc"
      }
    });
    return row?.value ?? null;
  }

  /**
   * Writes one setting value and updates existing row if present.
   */
  public async set(moduleId: string, key: string, value: string): Promise<void> {
    const existing = await this.db.moduleSetting.findFirst({
      where: {
        moduleId,
        key
      },
      select: {
        id: true
      }
    });

    if (existing === null) {
      await this.db.moduleSetting.create({
        data: {
          id: crypto.randomUUID(),
          moduleId,
          key,
          value
        }
      });
      return;
    }

    await this.db.moduleSetting.update({
      where: {
        id: existing.id
      },
      data: {
        value
      }
    });
  }
}

const metricTelemetryRepository = new MetricTelemetryRepository(prisma);
const moduleSettingsRepository = new ModuleSettingsRepository(prisma);

export { metricTelemetryRepository, moduleSettingsRepository, prisma };
