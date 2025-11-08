/*
  Warnings:

  - You are about to drop the column `followerId` on the `followers` table. All the data in the column will be lost.
  - You are about to drop the column `followingId` on the `followers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[followerUsername,followingUsername]` on the table `followers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `followerUsername` to the `followers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `followingUsername` to the `followers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."followers" DROP CONSTRAINT "followers_followerId_fkey";

-- DropForeignKey
ALTER TABLE "public"."followers" DROP CONSTRAINT "followers_followingId_fkey";

-- DropIndex
DROP INDEX "public"."followers_followerId_followingId_key";

-- AlterTable
ALTER TABLE "followers" DROP COLUMN "followerId",
DROP COLUMN "followingId",
ADD COLUMN     "followerUsername" TEXT NOT NULL,
ADD COLUMN     "followingUsername" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "followers_followerUsername_followingUsername_key" ON "followers"("followerUsername", "followingUsername");

-- AddForeignKey
ALTER TABLE "followers" ADD CONSTRAINT "followers_followerUsername_fkey" FOREIGN KEY ("followerUsername") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers" ADD CONSTRAINT "followers_followingUsername_fkey" FOREIGN KEY ("followingUsername") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE;
