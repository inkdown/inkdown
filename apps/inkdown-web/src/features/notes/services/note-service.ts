import { api } from "@/lib/api";
import type { AxiosError } from "axios";
import { type GetNoteContentResponse } from "../types/note-types";
import Cookies from "js-cookie";

export async function updateNoteData(id: string, title: string, content: string) {
  console.log(id, title, content);

  const response = await api.put("notes/update", {
    id,
    title,
    content,
  }, {
    withCredentials: true,
  });

  console.log(response);
}

export async function getNoteContent(noteId: string) {

  const response = await api.get<GetNoteContentResponse>(`notes/note?noteId=${noteId}`, {
    withCredentials: true,
  });
  console.log(response);

  const { note } = response.data;

  return note === undefined ? null : note;
}

