import { prisma } from "@/lib/prisma";

export async function logAuditEvent(params: {
  actorId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        actor_id: params.actorId || null,
        action: params.action,
        target_type: params.targetType,
        target_id: params.targetId || null,
        old_value: params.oldValue ? params.oldValue : undefined,
        new_value: params.newValue ? params.newValue : undefined,
        ip_address: params.ipAddress || null,
      },
    });
  } catch (err) {
    console.error("Failed to log audit event:", err);
  }
}
