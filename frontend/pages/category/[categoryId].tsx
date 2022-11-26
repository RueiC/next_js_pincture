import { useState, useEffect } from "react";
import { GetServerSideProps, NextPage } from "next";
import { getSession } from "next-auth/react";
import { Session } from "next-auth";
import { Feeds, Spinner } from "../../components";
import useStore from "../../store/store";
import { categoryQuery } from "../../utils/queries";
import { client } from "../../utils/client";
import { PageId, PinItem, Redirect } from "../../types";

interface ServerSideProps {
  props: {
    session: Session;
    categoryId: PageId;
  };
}

interface Props {
  session: Session;
  categoryId: string;
}

export const getServerSideProps: GetServerSideProps = async (
  context
): Promise<Redirect | ServerSideProps> => {
  const session: Session | null = await getSession(context);
  const categoryId: PageId = context.query.categoryId;

  if (!session) {
    return {
      redirect: {
        destination: "/login",
      },
      props: {},
    };
  }

  return {
    props: { session, categoryId },
  };
};

const Category: NextPage<Props> = ({ session, categoryId }) => {
  const [pins, setPins] = useState<PinItem[] | null>(null);
  const { isLoading, toggleIsLoading } = useStore();

  useEffect(() => {
    toggleIsLoading(true);
    if (!categoryId || !session) return;

    const getPins = async (): Promise<void> => {
      const query: string = categoryQuery(categoryId);
      await client.fetch(query).then((data: PinItem[]) => {
        if (data.length > 0) setPins(data);
      });
    };

    getPins();
    toggleIsLoading(false);
  }, [categoryId, session]);

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

export default Category;
