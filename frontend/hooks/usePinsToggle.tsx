import { useEffect, useState } from 'react';
import { userCreatedPinsQuery, userSavedPinsQuery } from '../utils/queries';
import { client } from '../utils/client';
import type { PinItem, SessionUser } from '../types';

interface Props {
  session: SessionUser;
  activeBtn: string;
  userId: string;
}

const usePinsToggle = ({ activeBtn, userId, session }: Props) => {
  const [pins, setPins] = useState<PinItem[] | null>(null);

  useEffect(() => {
    if (!activeBtn || !userId || !session) return;

    const getPins = async (): Promise<void> => {
      if (session.id === userId) {
        if (activeBtn === 'created') {
          const createdPinsQuery: string = userCreatedPinsQuery(session.id);

          await client.fetch(createdPinsQuery).then((data: PinItem[]): void => {
            if (data.length > 0) {
              setPins(data);
            } else {
              setPins(null);
            }
          });
        }

        if (activeBtn === 'saved') {
          const savedPinsQuery: string = userSavedPinsQuery(session.id);

          await client.fetch(savedPinsQuery).then((data: PinItem[]): void => {
            if (data.length > 0) {
              setPins(data);
            } else {
              setPins(null);
            }
          });
        }
      } else {
        const createdPinsQuery: string = userCreatedPinsQuery(userId);

        await client.fetch(createdPinsQuery).then((data: PinItem[]): void => {
          if (data.length > 0) setPins(data);
        });
      }
    };

    getPins();
  }, [activeBtn, userId, session]);

  return pins;
};

export default usePinsToggle;
