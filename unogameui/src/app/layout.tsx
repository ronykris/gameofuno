import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'UNO Game',
  description: 'A decentralized UNO game built on EVM chain',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`bg-auto bg-[url("/bg.png")] ${inter.className}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}