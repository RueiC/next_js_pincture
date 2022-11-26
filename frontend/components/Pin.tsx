import React, { useState, useEffect, Dispatch, SetStateAction } from "react";
import Image from "next/image";
import Link from "next/link";
import { v4 as uuidv4 } from "uuid";
import { m } from "framer-motion";
import { RiDeleteBin6Fill } from "react-icons/ri";
import { BsFillArrowUpRightCircleFill } from "react-icons/bs";
import { IoMdCloudDownload } from "react-icons/io";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

import { client, urlFor } from "../utils/client";
import { PinItem, Save, SessionUser, SubmitState } from "../types";
import { useSession } from "next-auth/react";

interface Props {
  pin: PinItem;
  setIsModalOpen: Dispatch<SetStateAction<ModalInfo>>;
}

interface ModalInfo {
  toggle: boolean;
  id: string;
}

const Pin = ({ pin, setIsModalOpen }: Props) => {
  const [pinItem, setPinItem] = useState<PinItem | null>(pin);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [submitState, setSubmitState] = useState<SubmitState>({
    style: "bg-red-500",
    text: "儲存",
    state: "none",
  });
  const router = useRouter();
  const { data: session }: { data: SessionUser | null } = useSession();

  useEffect(() => {
    if (pinItem === null || pinItem.save === null || !session) return;

    const alreadySaved: boolean = pinItem.save.some(
      (item: Save): boolean => item.userId === session.id
    );

    if (alreadySaved) {
      setSubmitState({
        style: "bg-red-500",
        text: "已儲存",
        state: "none",
      });
      setIsSaved(true);
    } else {
      setSubmitState({
        style: "bg-red-500",
        text: "儲存",
        state: "none",
      });
      setIsSaved(false);
    }
  }, [pinItem, session]);

  const savePin = async (id: string): Promise<void> => {
    if (pinItem === null || !session) return;

    setSubmitState({
      style: "bg-gray-300",
      text: "處理中",
      state: "uploading",
    });

    await client
      .patch(id)
      .setIfMissing({ save: [] })
      .append("save", [
        {
          _key: uuidv4(),
          userId: session.id,
        },
      ])
      .commit()
      .then(() => {
        setPinItem({
          ...pinItem,
          save: [
            {
              _key: uuidv4(),
              userId: session.id!,
            },
          ],
        });

        setSubmitState({
          style: "bg-red-500",
          text: "已儲存",
          state: "none",
        });

        toast("儲存成功", { type: "success" });
      });
  };

  const unSavePin = async (id: string): Promise<void> => {
    if (
      pinItem === null ||
      !session ||
      !pinItem?.save ||
      pinItem?.save === null
    )
      return;

    setSubmitState({
      style: "bg-gray-300",
      text: "處理中",
      state: "uploading",
    });

    const reviewsToRemove = [`save[userId=="${session.id}"]`];
    await client
      .patch(id)
      .unset(reviewsToRemove)
      .commit()
      .then(() => {
        const newSave = pinItem!.save!.filter((item) => {
          return item.userId !== session.id;
        });

        setPinItem({
          ...pinItem,
          save: newSave,
        });

        setSubmitState({
          style: "bg-red-500",
          text: "儲存",
          state: "none",
        });

        toast("已取消儲存", { type: "success" });
      });
  };

  // const deletePin = async (id: string): Promise<void> => {
  //   await client.delete(id).then(() => {
  //     setPinItem(null);

  //     toast("刪除成功", { type: "success" });
  //   });
  // };

  return (
    <>
      {session && pinItem && (
        <m.div
          className="w-full hover:-translate-y-1 transition-all duration-300 ease-in-out mb-[3rem] sm:mb-[1.8rem]"
          whileInView={{ opacity: [0, 1], y: [100, 0] }}
          transition={{ duration: 0.4, delayChildren: 0.3 }}
          key={pin._id}
        >
          <div
            className="relative flex items-center justify-center w-full h-full shadow-md hover:shadow-xl object-contain"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(): Promise<boolean> =>
              router.push(`/pin-detail/${pinItem._id}`)
            }
          >
            <Image
              className="!relative rounded-lg !w-full "
              src={urlFor(pinItem.image).url()}
              blurDataURL={urlFor(pinItem.image).url()}
              alt="picture"
              placeholder="blur"
              fill
              sizes="100"
              priority
            />

            {isHovered && (
              <div className="absolute flex flex-col justify-between top-0 w-full h-full p-[1rem] transition-all opacity-0 hover:opacity-100 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center justify-center bg-white h-[2.5rem] w-[2.5rem] rounded-full text-black text-[1.2rem] opacity-70 hover:opacity-80">
                    <Link
                      href={`${pinItem?.image?.asset?.url}?dl=`}
                      legacyBehavior
                    >
                      <a
                        download
                        onClick={(
                          e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
                        ) => e.stopPropagation()}
                      >
                        <IoMdCloudDownload />
                      </a>
                    </Link>
                  </div>
                  {session.id !== pinItem.userId && (
                    <>
                      {!isSaved ? (
                        <button
                          className={`${submitState.style} flex items-center justify-center opacity-80 hover:opacity-100 rounded-full text-white py-[0.5rem] px-[1rem] font-bold`}
                          disabled={
                            submitState.state === "uploading" ? true : false
                          }
                          onClick={(
                            e: React.MouseEvent<HTMLButtonElement, MouseEvent>
                          ) => {
                            e.stopPropagation();
                            savePin(pinItem._id);
                          }}
                        >
                          {submitState.text}
                        </button>
                      ) : (
                        <button
                          className={`${submitState.style} flex items-center justify-center opacity-80 hover:opacity-100 rounded-full text-white py-[0.5rem] px-[1rem] font-bold`}
                          disabled={
                            submitState.state === "uploading" ? true : false
                          }
                          onClick={(
                            e: React.MouseEvent<HTMLButtonElement, MouseEvent>
                          ) => {
                            e.stopPropagation();
                            unSavePin(pinItem._id);
                          }}
                        >
                          {submitState.text}
                        </button>
                      )}
                    </>
                  )}
                </div>

                <div className="flex justify-between w-full">
                  <Link
                    href={`/pin-detail/${pinItem._id}`}
                    className="flex items-center justify-start bg-white opacity-70 hover:opacity-80 rounded-full text-black py-[0.5rem] px-[1rem]"
                  >
                    <BsFillArrowUpRightCircleFill className="mr-[0.5rem]" />
                    {pinItem.destination.slice(8, 17)}...
                  </Link>

                  {session.id === pinItem.userId && (
                    <div
                      className="flex items-center justify-center text-[1.2rem] bg-white opacity-70 hover:opacity-80 rounded-full text-black h-[2.5rem] w-[2.5rem]"
                      onClick={(
                        e: React.MouseEvent<HTMLDivElement, MouseEvent>
                      ) => {
                        e.stopPropagation();
                        setIsModalOpen({ toggle: true, id: pin._id });
                      }}
                    >
                      <RiDeleteBin6Fill />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Link href={`/user-profile/${pinItem?.postedBy?._id}`}>
            <div className="flex items-center justify-start gap-[1rem] mt-[0.8rem] h-full w-full cursor-pointer">
              <Image
                className="rounded-full"
                src={pinItem?.postedBy?.image}
                alt="user image"
                width={35}
                height={35}
              />

              <p className="font-semibold sm:text-[0.8rem]">
                {pinItem?.postedBy?.userName}
              </p>
            </div>
          </Link>
        </m.div>
      )}
    </>
  );
};

export default Pin;
