import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI GYM Demo',
  description: '健身房 AI 預約機器人 MVP demo',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
