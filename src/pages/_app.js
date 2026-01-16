import "@/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Layout from "@/components/Layout";
import { useRouter } from "next/router";
import NotificationManager from "@/components/NotificationManager";
import { Toaster } from 'react-hot-toast';
import Script from 'next/script';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isAdPage = router.pathname.startsWith("/ad/");
  const isEmbedPage = router.pathname === "/embed";
  const isHomePage = router.pathname === "/";

  const isARPage = router.pathname.startsWith("/ad/") || router.pathname === "/ar-cam";

  return (
    <ClerkProvider>
      {isARPage && (
        <>
          <Script
            id="aframe-lib"
            src="https://aframe.io/releases/1.4.2/aframe.min.js"
            strategy="afterInteractive"
          />
          <Script
            id="mindar-lib"
            src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.2/dist/mindar-image-aframe.prod.js"
            strategy="afterInteractive"
          />
        </>
      )}
      <NotificationManager />
      <Toaster position="top-right" />
      {isAdPage || isEmbedPage ? (
        <Component {...pageProps} />
      ) : (
        <Layout fullPage={router.pathname === '/feed'}>
          <Component {...pageProps} />
        </Layout>
      )}
    </ClerkProvider>
  );
}
