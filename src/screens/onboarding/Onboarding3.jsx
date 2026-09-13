import React from 'react';
import { OnboardingSlide } from './OnboardingSlide';
import { BillingLedgerMockup } from './mockups/BillingLedgerMockup';
import { useT } from '../../store/languageStore';

export default function Onboarding3() {
  const t = useT();
  return (
    <OnboardingSlide
      index={2}
      nextRoute="Onboarding4"
      title={t('onboarding.slide3.title')}
      description={t('onboarding.slide3.description')}
      illustration={<BillingLedgerMockup />}
    />
  );
}
