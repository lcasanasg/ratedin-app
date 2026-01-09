'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Profile } from '@/types/database'

interface ProfileCardProps {
    profile: Profile
    onClick?: () => void
}

export function ProfileCard({ profile, onClick }: ProfileCardProps) {
    const initials = profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

    const scoreColor =
        profile.average_score >= 4 ? 'bg-emerald-500' :
            profile.average_score >= 3 ? 'bg-amber-500' :
                profile.average_score >= 2 ? 'bg-orange-500' : 'bg-red-500'

    return (
        <Card
            className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
            onClick={onClick}
        >
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar className="h-16 w-16 border-2 border-zinc-700">
                    <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                    <AvatarFallback className="bg-zinc-800 text-zinc-300 text-lg">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-zinc-100">
                        {profile.full_name}
                    </h3>
                    <p className="text-sm text-zinc-500 truncate max-w-[200px]">
                        {profile.linkedin_url.replace('https://www.linkedin.com/in/', '')}
                    </p>
                </div>
                <div className="flex flex-col items-center">
                    <div className={`text-2xl font-bold text-white px-3 py-1 rounded-lg ${scoreColor}`}>
                        {profile.average_score.toFixed(1)}
                    </div>
                    <span className="text-xs text-zinc-500 mt-1">
                        {profile.total_assessments} {profile.total_assessments === 1 ? 'avaliação' : 'avaliações'}
                    </span>
                </div>
            </CardHeader>
            <CardContent>
                <Badge variant="outline" className="text-zinc-400 border-zinc-700">
                    Ver detalhes →
                </Badge>
            </CardContent>
        </Card>
    )
}
