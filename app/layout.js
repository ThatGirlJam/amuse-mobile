import './globals.css'

export const metadata = {
  title: 'Amuse',
  description: 'An application that can identify a user\'s facial feature types and recommend makeup tutorials that suit it',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

