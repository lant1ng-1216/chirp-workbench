import { redirect } from 'next/navigation'

/** Stub: old multi-page overview neutralized — project routes redirect in layout */
export default async function LegacyProjectIndex({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  redirect(`/workbench/${projectId}`)
}
