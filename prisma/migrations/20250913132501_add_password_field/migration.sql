/*
  Warnings:

  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- Add password column with a temporary default value for existing users
ALTER TABLE "public"."User" ADD COLUMN "password" TEXT NOT NULL DEFAULT 'temp_password_change_me';

-- Remove the default value so future inserts require a password
ALTER TABLE "public"."User" ALTER COLUMN "password" DROP DEFAULT;
