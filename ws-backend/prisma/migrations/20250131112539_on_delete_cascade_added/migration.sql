-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_pathId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_roomId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_shapeId_fkey";

-- DropForeignKey
ALTER TABLE "Point" DROP CONSTRAINT "Point_pathId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_roomId_fkey";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_shapeId_fkey" FOREIGN KEY ("shapeId") REFERENCES "Shape"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "Path"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Point" ADD CONSTRAINT "Point_pathId_fkey" FOREIGN KEY ("pathId") REFERENCES "Path"("id") ON DELETE CASCADE ON UPDATE CASCADE;
