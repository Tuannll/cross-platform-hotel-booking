import {
  PrismaClient,
  user_type_enum,
  user_status_enum,
  business_type_enum,
  kyc_status_enum,
  property_type_enum,
  property_status_enum,
  room_status_enum,
  promo_type_enum,
  discount_type_enum,
  cancellation_type_enum,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nowayhome.local' },
    update: {},
    create: {
      email: 'admin@nowayhome.local',
      fullName: 'Quản trị viên Hệ thống',
      passwordHash,
      userType: user_type_enum.admin,
      isSuperAdmin: true,
      status: user_status_enum.active,
    },
  });

  const partnerUser = await prisma.user.upsert({
    where: { email: 'partner@nowayhome.local' },
    update: {},
    create: {
      email: 'partner@nowayhome.local',
      fullName: 'Nguyễn Văn Đối Tác',
      phone: '0987654321',
      passwordHash,
      userType: user_type_enum.partner,
      status: user_status_enum.active,
    },
  });

  const partnerProfile = await prisma.partnerProfile.upsert({
    where: { userId: partnerUser.id },
    update: {},
    create: {
      userId: partnerUser.id,
      businessName: 'Tập đoàn Khách sạn Hà Nội Luxury',
      businessType: business_type_enum.company,
      kycStatus: kyc_status_enum.approved,
      bankAccountName: 'NGUYEN VAN PARTNER',
      bankAccountNumber: '999888777666',
      bankName: 'Vietcombank',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@nowayhome.local' },
    update: {},
    create: {
      email: 'customer@nowayhome.local',
      fullName: 'Trần Khách Hàng',
      phone: '0912345678',
      passwordHash,
      userType: user_type_enum.customer,
      status: user_status_enum.active,
    },
  });

  await prisma.customerProfile.upsert({
    where: { userId: customer.id },
    update: {},
    create: {
      userId: customer.id,
      nationality: 'VN',
    },
  });

  // 2. Amenities
  const amenitiesList = [
    { name: 'Wifi miễn phí', category: 'General', iconCode: 'wifi' },
    { name: 'Hồ bơi vô cực', category: 'Outdoor', iconCode: 'pool' },
    { name: 'Phòng Gym & Yoga', category: 'Wellness', iconCode: 'fitness' },
    { name: 'Bữa sáng miễn phí', category: 'Dining', iconCode: 'restaurant' },
    { name: 'Bãi đỗ xe an toàn', category: 'General', iconCode: 'car' },
  ];

  const amenityRecords = [];
  for (const a of amenitiesList) {
    const record = await prisma.amenity.upsert({
      where: { name: a.name },
      update: {},
      create: a,
    });
    amenityRecords.push(record);
  }

  // 3. Property
  const property = await prisma.property.upsert({
    where: { slug: 'hanoi-luxury-hotel-spa' },
    update: {},
    create: {
      partnerId: partnerProfile.id,
      name: 'Khách sạn Hà Nội Luxury & Spa',
      slug: 'hanoi-luxury-hotel-spa',
      propertyType: property_type_enum.hotel,
      description: 'Khách sạn 5 sao sang trọng tại trung tâm thủ đô Hà Nội, view hồ tuyệt đẹp.',
      address: '12 Tràng Thi, Hoàn Kiếm',
      city: 'Hà Nội',
      district: 'Hoàn Kiếm',
      latitude: 21.028511,
      longitude: 105.854167,
      starRating: 5,
      avgRating: 4.8,
      totalReviews: 24,
      status: property_status_enum.active,
      highlights: ['View hồ Hoàn Kiếm', 'Nhà hàng chuẩn Michelin', 'Đưa đón sân bay'],
      transportConnections: [
        { name: 'Sân bay Nội Bài', distance: '28km' },
        { name: 'Ga Hà Nội', distance: '1.5km' },
      ],
      nearbyPlaces: [
        { name: 'Hồ Hoàn Kiếm', distance: '300m', type: 'Attraction' },
        { name: 'Nhà hát Lớn', distance: '800m', type: 'Culture' },
      ],
    },
  });

  // Property Policy
  await prisma.propertyPolicy.upsert({
    where: { propertyId: property.id },
    update: {},
    create: {
      propertyId: property.id,
      cancellationType: cancellation_type_enum.flexible,
      freeCancelHours: 24,
      cancelPenaltyPercent: 10,
    },
  });

  // Connect Amenities
  for (const am of amenityRecords) {
    await prisma.propertyAmenity.upsert({
      where: {
        propertyId_amenityId: {
          propertyId: property.id,
          amenityId: am.id,
        },
      },
      update: {},
      create: {
        propertyId: property.id,
        amenityId: am.id,
      },
    });
  }

  // Cover Media
  await prisma.propertyMedia.createMany({
    data: [
      {
        propertyId: property.id,
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
        isCover: true,
        sortOrder: 0,
        uploadedById: partnerUser.id,
      },
      {
        propertyId: property.id,
        url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
        isCover: false,
        sortOrder: 1,
        uploadedById: partnerUser.id,
      },
    ],
    skipDuplicates: true,
  });

  // 4. Room Types & Rate Plans
  const roomType1 = await prisma.roomType.upsert({
    where: { id: 1001n },
    update: {},
    create: {
      id: 1001n,
      propertyId: property.id,
      name: 'Deluxe City View Room',
      description: 'Phòng Deluxe sang trọng nhìn ra thành phố, giường King rộng rãi.',
      areaSqm: 38.5,
      bedConfiguration: '1 Giường King lớn',
      maxOccupancy: 2,
      totalRooms: 5,
      basePrice: 1200000,
    },
  });

  for (let i = 1; i <= 5; i++) {
    await prisma.room.upsert({
      where: {
        propertyId_roomNumber: {
          propertyId: property.id,
          roomNumber: `1001-${i}`,
        },
      },
      update: {},
      create: {
        propertyId: property.id,
        roomTypeId: roomType1.id,
        roomNumber: `1001-${i}`,
        status: room_status_enum.available,
      },
    });
  }

  const ratePlan1 = await prisma.ratePlan.upsert({
    where: { id: 2001n },
    update: {},
    create: {
      id: 2001n,
      roomTypeId: roomType1.id,
      name: 'Standard Best Flexible Rate',
      basePrice: 1200000,
      isActive: true,
    },
  });

  // Generate Daily Rates for next 60 days
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);

  const dailyRatesData = [];
  for (let d = 0; d < 60; d++) {
    const targetDate = new Date(now);
    targetDate.setUTCDate(now.getUTCDate() + d);
    dailyRatesData.push({
      ratePlanId: ratePlan1.id,
      date: targetDate,
      price: 1200000,
      availableQty: 5,
    });
  }

  await prisma.dailyRate.createMany({
    data: dailyRatesData,
    skipDuplicates: true,
  });

  // 5. Promotions & Vouchers
  const promotion = await prisma.promotion.upsert({
    where: { id: 3001n },
    update: {},
    create: {
      id: 3001n,
      name: 'Ưu Đãi Chào Hè 2026',
      promoType: promo_type_enum.flash_sale,
      discountType: discount_type_enum.percent,
      discountValue: 15,
      maxDiscount: 200000,
      minOrderAmount: 500000,
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T23:59:59.000Z'),
      maxUses: 100,
      totalUsed: 0,
      createdBy: admin.id,
    },
  });

  await prisma.voucher.upsert({
    where: { code: 'SUMMER2026' },
    update: {},
    create: {
      promotionId: promotion.id,
      code: 'SUMMER2026',
      maxUsesPerUser: 2,
      isActive: true,
    },
  });

  console.log('Seed completed successfully!');
  console.log('Demo accounts created:');
  console.log('- Admin: admin@nowayhome.local / Password123!');
  console.log('- Partner: partner@nowayhome.local / Password123!');
  console.log('- Customer: customer@nowayhome.local / Password123!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
