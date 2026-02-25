-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "lang" TEXT DEFAULT 'en',
ADD COLUMN     "summaryDeepEn" TEXT,
ADD COLUMN     "summaryEn" TEXT,
ADD COLUMN     "summarySimpleEn" TEXT,
ADD COLUMN     "titleEn" TEXT,
ADD COLUMN     "titleZh" TEXT;
