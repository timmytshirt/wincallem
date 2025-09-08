"use client";
import { useEffect, useState } from "react";

export default function ApiHealthBadge() {
  const [status, setStatus] = useState("checking...");

  useEffect(() => {
    fetch("http://localhost:8000/health")
      .then((res) => res.json())
      .then((data) => setStatus(data.status || "ok"))
      .catch(() => setStatus("offline"));
  }, []);

  return (
    <div className="text-xs text-gray-400 mt-4">
      API Health: <span className="font-semibold">{status}</span>
    </div>
  );
}
