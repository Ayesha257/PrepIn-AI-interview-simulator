import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    const token = searchParams.get("token");
    fetch(`${import.meta.env.VITE_API_URL}/verify-email?token=${token}`)
      .then(res => res.json())
      .then(data => setStatus(data.message))
      .catch(() => setStatus("Verification failed"));
  }, [searchParams]);

  return <div className="text-center p-10">{status}</div>;
}