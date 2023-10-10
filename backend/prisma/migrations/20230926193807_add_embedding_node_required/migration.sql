/*
  Warnings:

  - Made the column `embedding` on table `nodes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "nodes" ALTER COLUMN "embedding" SET NOT NULL;
