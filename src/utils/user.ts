import type { UserSummary } from '../../model/user.model';

export function resolveDisplayName(
    oidOrName: string,
    usersMap: Record<string, UserSummary>
): string {
    const user = usersMap[oidOrName];
    if (!user) return oidOrName;
    if (user.firstName || user.lastName)
        return [user.firstName, user.lastName].filter(Boolean).join(' ');
    return user.username;
}
