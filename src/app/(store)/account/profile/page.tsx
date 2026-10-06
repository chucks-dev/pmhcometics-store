import { ProfileForm } from "@/components/store/ProfileForm";
import { requireUser } from "@/server/auth/guards";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const u = await requireUser();
  return <><h1 className="mb-6 text-3xl">Profile</h1><ProfileForm fullName={u.full_name} phone={u.phone ?? ""} email={u.email} /></>;
}
