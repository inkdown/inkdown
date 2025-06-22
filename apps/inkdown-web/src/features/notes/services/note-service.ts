import { api } from "@/lib/api";
import type { AxiosError } from "axios";
import { type CreateNoteRequest, type GetNoteContentResponse, type NoteDataType } from "../types/note-types";
import Cookies from "js-cookie";

export async function createNote(data: CreateNoteRequest) {
  try {
    const token = Cookies.get("inkdown-auth");

    const response = await api.post<{ note: NoteDataType }>("/notes/create", {
      title: data.title,
      dirId: data.dirId
    }, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    return response.data.note;
  } catch (err) {
    const axiosError = err as AxiosError;

    console.log(axiosError);

    throw new Error(axiosError.response?.data as string);
  }
}

export async function updateNoteData(id: string, title: string, content: string) {
  const token = Cookies.get("inkdown-auth");

  const response = await api.put("notes/update", {
    id,
    title,
    content,
  }, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  console.log(response);
}

export async function getNoteContent(noteId: string) {
  const token = Cookies.get("inkdown-auth");

  const response = await api.get<GetNoteContentResponse>(`notes/note?noteId=${noteId}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  console.log(response);

  const { note } = response.data;

  return note === undefined ? null : note;
}

export async function deleteNote(noteId: string) {
  try {
    const token = Cookies.get("inkdown-auth");

    await api.delete(`/notes/delete?id=${noteId}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
  } catch (err) {
    const axiosError = err as AxiosError;

    console.log(axiosError);

    throw new Error(axiosError.response?.data as string);
  }
}
