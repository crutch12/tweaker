import { useEffect, useState } from "react";
import { tweaker } from "./tweaker";

interface User {
  id: number;
  name: string;
  year: number;
}

function generateUser(): User {
  return tweaker.value<User>(
    "users.generate",
    {
      id: Math.ceil(Math.random() * 1000),
      name: "Glep",
      year: 2001,
    },
    {
      samples: [
        {
          id: "john",
          value() {
            return {
              id: 1,
              name: "John",
              year: 2000,
            };
          },
        },
        {
          id: "sam",
          value() {
            return {
              id: 2,
              name: "Sam",
              year: 3000,
            };
          },
        },
        {
          id: "not-found-error",
          value() {
            throw new Error("User not found!");
          },
        },
      ],
    },
  );
}

export function App() {
  const [users, setUsers] = useState(() => [generateUser()]);
  const [tweakerEnabled, setTweakerEnabled] = useState(false);

  useEffect(() => {
    if (tweakerEnabled) {
      return tweaker.intercept(
        "users.gen*",
        (key, value): User => {
          return {
            ...value,
            name: value.name + " (tweaked)",
            year: Math.ceil(Math.random() * 2000),
          };
        },
        {
          count: 0,
          interactive: false,
          once: false,
        },
      );
    }
  }, [tweakerEnabled]);

  useEffect(() => {
    return tweaker.subscribe("*", (key, tweaked, value, result) => {
      console.log(value);
    });
  }, []);

  useEffect(() => {
    tweaker.ready().then(() => {
      // debugger;
    });
  }, []);

  return (
    <div>
      <button
        style={{
          marginRight: "10px",
          backgroundColor: tweakerEnabled ? "#FFB18A" : "#CAFF8A",
        }}
        onClick={() => setTweakerEnabled((v) => !v)}
      >
        {tweakerEnabled ? "Stop Tweaker" : "Start Tweaker"}
      </button>
      <button
        onClick={() => {
          const user = generateUser();
          setUsers((v) => {
            return [...v, user];
          });
        }}
      >
        Add User
      </button>
      <pre>{JSON.stringify(users, null, 2)}</pre>
    </div>
  );
}
