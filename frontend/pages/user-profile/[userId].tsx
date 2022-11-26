import { useState, useEffect } from 'react';
import Image from 'next/image';
import { GetServerSideProps, NextPage } from 'next';
import { getSession } from 'next-auth/react';
import { PinItem, Redirect, User, PageId, SessionUser } from '../../types';
import { client } from '../../utils/client';
import MasonryLayout from '../../components/MasonryLayout';
import useStore from '../../store/store';
import {
  userCreatedPinsQuery,
  userQuery,
  userSavedPinsQuery,
} from '../../utils/queries';
import { Spinner } from '../../components/index';

interface ServerSideProps {
  props: {
    session: SessionUser;
    userId: PageId;
  };
}

interface Props {
  session: SessionUser;
  userId: string;
}

export const getServerSideProps: GetServerSideProps = async (
  context,
): Promise<Redirect | ServerSideProps> => {
  const session: SessionUser | null = await getSession(context);
  const userId: PageId = context.query.userId;

  if (!session) {
    return {
      redirect: {
        destination: '/login',
      },
      props: {},
    };
  }

  return {
    props: { session, userId },
  };
};

const UserProfile: NextPage<Props> = ({ session, userId }) => {
  const [user, setUser] = useState<User | null>(null);
  const [pins, setPins] = useState<PinItem[] | null>(null);
  const [activeBtn, setActiveBtn] = useState<string>('created');
  const { isLoading, toggleIsLoading } = useStore();

  const activeBtnStyles: string =
    'bg-red-500 text-white font-medium py-2 rounded-full outline-none px-[1rem]';
  const notActiveBtnStyles: string =
    'bg-primary mr-4 text-black font-medium py-2 rounded-full outline-none px-[1rem] text-text-2 opacity-90';

  useEffect(() => {
    toggleIsLoading(true);
    if (!userId || !session) return;

    const getData = async (): Promise<void> => {
      const query: string = userQuery(userId);

      const userData: User | null = await client.fetch(query).then((data) => {
        return data.length < 1 ? null : data[0];
      });

      setUser(userData);
    };

    getData();
    toggleIsLoading(false);
  }, [userId, session]);

  useEffect(() => {
    if (!userId) return;

    const getPins = async (): Promise<void> => {
      if (!activeBtn || !userId || !session) return;

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

  return (
    <>
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          {user && (
            <>
              <div className='flex flex-col items-center justify-start gap-[1.2rem] mt-[1.2rem]'>
                <Image
                  className='block rounded-full mt-[2rem] sm:mt-[1rem]'
                  src={user?.image}
                  alt='user image'
                  width={112}
                  height={112}
                />

                <h1 className='font-bold text-[1.8rem] text-center text-text-1'>
                  {user?.userName}
                </h1>

                {session.id === user._id && (
                  <div className='flex items-center justify-center gap-[0.5rem] mb-[2rem] text-[1rem]'>
                    <button
                      className={`${
                        activeBtn === 'created'
                          ? activeBtnStyles
                          : notActiveBtnStyles
                      } font-bold hover:scale-105 transition-all duration-300 ease-in-out`}
                      type='button'
                      onClick={() => setActiveBtn('created')}
                    >
                      已創建
                    </button>
                    <button
                      className={`${
                        activeBtn === 'saved'
                          ? activeBtnStyles
                          : notActiveBtnStyles
                      } font-bold hover:scale-105 transition-all duration-300 ease-in-out`}
                      type='button'
                      onClick={() => setActiveBtn('saved')}
                    >
                      已儲存
                    </button>
                  </div>
                )}
              </div>

              {pins ? <MasonryLayout pins={pins} /> : <Spinner />}
            </>
          )}
        </>
      )}
    </>
  );
};

export default UserProfile;
