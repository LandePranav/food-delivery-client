-- CreateTable
CREATE TABLE "PushNotificationSubscription" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "sellerId" TEXT,

    CONSTRAINT "PushNotificationSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushNotificationSubscription_id_key" ON "PushNotificationSubscription"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PushNotificationSubscription_endpoint_key" ON "PushNotificationSubscription"("endpoint");

-- AddForeignKey
ALTER TABLE "PushNotificationSubscription" ADD CONSTRAINT "PushNotificationSubscription_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
