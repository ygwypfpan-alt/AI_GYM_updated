import { prisma } from '@ai-gym/db';
import type { ServiceSummary } from '@ai-gym/shared';

import { getBusinessBySlug } from './business-service.js';
import { mapServiceDto } from './serializers.js';

export async function listActiveServices(
  businessSlug?: string,
): Promise<ServiceSummary[]> {
  const business = await getBusinessBySlug(businessSlug);
  const services = await prisma.service.findMany({
    where: {
      businessId: business.id,
      isActive: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return services.map(mapServiceDto);
}
