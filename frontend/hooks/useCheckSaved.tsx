import { useEffect, useState } from 'react';
import { PinDetail, PinItem, Save, SessionUser } from '../types';

interface Props {
  session: SessionUser | null;
  pinDetail: PinDetail | PinItem | null;
}

const useCheckSaved = ({ pinDetail, session }: Props) => {
  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    if (pinDetail === null || pinDetail?.save === null || !session) return;

    const alreadySaved: boolean = pinDetail.save.some(
      (item: Save): boolean => item.userId === session.id,
    );

    if (alreadySaved) setIsSaved(true);
    else setIsSaved(false);
  }, [pinDetail, session]);

  return isSaved;
};

export default useCheckSaved;
