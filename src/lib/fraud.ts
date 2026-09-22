import { prisma } from "@/lib/prisma";
import { FraudSeverity, FraudStatus } from "@prisma/client";

export async function flagSuspiciousActivity(params: {
  userId?: string;
  submissionId?: string;
  type: string;
  severity?: FraudSeverity;
  description: string;
}) {
  try {
    const flag = await prisma.fraudFlag.create({
      data: {
        user_id: params.userId || null,
        submission_id: params.submissionId || null,
        type: params.type,
        severity: params.severity || FraudSeverity.MEDIUM,
        description: params.description,
        status: FraudStatus.OPEN,
      },
    });

    console.warn(`[FRAUD_FLAG] ${params.type} - ${params.description}`);
    return flag;
  } catch (err) {
    console.error("Failed to record fraud flag:", err);
  }
}
