import { Permissions, webMethod } from "@wix/web-methods";
import { loginClubMemberCore } from "backend/SKANDI_CORE/clubLogin";

export const loginClubMember = webMethod(Permissions.Anyone, loginClubMemberCore);
