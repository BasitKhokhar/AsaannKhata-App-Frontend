import React from 'react';
import { OnboardingSlide } from './OnboardingSlide';
import { SyncDevicesMockup } from './mockups/SyncDevicesMockup';

export default function Onboarding4() {
  return (
    <OnboardingSlide
      index={3}
      isLast
      title={'Work offline, sync\nacross your devices'}
      description="Every shop works without internet, and syncs the moment you're back online."
      illustration={<SyncDevicesMockup />}
    />
  );
}
