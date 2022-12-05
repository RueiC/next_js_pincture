import { Session } from 'next-auth/core/types';
import { useEffect, useState } from 'react';
import { useStateContext } from '../store/stateContext';
import { PinItem } from '../types';
import { client } from '../utils/client';
import { categoryQuery } from '../utils/queries';

interface Props {
  session: Session;
  categoryId: string;
}

const useCategoriesFilter = ({ categoryId, session }: Props) => {
  const [pins, setPins] = useState<PinItem[] | null>(null);
  const { isLoading, setIsLoading } = useStateContext();

  useEffect(() => {
    setIsLoading(true);
    if (!categoryId || !session) return;

    const getPins = async (): Promise<void> => {
      const query: string = categoryQuery(categoryId);
      await client.fetch(query).then((data: PinItem[]) => {
        if (data.length > 0) setPins(data);
      });
    };

    getPins();
    setIsLoading(false);
  }, [categoryId, session]);

  return { isLoading, pins };
};

export default useCategoriesFilter;
