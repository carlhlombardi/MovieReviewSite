"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "react-bootstrap";
import { useAuth } from "@/app/(auth)/context/AuthContext";

export default function LogoutPage() {
  const router = useRouter();
  const { logout } = useAuth(); // 👈 get logout from context

  useEffect(() => {
    const doLogout = async () => {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });
        logout(); // 👈 immediately clear context
        router.push("/login");
      } catch (err) {
        console.error("Logout error", err);
      }
    };
    doLogout();
  }, [router, logout]);

  return (
    <div className="container mt-5">
      <h2>Logging out...</h2>
      <Spinner animation="border" />
    </div>
  );
}
