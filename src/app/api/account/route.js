import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// DELETE /api/account
//
// Permanently deletes the signed-in user's account: identity is confirmed
// via the request's own cookie-scoped session (never a client-supplied id,
// so this can only ever delete the caller's own account), then the actual
// deletion runs through the service-role admin client — deleting an
// auth.users row requires admin privileges, a regular user-scoped client
// can't do it. profiles and favorites both reference auth.users(id) with
// "on delete cascade" (see supabase/schema.sql), so deleting the auth user
// removes those rows too without any separate cleanup queries.
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json(
      { error: "You must be signed in to delete your account." },
      { status: 401 },
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  await supabase.auth.signOut();

  return Response.json({ ok: true });
}
