import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'onMyWay - School Arrival Notifications',
  description: 'Real-time notifications for parents arriving at school',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
