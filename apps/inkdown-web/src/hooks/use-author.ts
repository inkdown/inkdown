import { login } from "@/features/author/services/author-service";
import type { LoginData } from "@/features/author/types/user-types";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function useAuth(){
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const navigate = useNavigate();

  const handleAuthorLogin = async (data: LoginData) => {
    setIsLoading(true);

    try{
      await login({ email: data.email, password: data.password });
      setIsLoading(false);

      navigate("/notebook");
    } catch(err) {
      setIsLoading(false);

      console.log(err);
    }
  };

  return {
    login: handleAuthorLogin,
    isLoading,

  }
}