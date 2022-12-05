import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { getSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import { GetServerSideProps, NextPage } from 'next';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import { BsFillArrowUpRightCircleFill } from 'react-icons/bs';
import { IoMdCloudDownload } from 'react-icons/io';
import type {
  PageId,
  PinItem,
  Redirect,
  PinDetail,
  SessionUser,
  SubmitState,
} from '../../types';
import { feedQuery } from '../../utils/queries';
import MasonryLayout from '../../components/MasonryLayout';
import { client } from '../../utils/client';
import { pinDetailQuery } from '../../utils/queries';
import { CommentField, ConfirmModal, NoResult } from '../../components';
import useCheckSaved from '../../hooks/useCheckSaved';
import { useStateContext } from '../../store/stateContext';

interface ModalInfo {
  toggle: boolean;
  id: string;
}

interface ServerSideProps {
  props: {
    session: SessionUser;
    pinId: PageId;
    pins: PinItem[] | null;
    pinDetail: PinDetail | null;
  };
}

interface Props {
  session: SessionUser;
  pinId: string;
  pins: PinItem[] | null;
  pinDetail: PinDetail | null;
}

export const getServerSideProps: GetServerSideProps = async (
  context,
): Promise<Redirect | ServerSideProps> => {
  const session: SessionUser | null = await getSession(context);
  const pinId = context.query.pinId as string;

  if (!session || !pinId) {
    return {
      redirect: {
        destination: '/login',
      },
      props: {},
    };
  }

  const query: string = pinDetailQuery(pinId);

  const pinDetail: PinDetail | null = await client
    .fetch(query)
    .then((data: PinDetail[]) => {
      return data.length < 1 ? null : data[0];
    });

  const pins = await client.fetch(feedQuery).then((data: PinItem[]) => {
    return data.length < 1 ? null : data;
  });

  return {
    props: { session, pinId, pins, pinDetail },
  };
};

const PinDetailPage: NextPage<Props> = ({
  session,
  pinId,
  pinDetail,
  pins,
}) => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [submitState, setSubmitState] = useState<SubmitState>({
    style: 'bg-red-500',
    text: '儲存',
    state: 'unSaved',
  });
  const [isModalOpen, setIsModalOpen] = useState<ModalInfo>({
    toggle: false,
    id: '',
  });
  const [newPinDetail, setNewPinDetail] = useState<PinDetail | null>(pinDetail);
  const isSaved = useCheckSaved({
    pinDetail: newPinDetail,
    session,
    setSubmitState,
  });
  const router = useRouter();
  const { savePin, unSavePin } = useStateContext();

  const toggleSavedBtn = async (newPinDetail: PinDetail) => {
    if (!newPinDetail || !session) return;

    if (isSaved) {
      await unSavePin(newPinDetail, session, setSubmitState).then((pinDetail) =>
        setNewPinDetail(pinDetail),
      );
    } else {
      await savePin(newPinDetail, session, setSubmitState).then((pinDetail) =>
        setNewPinDetail(pinDetail),
      );
    }
  };

  const deletePin = async (): Promise<void> => {
    await client.delete(pinId).then(() => {
      setIsModalOpen({ toggle: false, id: '' });

      toast('刪除成功', { type: 'success' });

      window.setTimeout(() => {
        router.push('/');
      }, 2000);
    });
  };

  return (
    <>
      {isModalOpen.toggle ? (
        <ConfirmModal deletePin={deletePin} setIsModalOpen={setIsModalOpen} />
      ) : null}

      {newPinDetail ? (
        <div className='flex flex-col gap-[5rem]'>
          <div className='flex flex-col md:flex-row items-center md:items-start justify-center w-full h-full px-[3rem] md:px-[6rem] xl:px-[10rem] mt-[3rem] gap-[3rem]'>
            <div
              className='relative w-full md:w-[70%] rounded-[1rem] object-contain'
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <Image
                className='!relative !w-full rounded-[1rem] block'
                src={newPinDetail?.image?.asset?.url}
                blurDataURL={newPinDetail?.image?.asset?.url}
                alt='picture'
                placeholder='blur'
                fill
                sizes='100'
              />

              {isHovered ? (
                <div className='absolute flex flex-col justify-between top-0 w-full h-full p-[1rem] transition-all opacity-0 hover:opacity-100 cursor-pointer'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center justify-center bg-white h-[2.5rem] w-[2.5rem] rounded-full text-black text-[1.2rem] opacity-70 hover:opacity-80 transition-all duration-200 ease-linear'>
                      <Link
                        href={`${newPinDetail.image.asset.url}?dl=`}
                        legacyBehavior
                      >
                        <a
                          download
                          onClick={(
                            e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
                          ) => e.stopPropagation()}
                        >
                          <IoMdCloudDownload />
                        </a>
                      </Link>
                    </div>
                    {session.id !== newPinDetail.userId && (
                      <button
                        className={`${submitState.style} flex items-center justify-center opacity-80 hover:opacity-100 transition-all duration-200 ease-linear rounded-full text-white py-[0.5rem] px-[1rem] font-bold`}
                        disabled={
                          submitState.state === 'uploading' ? true : false
                        }
                        onClick={async (
                          e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
                        ) => {
                          e.stopPropagation();
                          toggleSavedBtn(newPinDetail);
                        }}
                      >
                        {submitState.text}
                      </button>
                    )}
                  </div>

                  <div className='flex justify-between w-full'>
                    <Link
                      href={`/pin-detail/${newPinDetail._id}`}
                      className='flex items-center justify-start bg-white opacity-70 hover:opacity-80 transition-all duration-200 ease-linear rounded-full text-black py-[0.5rem] px-[1rem]'
                    >
                      <BsFillArrowUpRightCircleFill className='mr-[0.5rem]' />
                      {newPinDetail.destination.slice(8, 25)}...
                    </Link>

                    {session.id === newPinDetail.userId && (
                      <div
                        className='flex items-center justify-center text-[1.2rem] bg-white opacity-70 hover:opacity-80 rounded-full text-black h-[2.5rem] w-[2.5rem]'
                        onClick={(
                          e: React.MouseEvent<HTMLDivElement, MouseEvent>,
                        ) => {
                          e.stopPropagation();
                          setIsModalOpen({ toggle: true, id: '' });
                        }}
                      >
                        <RiDeleteBin6Fill />
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className='flex flex-col gap-[1.5rem] w-full h-full'>
              <div>
                <h1 className='text-[1.7rem] font-bold break-words text-text-1'>
                  {newPinDetail?.title}
                </h1>
                <p className='mt-[0.6rem] text-[1.2rem] text-text-2 font-normal opacity-90'>
                  {newPinDetail?.about}
                </p>
              </div>

              <Link href={`/user-profile/${newPinDetail?.postedBy._id}`}>
                <div className='flex items-center gap-[1rem]'>
                  <Image
                    className='rounded-full cursor-pointer'
                    src={newPinDetail?.postedBy?.image}
                    alt='user image'
                    width={40}
                    height={40}
                  />
                  <p className='cursor-pointer font-medium text-[1rem] text-text-2'>
                    {newPinDetail?.postedBy?.userName}
                  </p>
                </div>
              </Link>

              <CommentField session={session} pinId={pinId} />
            </div>
          </div>

          <div className='flex flex-col pb-[10rem]'>
            <p className='px-[3rem] md:px-[6rem] xl:px-[10rem] text-[2rem] font-bold'>
              更多內容
            </p>
            {pins ? <MasonryLayout pins={pins} /> : null}
          </div>
        </div>
      ) : (
        <NoResult />
      )}
    </>
  );
};

export default PinDetailPage;
