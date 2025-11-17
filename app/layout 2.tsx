import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Add Route - Visualize Your Strava Routes',
  description: 'Web application for visualizing and sharing your cycling routes from Strava',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}

