import Cookies from "js-cookie";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AuthPage() {
  const [search] = useSearchParams();
  const router = useNavigate();

  useEffect(() => {

    const token = search.get("token");

    if (!token) {
      return;
    };

    Cookies.set("inkdown-auth", token);

    router("/notebook");
  }, [search])

  return (
    <div>
      <p>
        Carregando...
      </p>
    </div>
  )
}