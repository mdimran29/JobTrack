-- AlterTable
ALTER TABLE "JobApplication" ADD COLUMN "resumeVersionId" TEXT,
ADD COLUMN "matchScore" INTEGER;

-- CreateIndex
CREATE INDEX "JobApplication_resumeVersionId_idx" ON "JobApplication"("resumeVersionId");

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_resumeVersionId_fkey" FOREIGN KEY ("resumeVersionId") REFERENCES "ResumeVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
