import { supabase } from '@/lib/supabase';

export type EntityType = 'champion' | 'item' | 'augment';

export async function getFavorites(userId: string, entityType: EntityType) {
  const { data, error } = await supabase
    .from('favorites')
    .select('entity_id')
    .eq('user_id', userId)
    .eq('entity_type', entityType);
  if (error) throw error;
  return (data ?? []).map((r) => r.entity_id as string);
}

export async function addFavorite(userId: string, entityType: EntityType, entityId: string) {
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, entity_type: entityType, entity_id: entityId });
  if (error) throw error;
}

export async function removeFavorite(userId: string, entityType: EntityType, entityId: string) {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .eq('entity_id', entityId);
  if (error) throw error;
}
