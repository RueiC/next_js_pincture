import create from "zustand";
import { persist } from "zustand/middleware";

const store = (set: any) => ({
  isLoading: false,

  toggleIsLoading: (toggle: boolean): void => set({ isLoading: toggle }),
});

const useStore = create(
  persist(store, {
    name: "store",
  })
);

export default useStore;
