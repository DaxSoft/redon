-- CreateTable
CREATE TABLE "MetricTelemetry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "connectionId" TEXT NOT NULL,
    "queueName" TEXT,
    "timestampIso" TEXT NOT NULL,
    "opsPerSecond" REAL,
    "usedMemoryBytes" REAL,
    "connectedClients" INTEGER,
    "hitRate" REAL
);
