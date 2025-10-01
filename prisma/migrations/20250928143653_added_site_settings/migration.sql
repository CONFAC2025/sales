-- CreateTable
CREATE TABLE "public"."SiteSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "topText" TEXT,
    "bottomText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
