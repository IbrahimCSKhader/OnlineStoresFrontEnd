import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import jwtDecode from "jwt-decode";

function GoogleCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const error = params.get("error");

    if (error) {
      navigate("/login");
      return;
    }

    if (!token) {
      navigate("/login");
      return;
    }

    localStorage.setItem("token", token);

    try {
      const user = jwtDecode(token);

      localStorage.setItem("user", JSON.stringify(user));
    } catch {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
      return;
    }

    navigate("/");
  }, [location, navigate]);

  return <div>جارٍ تسجيل الدخول...</div>;
}

export default GoogleCallbackPage;
