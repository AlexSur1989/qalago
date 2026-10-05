import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  MONETIZATION_DISABLED_ERROR_CODE,
  MonetizationMode,
  MONETIZATION_PURCHASES_FLAG,
  FREE_LAUNCH_ACCESS_FLAG,
  buildMonetizationModePublicDto,
  flagsForMonetizationMode,
  resolveMonetizationMode,
  type MonetizationModePublicDto,
} from '@qalago/shared-types';
import { PrismaService } from '../../prisma/prisma.service';

const DEFAULT_PURCHASES = true;
const DEFAULT_LAUNCH_ACCESS = false;

@Injectable()
export class MonetizationModeService {
  constructor(private readonly prisma: PrismaService) {}

  async readGlobalModeFlags(): Promise<{
    monetizationPurchasesEnabled: boolean;
    freeLaunchAccessEnabled: boolean;
  }> {
    const rows = await this.prisma.featureFlagDefinition.findMany({
      where: {
        key: { in: [MONETIZATION_PURCHASES_FLAG, FREE_LAUNCH_ACCESS_FLAG] },
      },
    });
    const byKey = new Map(rows.map((r) => [r.key, r.globalEnabled]));
    return {
      monetizationPurchasesEnabled:
        byKey.get(MONETIZATION_PURCHASES_FLAG) ?? DEFAULT_PURCHASES,
      freeLaunchAccessEnabled: byKey.get(FREE_LAUNCH_ACCESS_FLAG) ?? DEFAULT_LAUNCH_ACCESS,
    };
  }

  async getMode(): Promise<MonetizationMode> {
    const flags = await this.readGlobalModeFlags();
    return resolveMonetizationMode(
      flags.monetizationPurchasesEnabled,
      flags.freeLaunchAccessEnabled,
    );
  }

  async getPublicDto(): Promise<MonetizationModePublicDto> {
    return buildMonetizationModePublicDto(await this.getMode());
  }

  isPlanPurchaseAllowed(mode: MonetizationMode): boolean {
    return mode === MonetizationMode.NORMAL;
  }

  isAdPurchaseAllowed(mode: MonetizationMode): boolean {
    return mode === MonetizationMode.NORMAL;
  }

  isLaunchAccessActive(mode: MonetizationMode): boolean {
    return mode === MonetizationMode.LAUNCH;
  }

  async assertPurchasesAllowed(): Promise<void> {
    const mode = await this.getMode();
    if (mode !== MonetizationMode.NORMAL) {
      throw new ForbiddenException({
        message: 'Monetization temporarily unavailable',
        code: MONETIZATION_DISABLED_ERROR_CODE,
      });
    }
  }

  async applyMode(mode: MonetizationMode): Promise<void> {
    const flags = flagsForMonetizationMode(mode);
    const now = new Date();
    await this.prisma.featureFlagDefinition.upsert({
      where: { key: MONETIZATION_PURCHASES_FLAG },
      create: {
        key: MONETIZATION_PURCHASES_FLAG,
        globalEnabled: flags.monetizationPurchasesEnabled,
        description: 'Plan and ad purchase checkout (NORMAL when true)',
        updatedAt: now,
      },
      update: {
        globalEnabled: flags.monetizationPurchasesEnabled,
        updatedAt: now,
      },
    });
    await this.prisma.featureFlagDefinition.upsert({
      where: { key: FREE_LAUNCH_ACCESS_FLAG },
      create: {
        key: FREE_LAUNCH_ACCESS_FLAG,
        globalEnabled: flags.freeLaunchAccessEnabled,
        description: 'Launch operational capability uplift when purchases disabled',
        updatedAt: now,
      },
      update: {
        globalEnabled: flags.freeLaunchAccessEnabled,
        updatedAt: now,
      },
    });
  }
}
