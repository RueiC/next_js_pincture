import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { FaCloudUploadAlt } from "react-icons/fa";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import { GetServerSideProps, NextPage } from "next";
import { getSession } from "next-auth/react";
import { Session } from "next-auth/core/types";
import { SanityImageAssetDocument } from "@sanity/client";
import { SessionUser, FileUploadMessage, SubmitState } from "../types";
import { schema } from "../utils/schema";
import { categories } from "../utils/data";
import { client } from "../utils/client";
import { Redirect } from "../types";
import Images from "../assets/index";

interface ServerSideProps {
  props: { session: Session };
}

interface Props {
  session: SessionUser;
}

type FormValues = {
  title: string;
  about: string;
  destination: string;
  category: string;
};

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

const CreatePin: NextPage<Props> = ({ session }) => {
  const [sanityImage, setSanityImage] =
    useState<SanityImageAssetDocument | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [fileUploadMessage, setFileUploadMessage] = useState<FileUploadMessage>(
    { style: "text-black", message: "點擊上傳" }
  );
  const [submitState, setSubmitState] = useState<SubmitState>({
    style: "bg-red-500",
    text: "儲存",
    state: "none",
  });
  const router = useRouter();

  useEffect(() => {
    if (!sanityImage || !imageFile) return;

    // create the preview
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);

    // free memory when ever this component is unmounted
    return () => URL.revokeObjectURL(objectUrl);
  }, [sanityImage, imageFile]);

  const uploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    if (!e.target.files) return;
    setFileUploadMessage((prevVal) => {
      return {
        style: prevVal.style,
        message: "上傳中...",
      };
    });

    const selectedFile: File = e.target.files[0];
    setImageFile(e.target.files[0]);
    // uploading asset to sanity
    if (
      selectedFile.type === "image/png" ||
      selectedFile.type === "image/svg" ||
      selectedFile.type === "image/jpeg" ||
      selectedFile.type === "image/gif" ||
      selectedFile.type === "image/tiff"
    ) {
      await client.assets
        .upload("image", selectedFile, {
          contentType: selectedFile.type,
          filename: selectedFile.name,
        })
        .then((document): void => {
          setFileUploadMessage({
            style: "text-green-500 text-medium",
            message: document.originalFilename as string,
          });
          setSanityImage(document);
        })
        .catch((error): void => {
          console.log("上傳失敗:", error.message);
        });
    } else {
      toast("圖片格式錯誤", { type: "error" });
    }
  };

  const onSubmit = async (
    values: FormValues,
    actions: { resetForm: () => void }
  ): Promise<void> => {
    if (!sanityImage) {
      toast("未上傳圖片", { type: "error" });
      setFileUploadMessage({
        style: "text-red-400 text-medium",
        message: "未上傳圖片",
      });
      return;
    }

    if (
      !values.title ||
      !values.about ||
      !values.destination ||
      !values.category
    )
      return;

    setSubmitState({
      style: "bg-gray-300",
      text: "上傳中",
      state: "uploading",
    });

    const doc = {
      _type: "pin",
      title: values.title,
      about: values.about,
      destination: values.destination,
      image: {
        _type: "image",
        asset: {
          _type: "reference",
          _ref: sanityImage?._id,
        },
      },
      userId: session.id,
      postedBy: {
        _type: "postedBy",
        _ref: session.id,
      },
      category: values.category,
    };

    await client.create(doc).then((): void => {
      toast("上傳成功!", { type: "success" });
      setSubmitState({
        style: "bg-red-500",
        text: "儲存",
        state: "success",
      });

      setImageFile(null);
      setImageFile(null);
      setImagePreview("");
      actions.resetForm();

      window.setTimeout(() => {
        router.push("/");
      }, 2000);
    });
  };

  const formikConfig = {
    initialValues: {
      title: "",
      about: "",
      destination: "",
      category: "",
    },
    validationSchema: schema,
    onSubmit,
  };

  const { values, errors, touched, handleChange, handleBlur, handleSubmit } =
    useFormik(formikConfig);

  return (
    <div className="flex items-start justify-center w-full h-full sm:px-[6rem] sm:py-[3rem]">
      <div className="bg-white sm:rounded-[1rem] w-full h-full sm:shadow-xl">
        <form
          className="flex flex-col sm:flex-row items-center justify-center gap-[2.5rem] px-[2.5rem] py-[2.5rem] w-full h-full"
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <div
            className={`relative bg-gray-100 flex flex-col items-center justify-center ${
              !sanityImage && "w-full sm:w-[70%] h-[10rem] sm:h-[55vh]"
            } rounded-[1rem]`}
          >
            {sanityImage ? (
              <img
                className="rounded-[1rem] shadow-md"
                src={imagePreview}
                alt="uploaded image"
              />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="flex flex-col justify-center items-center">
                  <p className="font-bold text-[1.5rem]">
                    <FaCloudUploadAlt />
                  </p>
                  <p className={`text-[1rem] ${fileUploadMessage.style}`}>
                    {fileUploadMessage.message}
                  </p>
                </div>
              </div>
            )}

            <input
              className="absolute top-0 left-0 w-full h-full cursor-pointer opacity-0"
              type="file"
              name="upload-image"
              autoComplete="off"
              onChange={uploadImage}
            />
          </div>

          <div className="flex flex-col justify-between w-full h-full gap-[2.5rem]">
            <div>
              <input
                className="outline-none text-[1.2rem] font-bold border-gray-200 py-[0.5rem] sm:py-0 border-b-2 sm:border-none"
                id="title"
                type="text"
                placeholder="新增標題"
                autoComplete="off"
                value={values.title}
                onBlur={handleBlur}
                onChange={handleChange}
              />
              <p className="text-red-400 text-[0.5rem] font-medium">
                {errors.title && touched?.title ? errors.title : ""}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-[1rem] mb-[1.5rem]">
                <Image
                  className="rounded-full"
                  src={!session ? Images.userImage : session!.user!.image!}
                  alt="user image"
                  width={35}
                  height={35}
                />
                <p className="font-medium text-text-1">{session!.user!.name}</p>
              </div>

              <div className="flex flex-col gap-[1.5rem]">
                <div>
                  <input
                    className="outline-none text-base border-gray-200 py-[0.5rem] sm:py-0 border-b-2 sm:border-none"
                    id="about"
                    type="text"
                    placeholder="關於你的Pin"
                    autoComplete="off"
                    value={values.about}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  />
                  <p className="text-red-400 text-[0.5rem] font-medium">
                    {errors.about && touched?.about ? errors.about : ""}
                  </p>
                </div>
                <div>
                  <input
                    className="outline-none text-base border-gray-200 py-[0.5rem] sm:py-0 border-b-2 sm:border-none"
                    id="destination"
                    type="text"
                    placeholder="新增連結"
                    autoComplete="off"
                    value={values.destination}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  />
                  <p className="text-red-400 text-[0.5rem] font-medium">
                    {errors.destination && touched?.destination
                      ? errors.destination
                      : ""}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-[1.2rem] text-text-1 font-medium">選擇Pin類型</p>

              <div>
                <select
                  className="outline-none w-[10rem] text-base border-gray-200 px-[1rem] py-[0.5rem] rounded-[0.5rem] cursor-pointer shadow-md text-text-1"
                  id="category"
                  value={values.category}
                  onBlur={handleBlur}
                  onChange={handleChange}
                >
                  <option className="bg-white" value="">
                    選擇類型
                  </option>
                  {categories.map((item) => (
                    <option
                      className="text-base border-0 outline-none capitalize bg-white text-black"
                      value={item.name}
                      key={item.name}
                    >
                      {item.name}
                    </option>
                  ))}
                </select>
                <p className="text-red-400 text-[0.5rem] font-medium mt-[1rem]">
                  {errors.category && touched?.category ? errors.category : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-start hover:-translate-y-1 transition-all duration-300 ease-in-out">
              <button
                className={`${submitState.style} px-[1.2rem] py-[0.5rem] rounded-[0.5rem] text-white`}
                type="submit"
                disabled={submitState.state === "uploading" ? true : false}
              >
                {submitState.text}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePin;
