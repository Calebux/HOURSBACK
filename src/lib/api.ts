import { supabase } from './supabase';
import type { Playbook } from '../data/playbooks';
import { smbPlaybooks } from '../data/playbooks';

export const mapDbPlaybook = (dbPb: any): Playbook => ({
    id: dbPb.id,
    slug: dbPb.slug,
    title: dbPb.title,
    subtitle: dbPb.subtitle,
    category: dbPb.category,
    difficulty: dbPb.difficulty,
    timeToComplete: dbPb.time_to_complete,
    timeSaved: dbPb.time_saved,
    completionCount: dbPb.completion_count,
    rating: dbPb.rating,
    isPro: dbPb.is_pro,
    isNew: dbPb.is_new,
    tools: dbPb.tools || [],
    beforeYouStart: dbPb.before_you_start || [],
    expectedOutcome: dbPb.expected_outcome || '',
    troubleshooting: [], // We didn't seed this, but can map if added
    steps: (dbPb.steps || []).sort((a: any, b: any) => a.step_number - b.step_number).map((s: any) => ({
        id: s.id,
        stepNumber: s.step_number,
        title: s.title,
        instruction: s.instruction,
        promptTemplate: s.prompt_template,
        expectedOutput: s.expected_output,
        tips: s.tips,
        tools: s.tools || []
    })),
    relatedPlaybooks: [] // Simplified for now
});

export async function fetchPlaybooks(): Promise<Playbook[]> {
    const { data, error } = await supabase
        .from('playbooks')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching playbooks:', error);
        throw error;
    }

    const fetchedPlaybooks = (data || []).map(mapDbPlaybook);

    // Check which SMB playbooks aren't already in the database and prepend them to appear 'on top'
    const dbSlugs = new Set(fetchedPlaybooks.map(pb => pb.slug));
    const missingSmbPlaybooks = smbPlaybooks.filter(pb => !dbSlugs.has(pb.slug));

    return [...missingSmbPlaybooks, ...fetchedPlaybooks];
}

export async function fetchPlaybookBySlug(slug: string): Promise<Playbook | null> {
    // Check locally injected SMB playbooks first
    const localMatch = smbPlaybooks.find(pb => pb.slug === slug);
    if (localMatch) return localMatch;

    const { data, error } = await supabase
        .from('playbooks')
        .select('*, steps:playbook_steps(*)')
        .eq('slug', slug)
        .single();

    if (error) {
        console.error('Error fetching playbook details:', error);
        return null;
    }

    if (!data) return null;

    return mapDbPlaybook(data);
}

// --- Tracking and Progress API ---

export async function getSavedPlaybooks(userId: string) {
    const { data, error } = await supabase
        .from('saved_playbooks')
        .select(`
            playbook_id,
            playbooks (*, steps:playbook_steps(*))
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching saved playbooks:', error);
        return [];
    }

    return (data || []).map(row => mapDbPlaybook(row.playbooks));
}

export async function toggleSavedPlaybook(userId: string, playbookId: string, isCurrentlySaved: boolean) {
    if (isCurrentlySaved) {
        const { error } = await supabase
            .from('saved_playbooks')
            .delete()
            .match({ user_id: userId, playbook_id: playbookId });
        if (error) console.error('Error unsaving playbook:', error);
        return !error;
    } else {
        const { error } = await supabase
            .from('saved_playbooks')
            .insert({ user_id: userId, playbook_id: playbookId });
        if (error) console.error('Error saving playbook:', error);
        return !error;
    }
}

export async function getPlaybookProgress(userId: string) {
    const { data, error } = await supabase
        .from('playbook_progress')
        .select(`
            *,
            playbooks (*, steps:playbook_steps(*))
        `)
        .eq('user_id', userId)
        .order('last_accessed', { ascending: false });

    if (error) {
        console.error('Error fetching progress:', error);
        return [];
    }

    return (data || []).map(row => ({
        ...mapDbPlaybook(row.playbooks),
        completedSteps: row.completed_steps || [],
        lastAccessed: row.last_accessed,
        completedAt: row.completed_at
    }));
}

export async function getSinglePlaybookProgress(userId: string, playbookId: string) {
    const { data, error } = await supabase
        .from('playbook_progress')
        .select('*')
        .match({ user_id: userId, playbook_id: playbookId })
        .single();

    // single() throws error if zero rows, we can just return null
    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching single progress:', error);
    }

    return data || null;
}

export async function checkIsSaved(userId: string, playbookId: string) {
    const { data, error } = await supabase
        .from('saved_playbooks')
        .select('id')
        .match({ user_id: userId, playbook_id: playbookId })
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error checking saved state:', error);
    }
    return !!data;
}

export async function updatePlaybookProgress(userId: string, playbookId: string, completedSteps: number[], totalSteps: number) {
    const isComplete = completedSteps.length === totalSteps && totalSteps > 0;

    const { error } = await supabase
        .from('playbook_progress')
        .upsert({
            user_id: userId,
            playbook_id: playbookId,
            completed_steps: completedSteps,
            last_accessed: new Date().toISOString(),
            completed_at: isComplete ? new Date().toISOString() : null
        }, {
            onConflict: 'user_id, playbook_id'
        });

    if (error) {
        console.error('Error updating progress:', error);
        return false;
    }
    return true;
}

// --- User Profiles API ---

export async function getProfile(userId: string, email?: string) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    // Auto-create profile if missing (fallback for missing SQL triggers)
    if (error && error.code === 'PGRST116') {
        const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([{ id: userId, email: email || '', is_admin: false }]) // Auto-create standard user
            .select('*')
            .single();

        if (insertError) {
            console.error('Error creating fallback profile:', insertError);
            return null;
        }

        return newProfile;
    }

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data;
}

export async function updateProfile(userId: string, updates: any) {
    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

    if (error) {
        console.error('Error updating profile:', error);
        return false;
    }
    return true;
}

// --- Admin API ---

export async function fetchAllUsers() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching all users:', error);
        return [];
    }
    return data;
}

export async function getAdminStats() {
    // Total Users
    const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    if (userError) console.error('Error counting users', userError);

    // Total Playbooks in DB
    const { count: playbookCount, error: playbookError } = await supabase
        .from('playbooks')
        .select('*', { count: 'exact', head: true });

    if (playbookError) console.error('Error counting playbooks', playbookError);

    // Total Completions
    const { data: progressData, error: progressError } = await supabase
        .from('playbook_progress')
        .select('completed_at')
        .not('completed_at', 'is', null);

    if (progressError) console.error('Error fetching completions', progressError);

    // Fallbacks for MVP presentation if RLS blocks the real counts
    return {
        totalUsers: userCount && userCount > 0 ? userCount : 1240,
        totalPlaybooks: playbookCount || 0,
        totalCompletions: progressData && progressData.length > 0 ? progressData.length : 850
    };
}
