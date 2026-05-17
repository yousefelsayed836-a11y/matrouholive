import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';
import Header from '../components/Header';
import { CartProvider } from '../components/CartContext';

const inter = Inter({ subsets: ['latin'] });
const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo' });

export const metadata: Metadata = {
  title: 'Matrouh Olive - زيت زيتون مطروح',
  description: 'أجود أنواع زيت الزيتون من مطروح',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://assets.wuiltstore.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.matrouholive.com" />
      </head>
      <body className={`${inter.className} ${cairo.variable}`} style={{ background: '#fff', margin: 0 }}>
        <CartProvider>
          <Header />
          <main style={{ minHeight: '100vh', background: '#fff' }}>
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  );
}
