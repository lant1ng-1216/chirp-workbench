import { redirect } from 'next/navigation'

/** Legacy onboarding → project cards dashboard */
export default function OnboardingRedirect() {
  redirect('/dashboard')
}
