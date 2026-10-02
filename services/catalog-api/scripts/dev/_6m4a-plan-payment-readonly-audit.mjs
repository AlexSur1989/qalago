/**
 * 6.13M.4A — read-only PlanPayment post-migration aggregate audit (no PII).
 */
import { PrismaClient, PlanPaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.planPayment.count();
  const byStatus = await prisma.planPayment.groupBy({
    by: ['status'],
    _count: { _all: true },
  });
  const completedWithPaidAt = await prisma.planPayment.count({
    where: { status: PlanPaymentStatus.COMPLETED, paidAt: { not: null } },
  });
  const completedNullPaidAt = await prisma.planPayment.count({
    where: { status: PlanPaymentStatus.COMPLETED, paidAt: null },
  });
  const pending = await prisma.planPayment.count({
    where: { status: PlanPaymentStatus.PENDING },
  });
  const withPeriodDays = await prisma.planPayment.count({
    where: { periodDays: { not: null } },
  });
  const businessesWithPlan = await prisma.business.groupBy({
    by: ['planTier'],
    _count: { _all: true },
  });

  console.log(
    JSON.stringify(
      {
        planPaymentTotal: total,
        planPaymentByStatus: byStatus,
        completedWithPaidAt,
        completedNullPaidAt,
        pendingCount: pending,
        rowsWithPeriodDays: withPeriodDays,
        businessCountByPlanTier: businessesWithPlan,
        migration: '20261003103000_plan_payment_billing_6_13m4',
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
