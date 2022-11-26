import { useEffect, useState } from "react";
import { GetServerSideProps, NextPage } from "next";
import { Session } from "next-auth/core/types";
import { getSession } from "next-auth/react";
import useStore from "../../store/store";
import { PageId, PinItem, Redirect } from "../../types";
import MasonryLayout from "../../components/MasonryLayout";
import { client } from "../../utils/client";
import { searchQuery } from "../../utils/queries";
import { NoResult, Spinner } from "../../components";

interface ServerSideProps {
  props: {
    session: Session;
    searchId: PageId;
  };
}

interface Props {
  session: Session;
  searchId: string;
}

export const getServerSideProps: GetServerSideProps = async (
  context
): Promise<Redirect | ServerSideProps> => {
  const session: Session | null = await getSession(context);
  const searchId: PageId = context.query.searchId;

  if (!session) {
    return {
      redirect: {
        destination: "/login",
      },
      props: {},
    };
  }

  return {
    props: { session, searchId },
  };
};

const Search: NextPage<Props> = ({ session, searchId }) => {
  const [pins, setPins] = useState<PinItem[] | null>(null);
  const { isLoading, toggleIsLoading } = useStore();

  useEffect(() => {
    toggleIsLoading(true);
    if (!searchId || searchId === "" || !session) return;

    const getPins = async (): Promise<void> => {
      const query: string = searchQuery(searchId.toLowerCase());

      await client.fetch(query).then((data: PinItem[]): any => {
        setPins(data);
      });
    };

    getPins();

    toggleIsLoading(false);
  }, [searchId, session]);

  return (
    <>
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          {pins?.length !== 0 && pins ? (
            <MasonryLayout pins={pins} />
          ) : (
            <NoResult />
          )}
        </>
      )}
    </>
  );
};

export default Search;
