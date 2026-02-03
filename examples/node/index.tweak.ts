import { User } from "./index";
import { prepareTweakerSamples } from "./tweaker";

export const findUserSamples = prepareTweakerSamples<User | undefined>([
  {
    id: "john",
    value: {
      id: 1,
      name: "John",
      year: 2000,
    },
  },
  {
    id: "not-found-error",
    value: undefined,
    throw: new Error("User not found!"),
  },
]);
