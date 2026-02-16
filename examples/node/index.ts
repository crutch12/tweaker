import { findUserSamples } from "./index.tweak";
import { tweaker } from "./tweaker";

export interface User {
  id: number;
  name: string;
  year: number;
}

const users: User[] = [];

async function createUser() {
  const newUser: User = tweaker.value("users.create", {
    id: Math.ceil(Math.random() * 10000),
    name: "User",
    year: 1996,
  });
  users.push(newUser);
  return newUser;
}

function getLastUser(): User | undefined {
  const foundUser = users[users.length - 1];
  return tweaker.value("users.last", foundUser);
}

function findUser(userId: number): User | undefined {
  const foundUser = users.find((u) => u.id === userId);
  return tweaker.value(`users.find.${userId}`, foundUser, {
    samples: findUserSamples,
  });
}

function setupTweaker() {
  tweaker.intercept(
    "users.create",
    (key) => {
      return {
        id: 42,
        name: "Mocked",
        year: 1489,
      } as User;
    },
    {
      interactive: true,
    },
  );
  tweaker.intercept(
    "users.find.*",
    (key) => {
      return users[0];
    },
    {
      interactive: false,
    },
  );
}

function setupTweakerFailure() {
  tweaker.intercept(
    "users.find.*",
    (key) => {
      throw new Error("No user found!");
    },
    {
      interactive: false,
    },
  );
}

async function runUserLogic() {
  const createdUser = await createUser();
  console.log({ createdUser });
  const lastUser = getLastUser();
  console.log({ lastUser });
  const foundUser = findUser(createdUser.id);
  console.log({ foundUser });
}

async function run() {
  await runUserLogic();

  setupTweaker();
  await runUserLogic();

  tweaker.reset();
  setupTweakerFailure();
  await runUserLogic();
}

run();
