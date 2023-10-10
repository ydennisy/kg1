-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- AlterTable
ALTER TABLE "links" ADD COLUMN     "embedding" vector(1536);

-- AlterTable
ALTER TABLE "nodes" ADD COLUMN     "embedding" vector(1536);

-- AlterTable
ALTER TABLE "tags" ADD COLUMN     "embedding" vector(1536);
