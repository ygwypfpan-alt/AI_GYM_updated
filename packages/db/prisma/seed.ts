import 'dotenv/config';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BUSINESS_SLUG = 'ai-gym-demo';
const TIMEZONE = 'Asia/Taipei';

function formatDateInTimezone(date: Date, timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${get('year')}-${get('month')}-${get('day')}`;
}

function addDaysToDateString(dateString: string, days: number): string {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function atTaipei(dateString: string, timeString: string): Date {
  return new Date(`${dateString}T${timeString}:00+08:00`);
}

async function main() {
  await prisma.business.deleteMany({
    where: {
      slug: BUSINESS_SLUG,
    },
  });

  const business = await prisma.business.create({
    data: {
      name: 'AI GYM Demo',
      slug: BUSINESS_SLUG,
      timezone: TIMEZONE,
      phone: '02-1234-5678',
      email: 'demo@aigym.local',
      address: '台北市信義區健身路 88 號',
    },
  });

  const [personalTraining, groupClass, introSession] = await Promise.all([
    prisma.service.create({
      data: {
        businessId: business.id,
        name: '一對一教練課',
        description: '客製化訓練、增肌減脂、PT、動作調整',
        durationMinutes: 60,
        price: 1800,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business.id,
        name: '團體燃脂課',
        description: '晚上熱門團課、HIIT、燃脂循環訓練',
        durationMinutes: 45,
        price: 500,
      },
    }),
    prisma.service.create({
      data: {
        businessId: business.id,
        name: '新手體驗訓練',
        description: '第一次來館、入門諮詢、器材導覽',
        durationMinutes: 30,
        price: 300,
      },
    }),
  ]);

  const [alice, bob] = await Promise.all([
    prisma.staff.create({
      data: {
        businessId: business.id,
        name: 'Alice 教練',
        bio: '擅長一對一肌力訓練與新手入門。',
      },
    }),
    prisma.staff.create({
      data: {
        businessId: business.id,
        name: 'Bob 教練',
        bio: '擅長團體燃脂課與循環訓練。',
      },
    }),
  ]);

  const weekDays = [1, 2, 3, 4, 5];
  const saturday = [6];

  await Promise.all([
    ...weekDays.map((dayOfWeek) =>
      prisma.availabilityRule.create({
        data: {
          businessId: business.id,
          serviceId: personalTraining.id,
          staffId: alice.id,
          dayOfWeek,
          startTime: '09:00',
          endTime: '18:00',
          slotIntervalMinutes: 60,
          capacity: 1,
          note: '平日一對一教練課',
        },
      }),
    ),
    ...weekDays.concat(saturday).map((dayOfWeek) =>
      prisma.availabilityRule.create({
        data: {
          businessId: business.id,
          serviceId: groupClass.id,
          staffId: bob.id,
          dayOfWeek,
          startTime: '18:00',
          endTime: '21:00',
          slotIntervalMinutes: 45,
          capacity: 6,
          note: '晚間團體燃脂課',
        },
      }),
    ),
    ...[2, 3, 4, 5, 6, 0].map((dayOfWeek) =>
      prisma.availabilityRule.create({
        data: {
          businessId: business.id,
          serviceId: introSession.id,
          staffId: alice.id,
          dayOfWeek,
          startTime: '11:00',
          endTime: '16:00',
          slotIntervalMinutes: 30,
          capacity: 1,
          note: '新手體驗訓練',
        },
      }),
    ),
  ]);

  await prisma.faqItem.createMany({
    data: [
      {
        businessId: business.id,
        category: '營業資訊',
        question: '營業時間是幾點到幾點？',
        answer: '週一到週五 09:00-21:00，週六 10:00-18:00，週日採預約制。',
        keywords: ['營業時間', '幾點開', 'hours', 'open'],
        sortOrder: 1,
      },
      {
        businessId: business.id,
        category: '價格',
        question: '一對一教練課怎麼收費？',
        answer: '一對一教練課單堂 1,800 元，團體燃脂課單堂 500 元，新手體驗訓練 300 元。',
        keywords: ['價格', '費用', '收費', 'price'],
        sortOrder: 2,
      },
      {
        businessId: business.id,
        category: '交通',
        question: '現場可以停車嗎？',
        answer: '大樓地下室有合作停車場，消費滿 500 元可折抵 1 小時。',
        keywords: ['停車', 'parking', '交通'],
        sortOrder: 3,
      },
      {
        businessId: business.id,
        category: '設備',
        question: '有提供淋浴間嗎？',
        answer: '有，男女更衣室皆附設淋浴間，建議自備毛巾。',
        keywords: ['淋浴', '洗澡', '更衣室', 'shower'],
        sortOrder: 4,
      },
      {
        businessId: business.id,
        category: '新手',
        question: '第一次來適合上什麼課？',
        answer: '推薦先預約新手體驗訓練，會先做需求訪談、器材導覽與基本動作檢查。',
        keywords: ['新手', '第一次', '體驗', 'beginner'],
        sortOrder: 5,
      },
      {
        businessId: business.id,
        category: '規則',
        question: '預約後可以取消或改期嗎？',
        answer: '可以，課程開始前 6 小時可免費改期或取消；MVP Demo 版本目前可直接在聊天視窗操作。',
        keywords: ['取消', '改期', 'reschedule', 'cancel'],
        sortOrder: 6,
      },
    ],
  });

  const [customer1, customer2] = await Promise.all([
    prisma.customer.create({
      data: {
        businessId: business.id,
        name: '王小明',
        phone: '0911111111',
        email: 'ming@example.com',
      },
    }),
    prisma.customer.create({
      data: {
        businessId: business.id,
        name: '陳小華',
        phone: '0922222222',
        email: 'hua@example.com',
      },
    }),
  ]);

  const today = formatDateInTimezone(new Date(), TIMEZONE);
  const tomorrow = addDaysToDateString(today, 1);
  const dayAfterTomorrow = addDaysToDateString(today, 2);

  const conversation1 = await prisma.conversation.create({
    data: {
      businessId: business.id,
      customerId: customer1.id,
      status: 'OPEN',
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation1.id,
        sender: 'USER',
        text: '今晚還有團體燃脂課嗎？',
        intent: 'AVAILABILITY',
      },
      {
        conversationId: conversation1.id,
        sender: 'BOT',
        text: '有，我找到幾個團體燃脂課時段，你可以直接在聊天視窗點選預約。',
        intent: 'AVAILABILITY',
      },
    ],
  });

  await prisma.booking.create({
    data: {
      businessId: business.id,
      customerId: customer1.id,
      serviceId: groupClass.id,
      staffId: bob.id,
      conversationId: conversation1.id,
      status: 'BOOKED',
      startAt: atTaipei(tomorrow, '18:00'),
      endAt: atTaipei(tomorrow, '18:45'),
      notes: '種子資料：晚間團課',
    },
  });

  await prisma.booking.create({
    data: {
      businessId: business.id,
      customerId: customer1.id,
      serviceId: introSession.id,
      staffId: alice.id,
      status: 'CANCELLED',
      startAt: atTaipei(dayAfterTomorrow, '11:00'),
      endAt: atTaipei(dayAfterTomorrow, '11:30'),
      notes: 'Seeded cancelled booking for lookup edge-case testing.',
      cancellationReason: 'Seeded cancelled example for customer testing.',
    },
  });

  await prisma.booking.create({
    data: {
      businessId: business.id,
      customerId: customer1.id,
      serviceId: personalTraining.id,
      staffId: alice.id,
      status: 'COMPLETED',
      startAt: atTaipei(today, '09:00'),
      endAt: atTaipei(today, '10:00'),
      notes: 'Seeded completed booking for admin filter checks.',
    },
  });

  const conversation2 = await prisma.conversation.create({
    data: {
      businessId: business.id,
      customerId: customer2.id,
      status: 'HANDED_OFF',
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation2.id,
        sender: 'USER',
        text: '我想了解公司團體合作方案，請真人協助。',
        intent: 'HANDOFF',
      },
      {
        conversationId: conversation2.id,
        sender: 'BOT',
        text: '已幫你送出轉真人需求，後台會看得到這筆紀錄。',
        intent: 'HANDOFF',
      },
    ],
  });

  await prisma.booking.create({
    data: {
      businessId: business.id,
      customerId: customer2.id,
      serviceId: personalTraining.id,
      staffId: alice.id,
      status: 'BOOKED',
      startAt: atTaipei(dayAfterTomorrow, '10:00'),
      endAt: atTaipei(dayAfterTomorrow, '11:00'),
      notes: '種子資料：一對一教練課',
    },
  });

  await prisma.handoffRequest.create({
    data: {
      businessId: business.id,
      customerId: customer2.id,
      conversationId: conversation2.id,
      status: 'PENDING',
      name: customer2.name,
      phone: customer2.phone,
      note: '想了解企業合作與體驗包班。',
    },
  });

  console.log(`Seed complete for business: ${business.name} (${business.slug})`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
