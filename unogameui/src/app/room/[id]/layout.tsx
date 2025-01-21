"use client"

import TokenInfoBar from '@/components/TokenBar'
import { SoundProvider } from '../../../context/SoundProvider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SoundProvider>
          <TokenInfoBar />
          {children}
        </SoundProvider>
      </body>
    </html>
  )
}