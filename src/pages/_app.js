import "@/styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import Layout from "@/components/Layout";
import { useRouter } from "next/router";
import NotificationManager from "@/components/NotificationManager";
import { Toaster } from 'react-hot-toast';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const isAdPage = router.pathname.startsWith("/ad/");
  const isEmbedPage = router.pathname === "/embed";
  const isHomePage = router.pathname === "/";

  if (isAdPage || isEmbedPage) {
    return (
      <ClerkProvider>
        <NotificationManager />
        <Toaster position="top-right" />
        <Component {...pageProps} />
      </ClerkProvider>
    );
  }

  return (
    <ClerkProvider>
      <NotificationManager />
      <Toaster position="top-right" />
      <Layout fullPage={router.pathname === '/feed'}>
        <Component {...pageProps} />
      </Layout>
    </ClerkProvider>
  );
}
