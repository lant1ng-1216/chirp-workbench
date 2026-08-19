import { redirect } from 'next/navigation'

/** Catch-all for any leftover /app/[projectId]/* paths → workbench */
export default async function LegacyProjectLayout({
  params,
}: {
  params: Promise<{ projectId: string }>
  children?: React.ReactNode
}) {
  const { projectId } = await params
  redirect(`/workbench/${projectId}`)
}
