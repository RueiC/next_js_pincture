import { useEffect, useState } from "react";
import { LazyMotion, m, domAnimation } from "framer-motion";
import { SessionProvider } from "next-auth/react";
import { ToastContainer } from "react-toastify";
import { AppProps } from "next/app";

import { NavBar, Categories } from "../components/index";
import "react-toastify/dist/ReactToastify.css";
import "../styles/globals.css";

interface CustomAppProps extends AppProps {
  session: any;
}

const MyApp = ({ Component, pageProps, router, session }: CustomAppProps) => {
  const [isSSR, setIsSSR] = useState<boolean>(true);

  useEffect(() => {
    setIsSSR(false);
  }, []);

  if (isSSR) return null;

  return (
    <SessionProvider session={session}>
      <LazyMotion features={domAnimation} strict>
        <m.div
          key={router.route}
          initial="pageInitial"
          animate="pageAnimate"
          variants={{
            pageInitial: { opacity: 0 },
            pageAnimate: { opacity: 1 },
          }}
        >
          <ToastContainer
            position="top-center"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
          {router.route !== "/login" && (
            <>
              <NavBar />
              <Categories />
            </>
          )}

          <Component {...pageProps} />
        </m.div>
      </LazyMotion>
    </SessionProvider>
  );
};
export default MyApp;
