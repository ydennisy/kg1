-- CreateTable
CREATE TABLE "nodes" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "title" TEXT,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "edges" (
    "id" SERIAL NOT NULL,
    "parentId" INTEGER NOT NULL,
    "childId" INTEGER NOT NULL,

    CONSTRAINT "edges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "web_pages" (
    "id" SERIAL NOT NULL,

    CONSTRAINT "web_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "nodes_id_idx" ON "nodes"("id");

-- CreateIndex
CREATE UNIQUE INDEX "edges_parentId_childId_key" ON "edges"("parentId", "childId");

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "edges" ADD CONSTRAINT "edges_childId_fkey" FOREIGN KEY ("childId") REFERENCES "nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
