/// Path segments under `/business/…` that are onboarding flows, not business IDs.
const businessOnboardingPathSegments = <String>{
  'apply',
  'search',
  'start',
  'applications',
  'claims',
};

bool isBusinessOnboardingPathSegment(String segment) {
  return businessOnboardingPathSegments.contains(segment);
}
