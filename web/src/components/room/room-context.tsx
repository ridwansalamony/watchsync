"use client";
import { createContext, useContext } from "react";
export const RoomContext = createContext<string>("");
export function useRoomCode() {
  return useContext(RoomContext);
}
