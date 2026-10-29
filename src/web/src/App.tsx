import { useEffect, useState } from "react";

type HealthResponse = {
  status: string;
};

export default function App() {
  const [status, setStatus] = useState("Checking...");

  useEffect(() => {
    async function checkHealth() {
      try {
        const response = await fetch("/api/health");

        if (!response.ok) {
          throw new Error("API request failed");
        }

        const data: HealthResponse = await response.json();

        setStatus(data.status);
      } catch (error) {
        console.error(error);
        setStatus("API unavailable");
      }
    }

    checkHealth();
  }, []);

  return (
    <main>
      <h1>Heisenberg Logistics</h1>
      <p>Backend status: {status}</p>
    </main>
  );
}