import { Response } from 'express';
import { prisma } from '../../lib/prisma';
import { AuthenticatedRequest } from '../../middleware/auth';

export const getDoctorCoverage = async (req: AuthenticatedRequest, res: Response) => {
  const { region, from, to } = req.query;

  const dateFilter: any = {};
  if (from) dateFilter.gte = new Date(from as string);
  if (to) dateFilter.lte = new Date(to as string);

  // Fetch all doctors
  const allDoctors = await prisma.doctor.findMany({
    where: { active: true },
    include: {
      visits: {
        where: Object.keys(dateFilter).length > 0 ? { checkInTime: dateFilter } : undefined,
        include: {
          mr: { select: { id: true, name: true, region: true } },
        },
        orderBy: { checkInTime: 'desc' },
      },
    },
  });

  const totalDoctors = allDoctors.length;
  const visitedDoctors = allDoctors.filter((d) => d.visits.length > 0);
  const coverageRatio = totalDoctors > 0 ? Math.round((visitedDoctors.length / totalDoctors) * 100) : 0;

  const doctorList = allDoctors.map((doc) => {
    const lastVisit = doc.visits[0] || null;

    return {
      id: doc.id,
      name: doc.name,
      hospitalName: doc.hospitalName,
      address: doc.address,
      totalVisits: doc.visits.length,
      lastVisitedDate: lastVisit ? lastVisit.checkInTime : null,
      lastVisitedBy: lastVisit ? lastVisit.mr.name : null,
      isCovered: doc.visits.length > 0,
      latitude: doc.latitude,
      longitude: doc.longitude,
    };
  });

  res.json({
    summary: {
      totalDoctors,
      coveredDoctors: visitedDoctors.length,
      uncoveredDoctors: totalDoctors - visitedDoctors.length,
      coveragePercentage: coverageRatio,
    },
    doctors: doctorList,
  });
};

export const getSampleDistribution = async (req: AuthenticatedRequest, res: Response) => {
  const visits = await prisma.visit.findMany({
    where: {
      samplesGiven: { not: null },
      checkOutTime: { not: null },
    },
    select: {
      samplesGiven: true,
      mr: { select: { region: true } },
    },
  });

  const productTotals: Record<string, { name: string; quantity: number }> = {};
  const regionTotals: Record<string, number> = {};

  visits.forEach((v) => {
    if (!v.samplesGiven) return;
    try {
      const samples = JSON.parse(v.samplesGiven);
      if (Array.isArray(samples)) {
        samples.forEach((s: any) => {
          if (!productTotals[s.productId]) {
            productTotals[s.productId] = { name: s.productName || 'Unknown', quantity: 0 };
          }
          productTotals[s.productId].quantity += Number(s.quantity) || 0;

          const region = v.mr?.region || 'Other';
          regionTotals[region] = (regionTotals[region] || 0) + (Number(s.quantity) || 0);
        });
      }
    } catch (e) {
      // ignore parse errors
    }
  });

  const productBreakdown = Object.values(productTotals).sort((a, b) => b.quantity - a.quantity);
  const totalSamples = productBreakdown.reduce((acc, curr) => acc + curr.quantity, 0);

  res.json({
    totalSamples,
    byProduct: productBreakdown,
    byRegion: Object.entries(regionTotals).map(([region, quantity]) => ({ region, quantity })),
  });
};

export const getTeamPerformance = async (req: AuthenticatedRequest, res: Response) => {
  let repsQuery: any = { role: 'MR', active: true };
  if (req.user!.role === 'MANAGER') {
    repsQuery.managerId = req.user!.id;
  }

  const reps = await prisma.user.findMany({
    where: repsQuery,
    include: {
      visits: {
        where: { checkOutTime: { not: null } },
      },
      tourPlans: {
        orderBy: { weekStart: 'desc' },
        take: 1,
      },
      expenses: true,
    },
  });

  const targetCallsPerWeek = 25;

  const performance = reps.map((rep) => {
    const completedCalls = rep.visits.length;
    const targetPercentage = Math.min(100, Math.round((completedCalls / targetCallsPerWeek) * 100));
    const totalExpenses = rep.expenses.reduce((acc, exp) => acc + Number(exp.amount), 0);

    return {
      id: rep.id,
      name: rep.name,
      email: rep.email,
      region: rep.region,
      phone: rep.phone,
      completedCalls,
      targetCalls: targetCallsPerWeek,
      achievementPercentage: targetPercentage,
      totalExpenses,
      tourPlanStatus: rep.tourPlans[0]?.status || 'NOT_SUBMITTED',
    };
  });

  res.json({
    teamTargetCalls: reps.length * targetCallsPerWeek,
    teamActualCalls: performance.reduce((acc, curr) => acc + curr.completedCalls, 0),
    data: performance,
  });
};

export const getMrDashboard = async (req: AuthenticatedRequest, res: Response) => {
  const mrId = req.user!.id;

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const [
    totalVisitsThisWeek,
    activeVisit,
    pendingPlansCount,
    pendingExpensesCount,
    recentVisits,
  ] = await Promise.all([
    prisma.visit.count({
      where: {
        mrId,
        checkInTime: { gte: startOfWeek },
        checkOutTime: { not: null },
      },
    }),
    prisma.visit.findFirst({
      where: { mrId, checkOutTime: null },
      include: { doctor: true },
    }),
    prisma.tourPlan.count({
      where: { mrId, status: 'PENDING' },
    }),
    prisma.expense.count({
      where: { mrId, status: 'PENDING' },
    }),
    prisma.visit.findMany({
      where: { mrId },
      orderBy: { checkInTime: 'desc' },
      take: 5,
      include: { doctor: true },
    }),
  ]);

  const weeklyTarget = 25;
  const targetAchievedPercent = Math.min(100, Math.round((totalVisitsThisWeek / weeklyTarget) * 100));

  res.json({
    kpis: {
      visitsThisWeek: totalVisitsThisWeek,
      weeklyTarget,
      targetAchievedPercent,
      pendingTourPlans: pendingPlansCount,
      pendingExpenses: pendingExpensesCount,
    },
    activeVisit: activeVisit || null,
    recentVisits,
  });
};
