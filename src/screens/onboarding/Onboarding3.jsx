import React from 'react';
import { OnboardingSlide } from './OnboardingSlide';
import { BillingLedgerMockup } from './mockups/BillingLedgerMockup';

export default function Onboarding3() {
  return (
    <OnboardingSlide
      index={2}
      nextRoute="Onboarding4"
      title={'Bill customers, track khata,\nget paid'}
      description="Take partial payments and keep a running credit ledger for every customer."
      illustration={<BillingLedgerMockup />}
    />
  );
}
