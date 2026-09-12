# Staff MFA recovery

## User has authenticator + recovery codes

Use **recovery code** at login MFA screen («Использовать резервный код»). Code is one-time.

## User lost device but has recovery codes

Same as above. Regenerate codes after login: `/settings/security` (requires TOTP + recent step-up).

## User lost device and recovery codes

1. Another **SUPER_ADMIN** with MFA: staff detail → MFA reset (step-up + caller MFA).
2. **Only SUPER_ADMIN** locked out: infrastructure owner runs break-glass CLI on production host (not HTTP):

```powershell
cd services/catalog-api
$env:BREAK_GLASS_CONFIRM="I_UNDERSTAND_STAFF_MFA_RESET"
npm run staff:mfa:emergency-reset -- --phone=+77000000001
```

Effects: MFA removed, **all sessions revoked**, audit `STAFF_MFA_EMERGENCY_RESET`, user must enroll MFA on next login (mandatory for SUPER_ADMIN in production).

## Do not

- Edit ciphertext in DB manually.
- Use a universal bypass code in production.
