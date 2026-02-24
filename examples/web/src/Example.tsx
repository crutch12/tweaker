import { useEffect, useMemo, useState, Component, ComponentType } from "react";
import { tweaker } from "./tweaker";
import type { Tweaker } from "@tweaker/core";

export interface User {
  id: number;
  name: string;
  year: number;
}

function generateUser(): User {
  return tweaker.value<User>(
    "users.generate",
    {
      id: Math.ceil(Math.random() * 1000),
      name: "Glep 🥸",
      year: 2001,
    },
    {
      samples: [
        {
          id: "john",
          value() {
            return {
              id: 1,
              name: "John 🧔",
              year: 2000,
            };
          },
        },
        {
          id: "sam",
          value() {
            return {
              id: 2,
              name: "Sam 🙎",
              year: 3000,
            };
          },
        },
        {
          id: "not-found-error",
          value() {
            throw new Error("User not found! 💀");
          },
        },
      ],
    },
  );
}

export interface Dog {
  id: number;
  name: string;
  type: "male" | "female";
}

function generateDog(): Dog {
  return tweaker.value<Dog>(
    "dogs.generate",
    {
      id: Math.ceil(Math.random() * 1000),
      name: "Barkley 🐶",
      type: "male",
    },
    {
      samples: [
        {
          id: "luna",
          value() {
            return {
              id: 1,
              name: "Luna 🐩",
              type: "female",
            };
          },
        },
        {
          id: "not-found-error",
          value() {
            throw new Error("Dog not found! ⚰️");
          },
        },
      ],
    },
  );
}

function getReplacedDog(dog: Dog): Dog {
  const newDog: Dog = {
    ...dog,
    type: dog.type === "male" ? "female" : "male",
  };
  return tweaker.value<Dog>(`dogs.replace.${dog.id}`, newDog);
}

function _Example() {
  const [entities, setEntities] = useState<Array<User | Dog>>(() => [
    generateUser(),
    generateDog(),
  ]);
  const [tweakerEnabled, setTweakerEnabled] = useState(false);

  const lastDog = useMemo(() => {
    return entities.reverse().find((x) => "type" in x);
  }, [entities]);

  useEffect(() => {
    if (tweakerEnabled) {
      return tweaker.intercept(
        "users.generate",
        (key, value): User => {
          return {
            ...value,
            name: value.name + " (tweaked)",
            year: Math.ceil(Math.random() * 2000),
          };
        },
        {
          interactive: false,
        },
      );
    }
  }, [tweakerEnabled]);

  useEffect(() => {
    if (tweakerEnabled) {
      return tweaker.intercept(
        `dogs.generate`,
        (key, value): Dog => {
          return {
            ...value,
            name: value.name + " (tweaked)",
            type: Math.random() > 0.5 ? "male" : "female",
          };
        },
        {
          interactive: false,
        },
      );
    }
  }, [tweakerEnabled]);

  useEffect(() => {
    if (tweakerEnabled) {
      return tweaker.intercept(
        `dogs.replace.*`,
        (key, value): Dog => {
          return {
            ...value,
            name: value.name.includes("tweaked")
              ? value.name
              : value.name + " (tweaked)",
          };
        },
        {
          interactive: false,
        },
      );
    }
  }, [tweakerEnabled]);

  useEffect(() => {
    return tweaker.subscribe("*", ({ key, tweaked, originalValue, result }) => {
      console.log(originalValue);
    });
  }, []);

  const [extensionIsLoaded, setExtensionsIsLoaded] = useState(false);

  useEffect(() => {
    tweaker.ready().then((success) => {
      setExtensionsIsLoaded(success);
    });
  }, []);

  return (
    <div>
      <h3>Extension loaded: {JSON.stringify(extensionIsLoaded)}</h3>
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          style={{
            backgroundColor: tweakerEnabled ? "#FFB18A" : "#CAFF8A",
          }}
          onClick={() => setTweakerEnabled((v) => !v)}
        >
          {tweakerEnabled ? "Stop Tweaker" : "Start Tweaker"}
        </button>
        <button
          onClick={() => {
            const user = generateUser();
            setEntities((v) => {
              return [...v, user];
            });
          }}
        >
          Add User
        </button>
        <button
          onClick={() => {
            const dog = generateDog();
            setEntities((v) => {
              return [...v, dog];
            });
          }}
        >
          Add Dog
        </button>
        {lastDog && (
          <button
            onClick={() => {
              const dog = getReplacedDog(lastDog);
              setEntities((v) => {
                return v.map((x) => (x.id !== lastDog.id ? x : dog));
              });
            }}
          >
            Replace Last Dog ({lastDog.id})
          </button>
        )}
      </div>
      <pre>{JSON.stringify(entities, null, 2)}</pre>
    </div>
  );
}

function withTweakerReady<P extends {}>(
  tweaker: Tweaker,
  WrappedComponent: ComponentType<P>,
) {
  return function ComponentWithTweakerReady(props: P) {
    const [isReady, setIsReady] = useState(() => tweaker.isReady);

    useEffect(() => {
      let start = Date.now();
      tweaker
        .ready()
        .then((success) => {
          console.log(
            `tweaker is ready with status: ${success}, spent time:`,
            Date.now() - start,
          );
        })
        .catch((err) => {
          console.error("tweaker ready error", err, Date.now() - start);
        })
        .finally(() => {
          setIsReady(true);
        });
    }, []);

    if (!isReady) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}

export const Example = withTweakerReady(tweaker, _Example);
