export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;400;600&family=Space+Mono:wght@400;700&family=Noto+Sans+SC:wght@300;400;500&display=swap"
      />
      <div style={{ minHeight: '100vh', background: '#faf9f7', color: '#1a1916' }}>
        {children}
      </div>
    </>
  )
}
