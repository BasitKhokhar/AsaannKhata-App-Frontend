import React from 'react';
import { OnboardingSlide } from './OnboardingSlide';
import { StockModesMockup } from './mockups/StockModesMockup';

export default function Onboarding2() {
  return (
    <OnboardingSlide
      index={1}
      nextRoute="Onboarding3"
      title={'Track quantity, area, length,\nor packs — your way'}
      description="Set the stock mode once per shop. Billing and inventory adapt automatically."
      illustration={<StockModesMockup />}
    />
  );
}
