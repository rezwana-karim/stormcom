import { DefaultSession } from "next-auth";
import { Role, AccountStatus } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      isSuperAdmin: boolean;
      accountStatus?: AccountStatus;
      organizationRole?: Role;
      organizationId?: string;
      storeRole?: Role;
      storeId?: string;
      permissions: string[];
    };
  }
  interface User {
    id: string;
    isSuperAdmin: boolean;
    accountStatus?: AccountStatus;
    organizationRole?: Role;
    organizationId?: string;
    storeRole?: Role;
    storeId?: string;
  }
}
