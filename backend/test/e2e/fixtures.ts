import * as bcrypt from 'bcrypt';
import {
  PrismaClient,
  business_type_enum,
  property_status_enum,
  property_type_enum,
  room_status_enum,
  user_status_enum,
  user_type_enum,
} from '@prisma/client';

export type BookingFixture = {
  checkInDate: string;
  checkOutDate: string;
  customer: { email: string; password: string };
  propertyId: string;
  ratePlanId: string;
  roomTypeId: string;
};

export async function createBookingFixture(
  prisma: PrismaClient,
  availableQty = 1,
): Promise<BookingFixture> {
  const password = 'e2e-password';
  const customer = await prisma.user.create({
    data: {
      email: `customer-${Date.now()}@e2e.local`,
      fullName: 'E2E Customer',
      passwordHash: await bcrypt.hash(password, 10),
      status: user_status_enum.active,
      userType: user_type_enum.customer,
    },
  });
  const partnerUser = await prisma.user.create({
    data: {
      email: `partner-${Date.now()}@e2e.local`,
      fullName: 'E2E Partner',
      passwordHash: await bcrypt.hash(password, 10),
      status: user_status_enum.active,
      userType: user_type_enum.partner,
    },
  });
  const partner = await prisma.partnerProfile.create({
    data: {
      businessName: 'E2E Hotel Group',
      businessType: business_type_enum.individual,
      userId: partnerUser.id,
    },
  });
  const property = await prisma.property.create({
    data: {
      address: '1 Test Street',
      city: 'Hanoi',
      latitude: 21.0285,
      longitude: 105.8542,
      name: 'E2E Hotel',
      partnerId: partner.id,
      propertyType: property_type_enum.hotel,
      slug: `e2e-hotel-${Date.now()}`,
      status: property_status_enum.active,
    },
  });
  const roomType = await prisma.roomType.create({
    data: {
      basePrice: 100000,
      name: 'E2E Room',
      propertyId: property.id,
      totalRooms: 1,
    },
  });
  await prisma.room.create({
    data: {
      propertyId: property.id,
      roomNumber: 'E2E-101',
      roomTypeId: roomType.id,
      status: room_status_enum.available,
    },
  });
  const ratePlan = await prisma.ratePlan.create({
    data: {
      basePrice: 100000,
      name: 'E2E Rate',
      roomTypeId: roomType.id,
    },
  });
  await prisma.dailyRate.createMany({
    data: [
      { availableQty, date: new Date('2026-11-10T00:00:00.000Z'), price: 100000, ratePlanId: ratePlan.id },
      { availableQty, date: new Date('2026-11-11T00:00:00.000Z'), price: 100000, ratePlanId: ratePlan.id },
    ],
  });

  return {
    checkInDate: '2026-11-10',
    checkOutDate: '2026-11-12',
    customer: { email: customer.email, password },
    propertyId: property.id.toString(),
    ratePlanId: ratePlan.id.toString(),
    roomTypeId: roomType.id.toString(),
  };
}
