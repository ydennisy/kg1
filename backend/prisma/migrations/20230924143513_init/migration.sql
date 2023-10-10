-- CreateTable
CREATE TABLE "nodes" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "raw" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT,

    CONSTRAINT "nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "links" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "raw" TEXT NOT NULL,
    "cleaned" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_nodes_to_tags" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_nodes_to_links" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "nodes_id_idx" ON "nodes"("id");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "links_raw_key" ON "links"("raw");

-- CreateIndex
CREATE UNIQUE INDEX "links_cleaned_key" ON "links"("cleaned");

-- CreateIndex
CREATE UNIQUE INDEX "_nodes_to_tags_AB_unique" ON "_nodes_to_tags"("A", "B");

-- CreateIndex
CREATE INDEX "_nodes_to_tags_B_index" ON "_nodes_to_tags"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_nodes_to_links_AB_unique" ON "_nodes_to_links"("A", "B");

-- CreateIndex
CREATE INDEX "_nodes_to_links_B_index" ON "_nodes_to_links"("B");

-- AddForeignKey
ALTER TABLE "_nodes_to_tags" ADD CONSTRAINT "_nodes_to_tags_A_fkey" FOREIGN KEY ("A") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_nodes_to_tags" ADD CONSTRAINT "_nodes_to_tags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_nodes_to_links" ADD CONSTRAINT "_nodes_to_links_A_fkey" FOREIGN KEY ("A") REFERENCES "links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_nodes_to_links" ADD CONSTRAINT "_nodes_to_links_B_fkey" FOREIGN KEY ("B") REFERENCES "nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
