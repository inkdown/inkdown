import { api } from "@/lib/api";
import type { AxiosError } from "axios";
import Cookies from "js-cookie";
import type { CreateDirectoryRequest, CreateDirectoryResponse, DirectoryWithChildren, GetAuthorDirectoriesResponse } from "../types/directory-types";

export const findDirectory = (
  directories: DirectoryWithChildren[],
  targetId: number
): DirectoryWithChildren | null => {
  for (const dir of directories) {
    if (dir.id === targetId) return dir;
    const found = findDirectory(dir.childrens, targetId);
    if (found) return found;
  }
  return null;
};

export async function getAuthorDirectoriesWithChildrenNotes() {
  try {
    const token = Cookies.get("inkdown-auth");

    const response = await api.get<GetAuthorDirectoriesResponse>("directories/author", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });


    const { directories, notes } = response.data;

    return {
      directories: directories ?? [],
      notes: notes ?? [],
    };
  } catch (err) {
    const axiosError = err as AxiosError;

    console.log(axiosError);

    throw new Error(axiosError.status ? String(axiosError.status) : "500");
  }
}

export async function renameDirectory(newName: string, id: number) {
  try {
    const token = Cookies.get("inkdown-auth");

    const response = await api.put("directories/rename", {
      directoryId: id,
      newTitle: newName,
    }, {
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

export async function createDirectory(data: CreateDirectoryRequest) {
  try {
    const cookie = Cookies.get("inkdown-auth");

    const response = await api.post<CreateDirectoryResponse>("/directories/create", {
      title: data.title,
      parentId: data.parentId
    }, {
      headers: {
        "Authorization": `Bearer ${cookie}`
      }
    });

    console.log(response);

    return response.data;
  } catch (err) {
    const axiosError = err as AxiosError;

    console.log(axiosError);

    throw new Error(axiosError.response?.data as string);
  }
}

export async function deleteDirectory(id: number) {
  try {
    const token = Cookies.get("inkdown-auth");

    await api.delete(`/directories/delete/${id}`, {
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

export function updateDirectoryTitle(dirs: DirectoryWithChildren[], id: number, newName: string): DirectoryWithChildren[] {
  return dirs.map(dir => {
    if (dir.id === id) {
      return { ...dir, title: newName };
    }
    if (dir.childrens && dir.childrens.length > 0) {
      return { ...dir, childrens: updateDirectoryTitle(dir.childrens, id, newName) };
    }
    return dir;
  });
}