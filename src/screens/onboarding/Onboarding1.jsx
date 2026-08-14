import React from 'react';
import { OnboardingSlide } from './OnboardingSlide';
import { BusinessSwitcherMockup } from './mockups/BusinessSwitcherMockup';

export default function Onboarding1() {
  return (
    <OnboardingSlide
      index={0}
      nextRoute="Onboarding2"
      title={'Run every kind of shop,\none app'}
      description="General stores, pharmacies, hardware, boutiques — AsaanKhata adapts to your business."
      illustration={<BusinessSwitcherMockup />}
    />
  );
}
