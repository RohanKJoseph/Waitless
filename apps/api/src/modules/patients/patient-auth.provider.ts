import { AppError } from "../../utils/errors";

export interface PatientSessionResult {
  kind: "mock" | "sms-otp";
  phoneVerified: boolean;
  challengeId?: string;
}

export interface PatientAuthProvider {
  beginSession(phone: string): Promise<PatientSessionResult>;
  verify?(phone: string, code: string): Promise<PatientSessionResult>;
}

class MockPatientAuthProvider implements PatientAuthProvider {
  async beginSession(): Promise<PatientSessionResult> {
    // No OTP for now (explicit product decision). Phone is stored as unverified.
    return { kind: "mock", phoneVerified: false };
  }
}

class SmsOtpPatientAuthProvider implements PatientAuthProvider {
  async beginSession(): Promise<PatientSessionResult> {
    // OTP upgrade path:
    // 1. Generate + store hashed OTP challenge (Redis, TTL 5 min) keyed by phone.
    // 2. Send via SMS_PROVIDER adapter and return challengeId.
    // 3. Client calls verify() with challengeId+code before issuing a session token.
    throw AppError.notImplemented("SMS OTP sign-in is not enabled yet");
  }

  async verify(): Promise<PatientSessionResult> {
    throw AppError.notImplemented("SMS OTP verification is not enabled yet");
  }
}

const provider: PatientAuthProvider = new MockPatientAuthProvider();

export function getPatientAuthProvider(): PatientAuthProvider {
  return provider;
}

export const _smsOtpProviderStub = new SmsOtpPatientAuthProvider();
