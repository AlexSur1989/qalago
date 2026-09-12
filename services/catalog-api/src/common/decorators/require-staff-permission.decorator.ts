import { SetMetadata } from '@nestjs/common';
import { StaffPermission } from '@qalago/shared-types';

export const STAFF_PERMISSIONS_KEY = 'staff_permissions';
export const STAFF_STEP_UP_KEY = 'staff_step_up';

/** Requires explicit staff permission(s); user must satisfy at least one if multiple listed. */
export const RequireStaffPermission = (...permissions: StaffPermission[]) =>
  SetMetadata(STAFF_PERMISSIONS_KEY, permissions);

/** Critical mutation requires recent step-up verification (see staff-step-up.service). */
export const RequireStaffStepUp = () => SetMetadata(STAFF_STEP_UP_KEY, true);

/** Marks controller/routes as staff-portal (active StaffAccess required). */
export const ADMIN_STAFF_ROUTE_KEY = 'admin_staff_route';
export const AdminStaffRoute = () => SetMetadata(ADMIN_STAFF_ROUTE_KEY, true);

/** Staff MFA self-service (allowed while MFA enrollment is pending). */
export const STAFF_MFA_SELF_ROUTE_KEY = 'staff_mfa_self_route';
export const StaffMfaSelfRoute = () => SetMetadata(STAFF_MFA_SELF_ROUTE_KEY, true);
