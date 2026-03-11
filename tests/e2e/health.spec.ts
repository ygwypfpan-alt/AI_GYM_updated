import request from 'supertest';

import { createApp } from '../../apps/api/src/app.ts';
import { detectIntent } from '../../apps/api/src/lib/intent.ts';
import { prisma } from '../../packages/db/src/index.ts';

const app = createApp();

async function getAdminToken() {
  const response = await request(app).post('/api/admin/login').send({
    username: 'admin',
    password: 'change-me',
  });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  return response.body.data.token as string;
}

async function createLookupBooking() {
  const servicesResponse = await request(app).get('/api/services').query({
    businessSlug: 'ai-gym-demo',
  });

  expect(servicesResponse.status).toBe(200);
  expect(servicesResponse.body.success).toBe(true);

  const services = servicesResponse.body.data.services as Array<{
    id: string;
    name: string;
  }>;

  for (const service of services) {
    const availabilityResponse = await request(app).get('/api/availability').query({
      businessSlug: 'ai-gym-demo',
      serviceId: service.id,
      days: 14,
    });

    if (
      availabilityResponse.status !== 200 ||
      !availabilityResponse.body.success ||
      availabilityResponse.body.data.slots.length < 2
    ) {
      continue;
    }

    const slots = availabilityResponse.body.data.slots as Array<{
      startAt: string;
      staffId: string | null;
    }>;

    const identifier = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const phone = `09${identifier.replace(/\D/g, '').slice(0, 8).padEnd(8, '1')}`;
    const email = `lookup-${identifier}@example.com`;

    const bookingResponse = await request(app).post('/api/bookings').send({
      businessSlug: 'ai-gym-demo',
      serviceId: service.id,
      staffId: slots[0]?.staffId ?? undefined,
      slotStartAt: slots[0]?.startAt,
      customer: {
        name: 'Lookup Test',
        phone,
        email,
      },
    });

    expect(bookingResponse.status).toBe(201);
    expect(bookingResponse.body.success).toBe(true);

    return {
      booking: bookingResponse.body.data.booking as {
        id: string;
        status: string;
        startAt: string;
        serviceId: string;
      },
      phone,
      email,
      slots,
    };
  }

  throw new Error('No service with at least two available slots was found.');
}

describe('AI GYM customer-test-ready API tests', () => {
  it('returns health payload', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: expect.objectContaining({
        ok: true,
        service: 'ai-gym-api',
      }),
    });
  });

  it('detects key intents', () => {
    expect(detectIntent('What are your hours?')).toBe('FAQ');
    expect(detectIntent('Do you have availability tonight?')).toBe('AVAILABILITY');
    expect(detectIntent('I need a human agent')).toBe('HANDOFF');
  });

  it('rejects admin dashboard without a token', async () => {
    const response = await request(app).get('/api/admin/dashboard');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      error: 'Unauthorized.',
    });
  });

  it('supports admin login and me', async () => {
    const token = await getAdminToken();

    const meResponse = await request(app)
      .get('/api/admin/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body).toEqual({
      success: true,
      data: {
        username: 'admin',
      },
    });
  });

  it('rejects invalid admin login', async () => {
    const response = await request(app).post('/api/admin/login').send({
      username: 'admin',
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      success: false,
      error: 'Invalid admin credentials.',
    });
  });

  it('supports admin booking search and status filters', async () => {
    const token = await getAdminToken();

    const response = await request(app)
      .get('/api/admin/dashboard')
      .query({
        businessSlug: 'ai-gym-demo',
        query: 'ming@example.com',
        bookingStatus: 'CANCELLED',
      })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.bookings.length).toBeGreaterThan(0);
    expect(response.body.data.bookings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          customerEmail: 'ming@example.com',
          status: 'CANCELLED',
        }),
      ]),
    );
  });

  it('looks up bookings by phone and email', async () => {
    const created = await createLookupBooking();

    const lookupResponse = await request(app).post('/api/bookings/lookup').send({
      businessSlug: 'ai-gym-demo',
      phone: created.phone,
      email: created.email.toUpperCase(),
    });

    expect(lookupResponse.status).toBe(200);
    expect(lookupResponse.body.success).toBe(true);
    expect(lookupResponse.body.data.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: created.booking.id,
          customerPhone: created.phone,
          customerEmail: created.email,
        }),
      ]),
    );
  });

  it('rejects lookup requests without both phone and email', async () => {
    const response = await request(app).post('/api/bookings/lookup').send({
      businessSlug: 'ai-gym-demo',
      phone: '0911111111',
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: 'phone and email are required.',
    });
  });

  it('returns an empty array when lookup finds nothing', async () => {
    const response = await request(app).post('/api/bookings/lookup').send({
      businessSlug: 'ai-gym-demo',
      phone: '0999999999',
      email: 'missing@example.com',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        items: [],
      },
    });
  });

  it('rejects bookings created in the past', async () => {
    const servicesResponse = await request(app).get('/api/services').query({
      businessSlug: 'ai-gym-demo',
    });
    const firstService = servicesResponse.body.data.services[0] as { id: string };

    const response = await request(app).post('/api/bookings').send({
      businessSlug: 'ai-gym-demo',
      serviceId: firstService.id,
      slotStartAt: '2020-01-01T10:00:00.000Z',
      customer: {
        name: 'Past Booking',
        phone: '0933333333',
        email: 'past@example.com',
      },
    });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: 'Bookings must be created for a future time slot.',
    });
  });

  it('reschedules a looked-up booking and keeps it booked', async () => {
    const created = await createLookupBooking();

    const response = await request(app)
      .patch(`/api/bookings/${created.booking.id}/reschedule`)
      .send({
        slotStartAt: created.slots[1]?.startAt,
        staffId: created.slots[1]?.staffId,
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.booking).toEqual(
      expect.objectContaining({
        id: created.booking.id,
        status: 'BOOKED',
        startAt: created.slots[1]?.startAt,
      }),
    );
  });

  it('rejects rescheduling to the same slot', async () => {
    const created = await createLookupBooking();

    const response = await request(app)
      .patch(`/api/bookings/${created.booking.id}/reschedule`)
      .send({
        slotStartAt: created.booking.startAt,
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: 'Please choose a different time slot.',
    });
  });

  it('rejects rescheduling for a started booking', async () => {
    const created = await createLookupBooking();
    await prisma.booking.update({
      where: {
        id: created.booking.id,
      },
      data: {
        startAt: new Date('2020-01-02T10:00:00.000Z'),
        endAt: new Date('2020-01-02T10:45:00.000Z'),
      },
    });

    const response = await request(app)
      .patch(`/api/bookings/${created.booking.id}/reschedule`)
      .send({
        slotStartAt: created.slots[1]?.startAt,
        staffId: created.slots[1]?.staffId,
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: 'Started or past bookings cannot be rescheduled online.',
    });
  });

  it('cancels a looked-up booking', async () => {
    const created = await createLookupBooking();

    const response = await request(app)
      .patch(`/api/bookings/${created.booking.id}/cancel`)
      .send({
        reason: 'Cancelled in automated test.',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.booking).toEqual(
      expect.objectContaining({
        id: created.booking.id,
        status: 'CANCELLED',
        cancellationReason: 'Cancelled in automated test.',
      }),
    );
  });

  it('rejects cancelling the same booking twice', async () => {
    const created = await createLookupBooking();

    await request(app).patch(`/api/bookings/${created.booking.id}/cancel`).send({
      reason: 'First cancel.',
    });

    const response = await request(app)
      .patch(`/api/bookings/${created.booking.id}/cancel`)
      .send({
        reason: 'Second cancel.',
      });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      success: false,
      error: 'This booking is already cancelled.',
    });
  });

  it('rejects cancelling a started booking', async () => {
    const created = await createLookupBooking();
    await prisma.booking.update({
      where: {
        id: created.booking.id,
      },
      data: {
        startAt: new Date('2020-01-03T10:00:00.000Z'),
        endAt: new Date('2020-01-03T10:45:00.000Z'),
      },
    });

    const response = await request(app)
      .patch(`/api/bookings/${created.booking.id}/cancel`)
      .send({
        reason: 'Too late.',
      });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      error: 'Started or past bookings cannot be cancelled online.',
    });
  });
});
