import React from 'react';
import { OnboardingSlide } from './OnboardingSlide';
import { SyncDevicesMockup } from './mockups/SyncDevicesMockup';
import { useT } from '../../store/languageStore';

export default function Onboarding4() {
  const t = useT();
  return (
    <OnboardingSlide
      index={3}
      isLast
      title={t('onboarding.slide4.title')}
      description={t('onboarding.slide4.description')}
      illustration={<SyncDevicesMockup />}
    />
  );
}
