import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const update = {};
    if (typeof body.display_name === 'string' && body.display_name.trim()) {
      update.display_name = body.display_name.trim().slice(0, 40);
    }
    if (typeof body.country === 'string') {
      update.country = body.country.trim().slice(0, 40);
    }
    if (typeof body.avatar_url === 'string') {
      update.avatar_url = body.avatar_url.trim();
    }

    if (Object.keys(update).length === 0) {
      return Response.json({ error: 'Nothing to update' }, { status: 400 });
    }

    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_id: user.id }, { limit: 1 });
    const profile = profiles.items && profiles.items[0];
    if (!profile) return Response.json({ error: 'Profile not found' }, { status: 404 });

    const updated = await base44.asServiceRole.entities.UserProfile.update(profile.id, update);
    return Response.json({ success: true, profile: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}