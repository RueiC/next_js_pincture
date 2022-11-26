import { useState, useEffect } from "react";
import { GetServerSideProps, NextPage } from "next";
import { getSession } from "next-auth/react";
import { Session } from "next-auth/core/types";
import { Feeds, NoResult, Spinner } from "../components";
import { feedQuery } from "../utils/queries";
import { client } from "../utils/client";
import { PinItem, Redirect } from "../types";
import useStore from "../store/store";

interface ServerSideProps {
  props: { session: Session };
}

interface Props {
  session: Session;
}

export const getServerSideProps: GetServerSideProps = async (
  context
): Promise<Redirect | ServerSideProps> => {
  const session: Session | null = await getSession(context);

  if (!session) {
    return {
      redirect: {
        destination: "/login",
      },
      props: {},
    };
  }

  return {
    props: { session },
  };
};

const Home: NextPage<Props> = ({ session }) => {
  const [pins, setPins] = useState<PinItem[]>([]);
  const { isLoading, toggleIsLoading } = useStore();

  useEffect(() => {
    toggleIsLoading(true);
    if (!session) return;

    const getData = async (): Promise<void | JSX.Element> => {
      const data = await client.fetch(feedQuery);

      if (data.length === 0) {
        toggleIsLoading(false);
        return <NoResult />;
      } else {
        setPins(data);
        toggleIsLoading(false);
      }
    };

    getData();
  }, [session]);

  return (
    <>
      {isLoading ? (
        <Spinner />
      ) : (
        <>{pins ? <Feeds pins={pins} /> : <Spinner />}</>
      )}
    </>
  );
};

export default Home;
