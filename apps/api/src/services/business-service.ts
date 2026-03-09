import { prisma } from '@ai-gym/db';

import { config } from '../config.js';
import { AppError } from '../lib/http.js';

export async function getBusinessBySlug(businessSlug?: string) {
  const slug = businessSlug ?? config.defaultBusinessSlug;
  const business = await prisma.business.findUnique({
    where: {
      slug,
    },
  });

  if (!business) {
    throw new AppError(
      `找不到 business "${slug}"。請先執行 pnpm db:seed 建立 demo 資料。`,
      404,
    );
  }

  return business;
}
