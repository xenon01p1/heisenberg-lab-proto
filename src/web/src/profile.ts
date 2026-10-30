import type { PublicUser } from "@heisenberg/contracts";

export type ProfileField = {
  id: "email" | "createdAt";
  label: string;
  value: string;
};

export function getProfileFields(user: PublicUser): ProfileField[] {
  return [
    {
      id: "email",
      label: "Email",
      value: user.email,
    },
    {
      id: "createdAt",
      label: "Account created",
      value: new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(user.createdAt)),
    },
  ];
}
