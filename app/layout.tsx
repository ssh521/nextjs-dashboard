import '@/app/ui/global.css';
import { malgunGothic } from '@/app/ui/fonts';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${malgunGothic.variable} antialiased`}>{children}</body>
    </html>
  );
}
