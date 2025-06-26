import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthorData } from "../services/author-service";
import { changeUserSetting } from "@/features/settings/services/settings-service";
import type { AxiosError } from "axios";

export function useAuthorDataQuery() {
  const { data } = useQuery({
    queryKey: ["get-author-data"],
    queryFn: getAuthorData,
  });

  console.log(data);

}

export function useChangeUserSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changeUserSetting,
    onSuccess: (updatedSettings) => {
      queryClient.setQueryData(["get-author-data"], (oldData: any) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          settings: {
            ...oldData.settings,
            ...updatedSettings,
          },
        };
      });
    },
    onError: (err: AxiosError) => {
      console.error("Erro ao atualizar configurações:", err.response?.data);
    },
  });
}
