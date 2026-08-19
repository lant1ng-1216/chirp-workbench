import { redirect } from 'next/navigation'

/** Any legacy nested path under /app/[projectId]/* → workbench */
export default async function LegacyNestedRedirect({
  params,
}: {
  params: Promise<{ projectId: string; slug: string[] }>
}) {
  const { projectId } = await params
  redirect(`/workbench/${projectId}`)
}
