import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [
    businessByPlan,
    planPaymentByTier,
    businessTotal,
    planPaymentTotal,
    orderTotal,
    paymentTotal,
    campaignTotal,
    creativeTotal,
    analyticsTotal,
  ] = await Promise.all([
    prisma.business.groupBy({ by: ['planTier'], _count: true }),
    prisma.planPayment.groupBy({ by: ['tier'], _count: true }),
    prisma.business.count(),
    prisma.planPayment.count(),
    prisma.order.count(),
    prisma.payment.count(),
    prisma.adCampaign.count(),
    prisma.adCreative.count(),
    prisma.analyticsEvent.count(),
  ]);

  console.log(JSON.stringify({
    businessByPlan,
    planPaymentByTier,
    totals: {
      business: businessTotal,
      planPayment: planPaymentTotal,
      order: orderTotal,
      payment: paymentTotal,
      adCampaign: campaignTotal,
      adCreative: creativeTotal,
      analyticsEvent: analyticsTotal,
    },
  }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
