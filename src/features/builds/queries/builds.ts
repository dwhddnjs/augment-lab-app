import { supabase } from '@/lib/supabase';

export interface Build {
  id: string;
  userId: string;
  name: string;
  championId: string;
  itemIds: string[];
  augmentIds: string[];
  createdAt: string;
}

export async function getBuilds(userId: string): Promise<Build[]> {
  const { data, error } = await supabase
    .from('builds')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    userId: r.user_id,
    name: r.name,
    championId: r.champion_id,
    itemIds: r.item_ids,
    augmentIds: r.augment_ids,
    createdAt: r.created_at,
  }));
}

export async function createBuild(
  userId: string,
  build: { name: string; championId: string; itemIds: string[]; augmentIds: string[] }
): Promise<string> {
  const { data, error } = await supabase
    .from('builds')
    .insert({
      user_id: userId,
      name: build.name,
      champion_id: build.championId,
      item_ids: build.itemIds,
      augment_ids: build.augmentIds,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function deleteBuild(id: string) {
  const { error } = await supabase.from('builds').delete().eq('id', id);
  if (error) throw error;
}
