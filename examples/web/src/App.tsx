import { useEffect, useState } from "react";
import { tweaker } from "./tweaker";

interface User {
  id: number;
  name: string;
  year: number;
}

function generateUser(): User {
  return tweaker.value("users.generate", {
    id: Math.ceil(Math.random() * 1000),
    name: "Glep",
    year: 2001,
  });
}

export function App() {
  const [user, setUser] = useState(() => generateUser());
  const [tweakerEnabled, setTweakerEnabled] = useState(false);

  useEffect(() => {
    if (tweakerEnabled) {
      return tweaker.intercept(
        "users.generate",
        (): User => {
          return {
            id: 1,
            name: "John",
            year: Math.ceil(Math.random() * 2000),
          };
        },
        {
          count: 5,
          interactive: true,
          once: true,
        },
      );
    }
  }, [tweakerEnabled]);

  return (
    <div>
      <pre>{JSON.stringify(user, null, 2)}</pre>
      <button onClick={() => setUser(generateUser())}>Update User</button>
      <button onClick={() => setTweakerEnabled((v) => !v)}>
        {tweakerEnabled ? "Stop Tweaker" : "Start Tweaker"}
      </button>
    </div>
  );
}
