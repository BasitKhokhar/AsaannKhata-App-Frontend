import React from 'react';
import { OnboardingSlide } from './OnboardingSlide';
import { BusinessSwitcherMockup } from './mockups/BusinessSwitcherMockup';
import { useT } from '../../store/languageStore';

export default function Onboarding1() {
  const t = useT();
  return (
    <OnboardingSlide
      index={0}
      nextRoute="Onboarding2"
      title={t('onboarding.slide1.title')}
      description={t('onboarding.slide1.description')}
      illustration={<BusinessSwitcherMockup />}
    />
  );
}
