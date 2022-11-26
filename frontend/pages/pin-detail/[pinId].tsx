import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { getSession } from "next-auth/react";
import { toast } from "react-toastify";
import { GetServerSideProps, NextPage } from "next";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { BsFillArrowUpRightCircleFill } from "react-icons/bs";
import { IoMdCloudDownload } from "react-icons/io";
import {
  PageId,
  PinItem,
  Redirect,
  PinDetail,
  SessionUser,
  Save,
} from "../../types";
import { feedQuery } from "../../utils/queries";
import MasonryLayout from "../../components/MasonryLayout";
import useStore from "../../store/store";
import { client } from "../../utils/client";
import { pinDetailQuery } from "../../utils/queries";
import { Spinner, CommentField, ConfirmModal } from "../../components";

interface ModalInfo {
  toggle: boolean;
  id: string;
}

interface ServerSideProps {
  props: {
    session: SessionUser;
    pinId: PageId;
  };
}

interface Props {
  session: SessionUser;
  pinId: string;
}

export const getServerSideProps: GetServerSideProps = async (
  context
): Promise<Redirect | ServerSideProps> => {
  const session: SessionUser | null = await getSession(context);
  const pinId: PageId = context.query.pinId;

  if (!session) {
    return {
      redirect: {
        destination: "/login",
      },
      props: {},
    };
  }

  return {
    props: { session, pinId },
  };
};

const PinDetailPage: NextPage<Props> = ({ session, pinId }) => {
  const [pins, setPins] = useState<PinItem[] | null>(null);
  const [pinDetail, setPinDetail] = useState<PinDetail | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<ModalInfo>({
    toggle: false,
    id: "",
  });
  const router = useRouter();
  const { isLoading, toggleIsLoading } = useStore();

  useEffect(() => {
    if (pinDetail === null || pinDetail?.save === null || !session) return;

    const alreadySaved: boolean = pinDetail.save.some(
      (item: Save): boolean => item.userId === session.id
    );

    if (alreadySaved) setIsSaved(true);
    else setIsSaved(false);
  }, [pinDetail, session]);

  useEffect(() => {
    toggleIsLoading(true);

    if (!pinId || !session) return;

    const getData = async () => {
      const query: string = pinDetailQuery(pinId);

      const pinDetail: PinDetail | null = await client
        .fetch(query)
        .then((data: PinDetail[]) => {
          return data.length < 1 ? null : data[0];
        });

      setPinDetail(pinDetail);

      await client.fetch(feedQuery).then((data: PinItem[]) => {
        if (data.length > 0) setPins(data);
      });

      toggleIsLoading(false);
    };

    getData();
  }, [pinId, session]);

  const deletePin = async (): Promise<void> => {
    await client.delete(pinId).then(() => {
      setIsModalOpen({ toggle: false, id: "" });

      toast("刪除成功", { type: "success" });

      window.setTimeout(() => {
        router.push("/");
      }, 2000);
    });
  };

  return (
    <>
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          {isModalOpen.toggle && (
            <ConfirmModal
              deletePin={deletePin}
              setIsModalOpen={setIsModalOpen}
            />
          )}
          {pinDetail ? (
            <div className="flex flex-col gap-[5rem]">
              <div className="flex flex-col md:flex-row items-center md:items-start justify-center w-full h-full px-[3rem] md:px-[6rem] xl:px-[10rem] mt-[3rem] gap-[3rem]">
                <div
                  className="relative w-full md:w-[70%] rounded-[1rem] object-contain"
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <Image
                    className="!relative !w-full rounded-[1rem] block"
                    src={pinDetail?.image?.asset?.url}
                    blurDataURL={pinDetail?.image?.asset?.url}
                    alt="picture"
                    placeholder="blur"
                    fill
                    sizes="100"
                  />

                  {isHovered && (
                    <div className="absolute flex flex-col justify-between top-0 w-full h-full p-[1rem] transition-all opacity-0 hover:opacity-100 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center justify-center bg-white h-[2.5rem] w-[2.5rem] rounded-full text-black text-[1.2rem] opacity-70 hover:opacity-80 transition-all duration-200 ease-linear">
                          <Link
                            href={`${pinDetail.image.asset.url}?dl=`}
                            legacyBehavior
                          >
                            <a
                              download
                              onClick={(
                                e: React.MouseEvent<
                                  HTMLAnchorElement,
                                  MouseEvent
                                >
                              ) => e.stopPropagation()}
                            >
                              <IoMdCloudDownload />
                            </a>
                          </Link>
                        </div>
                        {session.id !== pinDetail.userId && (
                          <>
                            {!isSaved ? (
                              <div
                                className="flex items-center justify-center bg-red-600 opacity-80 hover:opacity-100 transition-all duration-200 ease-linear rounded-full text-white py-[0.5rem] px-[1rem] font-bold"
                                onClick={(
                                  e: React.MouseEvent<
                                    HTMLDivElement,
                                    MouseEvent
                                  >
                                ) => {
                                  e.stopPropagation();
                                  // savePin(pinItem._id);
                                }}
                              >
                                儲存
                              </div>
                            ) : (
                              <div
                                className="flex items-center justify-center bg-red-600 opacity-80 hover:opacity-100 transition-all duration-200 ease-linear rounded-full text-white py-[0.5rem] px-[1rem] font-bold"
                                onClick={(
                                  e: React.MouseEvent<
                                    HTMLDivElement,
                                    MouseEvent
                                  >
                                ) => {
                                  e.stopPropagation();
                                  // unSavePin(pinItem._id);
                                }}
                              >
                                已儲存
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex justify-between w-full">
                        <Link
                          href={`/pin-detail/${pinDetail._id}`}
                          className="flex items-center justify-start bg-white opacity-70 hover:opacity-80 transition-all duration-200 ease-linear rounded-full text-black py-[0.5rem] px-[1rem]"
                        >
                          <BsFillArrowUpRightCircleFill className="mr-[0.5rem]" />
                          {pinDetail.destination.slice(8, 25)}...
                        </Link>

                        {session.id === pinDetail.userId && (
                          <div
                            className="flex items-center justify-center text-[1.2rem] bg-white opacity-70 hover:opacity-80 rounded-full text-black h-[2.5rem] w-[2.5rem]"
                            onClick={(
                              e: React.MouseEvent<HTMLDivElement, MouseEvent>
                            ) => {
                              e.stopPropagation();
                              setIsModalOpen({ toggle: true, id: "" });
                            }}
                          >
                            <RiDeleteBin6Fill />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-[1.5rem] w-full h-full">
                  <div>
                    <h1 className="text-[1.7rem] font-bold break-words text-text-1">
                      {pinDetail?.title}
                    </h1>
                    <p className="mt-[0.6rem] text-[1.2rem] text-text-2 font-normal opacity-90">
                      {pinDetail?.about}
                    </p>
                  </div>

                  <Link href={`/user-profile/${pinDetail?.postedBy._id}`}>
                    <div className="flex items-center gap-[1rem]">
                      <Image
                        className="rounded-full cursor-pointer"
                        src={pinDetail?.postedBy?.image}
                        alt="user image"
                        width={40}
                        height={40}
                      />
                      <p className="cursor-pointer font-medium text-[1rem] text-text-2">
                        {pinDetail?.postedBy?.userName}
                      </p>
                    </div>
                  </Link>

                  <CommentField session={session} pinId={pinId} />
                </div>
              </div>

              <div className="flex flex-col pb-[10rem]">
                <p className="px-[3rem] md:px-[6rem] xl:px-[10rem] text-[2rem] font-bold">
                  更多內容
                </p>
                {pins && <MasonryLayout pins={pins} />}
              </div>
            </div>
          ) : (
            <Spinner />
          )}
        </>
      )}
    </>
  );
};

export default PinDetailPage;