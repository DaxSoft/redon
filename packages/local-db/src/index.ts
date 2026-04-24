export const redonDatabaseEnvName = "REDON_DATABASE_URL";

export interface LocalDatabaseConfig {
  readonly databaseUrl: string;
}

export function createSqliteUrl(path: string): string {
  return `file:${path}`;
}
