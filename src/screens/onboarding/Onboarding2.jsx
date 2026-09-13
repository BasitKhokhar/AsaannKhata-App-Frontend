import React from 'react';
import { OnboardingSlide } from './OnboardingSlide';
import { StockModesMockup } from './mockups/StockModesMockup';
import { useT } from '../../store/languageStore';

export default function Onboarding2() {
  const t = useT();
  return (
    <OnboardingSlide
      index={1}
      nextRoute="Onboarding3"
      title={t('onboarding.slide2.title')}
      description={t('onboarding.slide2.description')}
      illustration={<StockModesMockup />}
    />
  );
}
