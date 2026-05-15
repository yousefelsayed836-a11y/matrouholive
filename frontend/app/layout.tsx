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
    <html lang="en" dir="ltr">
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
