import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SwearJar — QA Edition',
  description: 'Drop your coins. Own your crimes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
