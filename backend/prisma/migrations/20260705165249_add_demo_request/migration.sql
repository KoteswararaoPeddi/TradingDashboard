-- CreateTable
CREATE TABLE "demo_requests" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "hospitalName" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hospitalAddress" TEXT NOT NULL,
    "preferredDate" DATE NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "demo_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "demo_requests_createdAt_idx" ON "demo_requests"("createdAt");
