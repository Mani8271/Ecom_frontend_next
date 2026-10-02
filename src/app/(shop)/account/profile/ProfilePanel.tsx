"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import { useAuth } from "@/features/auth/AuthProvider";
import { AvatarUploader } from "@/features/account/components/AvatarUploader";
import { ProfileForm } from "@/features/account/components/ProfileForm";

export function ProfilePanel() {
  const { user } = useAuth();
  if (!user) return null; // RequireAuth renders this only when signed in

  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <AvatarUploader user={user} />
        <Divider sx={{ my: 3 }} />
        <ProfileForm key={user.id} user={user} />
      </CardContent>
    </Card>
  );
}
