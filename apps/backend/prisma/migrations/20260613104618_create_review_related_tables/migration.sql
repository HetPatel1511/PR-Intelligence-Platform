-- DropForeignKey
ALTER TABLE "PullRequest" DROP CONSTRAINT "PullRequest_authorId_fkey";

-- AlterTable
ALTER TABLE "PullRequest" ALTER COLUMN "authorId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ReviewComment" (
    "id" TEXT NOT NULL,
    "githubId" BIGINT NOT NULL,
    "body" TEXT,
    "path" TEXT,
    "line" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "pullRequestId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "ReviewComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commit" (
    "id" TEXT NOT NULL,
    "sha" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "authoredAt" TIMESTAMP(3),
    "pullRequestId" TEXT NOT NULL,
    "authorId" TEXT,

    CONSTRAINT "Commit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PullRequestFile" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "additions" INTEGER NOT NULL DEFAULT 0,
    "deletions" INTEGER NOT NULL DEFAULT 0,
    "changes" INTEGER NOT NULL DEFAULT 0,
    "pullRequestId" TEXT NOT NULL,

    CONSTRAINT "PullRequestFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RequestedReviewers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewComment_githubId_key" ON "ReviewComment"("githubId");

-- CreateIndex
CREATE INDEX "ReviewComment_pullRequestId_idx" ON "ReviewComment"("pullRequestId");

-- CreateIndex
CREATE INDEX "ReviewComment_authorId_idx" ON "ReviewComment"("authorId");

-- CreateIndex
CREATE UNIQUE INDEX "Commit_sha_key" ON "Commit"("sha");

-- CreateIndex
CREATE INDEX "Commit_pullRequestId_idx" ON "Commit"("pullRequestId");

-- CreateIndex
CREATE INDEX "Commit_authorId_idx" ON "Commit"("authorId");

-- CreateIndex
CREATE INDEX "PullRequestFile_pullRequestId_idx" ON "PullRequestFile"("pullRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "PullRequestFile_pullRequestId_filename_key" ON "PullRequestFile"("pullRequestId", "filename");

-- CreateIndex
CREATE UNIQUE INDEX "_RequestedReviewers_AB_unique" ON "_RequestedReviewers"("A", "B");

-- CreateIndex
CREATE INDEX "_RequestedReviewers_B_index" ON "_RequestedReviewers"("B");

-- AddForeignKey
ALTER TABLE "PullRequest" ADD CONSTRAINT "PullRequest_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Engineer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "PullRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewComment" ADD CONSTRAINT "ReviewComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Engineer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commit" ADD CONSTRAINT "Commit_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "PullRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commit" ADD CONSTRAINT "Commit_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Engineer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PullRequestFile" ADD CONSTRAINT "PullRequestFile_pullRequestId_fkey" FOREIGN KEY ("pullRequestId") REFERENCES "PullRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RequestedReviewers" ADD CONSTRAINT "_RequestedReviewers_A_fkey" FOREIGN KEY ("A") REFERENCES "Engineer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RequestedReviewers" ADD CONSTRAINT "_RequestedReviewers_B_fkey" FOREIGN KEY ("B") REFERENCES "PullRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
