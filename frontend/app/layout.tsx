import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Header from '../components/Header';
import { CartProvider } from '../components/CartContext';
import FaviconLoader from '../components/FaviconLoader';

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
        <noscript>
          <img height="1" width="1" style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1441876790405084&ev=PageView&noscript=1" />
        </noscript>
      </head>
      <body className={`${inter.className} ${cairo.variable}`} style={{ background: '#fff', margin: 0 }}>
        <Script id="fb-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
          (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init','1441876790405084');fbq('track','PageView');
        `}</Script>
        <CartProvider>
          <FaviconLoader />
          <Header />
          <main style={{ minHeight: '100vh', background: '#fff' }}>
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  );
}
