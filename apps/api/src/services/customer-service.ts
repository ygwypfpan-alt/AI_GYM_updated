import { prisma } from '@ai-gym/db';

import { normalizeEmail, normalizePhone } from '../lib/contact.js';

export type CustomerInput = {
  name?: string;
  phone?: string;
  email?: string;
  note?: string;
};

export async function findOrCreateCustomer(
  businessId: string,
  input?: CustomerInput | null,
) {
  const name = input?.name?.trim();
  const phone = normalizePhone(input?.phone);
  const email = normalizeEmail(input?.email);
  const note = input?.note?.trim();

  if (!name && !phone && !email) {
    return null;
  }

  if (phone || email) {
    const customerIdentifiers = [];

    if (phone) {
      customerIdentifiers.push({ phone });
    }

    if (email) {
      customerIdentifiers.push({ email });
    }

    const existing = await prisma.customer.findFirst({
      where: {
        businessId,
        OR: customerIdentifiers,
      },
    });

    if (existing) {
      return prisma.customer.update({
        where: {
          id: existing.id,
        },
        data: {
          name: name || existing.name,
          phone: phone ?? existing.phone,
          email: email ?? existing.email,
          note: note ?? existing.note,
        },
      });
    }
  }

  return prisma.customer.create({
    data: {
      businessId,
      name: name || phone || email || '網站訪客',
      phone,
      email,
      note,
    },
  });
}
