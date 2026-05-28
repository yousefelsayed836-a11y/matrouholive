import type { Metadata } from 'next';
import { Cairo, Readex_Pro } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import Header from '../components/Header';
import { CartProvider } from '../components/CartContext';
import FaviconLoader from '../components/FaviconLoader';

const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo', weight: ['300','400','600','700','800','900'] });
const readex = Readex_Pro({ subsets: ['arabic'], variable: '--font-readex', weight: ['200','300','400','500','600','700'] });

export const metadata: Metadata = {
  title: 'Matrouh Olive - زيت زيتون مطروح',
  description: 'أجود أنواع زيت الزيتون من مطروح',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* Apply cached favicon instantly before hydration to avoid flicker */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var f = localStorage.getItem('favicon_cache');
            if (f) {
              var l = document.createElement('link');
              l.rel = 'icon';
              l.href = f;
              document.head.appendChild(l);
            }
          } catch(e) {}
        ` }} />
        <link rel="preconnect" href="https://assets.wuiltstore.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.matrouholive.com" />
        <noscript>
          <img height="1" width="1" style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1441876790405084&ev=PageView&noscript=1" />
        </noscript>
      </head>
      <body className={`${cairo.variable} ${readex.variable}`} style={{ background: '#f1f7c9', margin: 0 }}>
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
          <main style={{ minHeight: '100vh', background: '#f1f7c9' }}>
            {children}
          </main>
        </CartProvider>
      </body>
    </html>
  );
}
