'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadarChart } from '@/components/RadarChart'
import { AssessmentForm } from '@/components/AssessmentForm'
import { toast } from 'sonner'
import { getWeightForRole, prepareRadarData, type Role, type WeightedAssessment } from '@/lib/scoring'
import type { Profile, User, AssessmentInput } from '@/types/database'

interface ProfilePageProps {
    params: Promise<{ id: string }>
}

export default function ProfilePage({ params }: ProfilePageProps) {
    const { id } = use(params)
    const [profile, setProfile] = useState<Profile | null>(null)
    const [user, setUser] = useState<User | null>(null)
    const [assessments, setAssessments] = useState<WeightedAssessment[]>([])
    const [hasEvaluated, setHasEvaluated] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [seniorOnly, setSeniorOnly] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function loadData() {
            // Get auth user
            const { data: { user: authUser } } = await supabase.auth.getUser()

            if (!authUser) {
                router.push('/')
                return
            }

            // Get user profile
            const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('auth_id', authUser.id)
                .single()

            setUser(userData)

            // Get profile
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single()

            if (!profileData) {
                router.push('/dashboard')
                return
            }

            setProfile(profileData)

            // Get assessments (for radar chart - anonymized)
            const { data: assessmentsData } = await supabase
                .from('assessments')
                .select('comm_score, resilience_score, collab_score, ownership_score, commitment_score, pragmatism_score, weight_applied')
                .eq('target_profile_id', id)

            setAssessments(assessmentsData || [])

            // Check if user has already evaluated
            if (userData) {
                const { data: userAssessment } = await supabase
                    .from('assessments')
                    .select('id')
                    .eq('evaluator_id', userData.id)
                    .eq('target_profile_id', id)
                    .single()

                setHasEvaluated(!!userAssessment)
            }

            setIsLoading(false)
        }

        loadData()
    }, [id, supabase, router])

    const handleSubmitAssessment = async (scores: Omit<AssessmentInput, 'target_profile_id'>) => {
        if (!user || !profile) return
        setIsSubmitting(true)

        try {
            const weight = getWeightForRole(user.role as Role)

            const { error } = await supabase
                .from('assessments')
                .insert({
                    evaluator_id: user.id,
                    target_profile_id: profile.id,
                    ...scores,
                    weight_applied: weight,
                })

            if (error) {
                if (error.code === '23505') {
                    toast.error('Você já avaliou este perfil')
                } else {
                    toast.error('Erro ao salvar avaliação')
                }
                return
            }

            toast.success('Avaliação enviada com sucesso!')
            setHasEvaluated(true)
            setShowForm(false)

            // Reload data
            router.refresh()
            window.location.reload()
        } catch {
            toast.error('Erro ao enviar avaliação')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading || !profile) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-zinc-400">Carregando...</div>
            </main>
        )
    }

    const initials = profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

    const radarData = prepareRadarData(assessments, seniorOnly)

    return (
        <main className="min-h-screen px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/dashboard')}
                        className="text-zinc-400 hover:text-zinc-100"
                    >
                        ← Voltar
                    </Button>
                </header>

                {/* Profile Header */}
                <Card className="bg-zinc-900 border-zinc-800 mb-8">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-6">
                            <Avatar className="h-24 w-24 border-2 border-violet-500">
                                <AvatarImage src={profile.avatar_url || undefined} />
                                <AvatarFallback className="bg-zinc-800 text-zinc-300 text-2xl">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <h1 className="text-2xl font-bold text-zinc-100">{profile.full_name}</h1>
                                <a
                                    href={profile.linkedin_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-violet-400 hover:text-violet-300 text-sm"
                                >
                                    {profile.linkedin_url}
                                </a>
                                <div className="flex gap-2 mt-3">
                                    <Badge className="bg-violet-600 text-white">
                                        Score: {profile.average_score.toFixed(2)}
                                    </Badge>
                                    <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                                        {profile.total_assessments} avaliações
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Radar Chart */}
                {assessments.length > 0 && (
                    <Card className="bg-zinc-900 border-zinc-800 mb-8">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-zinc-100">Competências</CardTitle>
                                <div className="flex gap-2">
                                    <Button
                                        variant={seniorOnly ? 'outline' : 'default'}
                                        size="sm"
                                        onClick={() => setSeniorOnly(false)}
                                        className={seniorOnly ? 'border-zinc-700 text-zinc-400' : 'bg-violet-600'}
                                    >
                                        Geral
                                    </Button>
                                    <Button
                                        variant={seniorOnly ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setSeniorOnly(true)}
                                        className={seniorOnly ? 'bg-violet-600' : 'border-zinc-700 text-zinc-400'}
                                    >
                                        Seniors/Leads
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <RadarChart data={radarData} />
                        </CardContent>
                    </Card>
                )}

                {/* Assessment Section */}
                {!hasEvaluated ? (
                    showForm ? (
                        <AssessmentForm
                            profileName={profile.full_name}
                            onSubmit={handleSubmitAssessment}
                            isLoading={isSubmitting}
                        />
                    ) : (
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardContent className="py-8 text-center">
                                <p className="text-zinc-400 mb-4">
                                    Você ainda não avaliou este profissional
                                </p>
                                <Button
                                    onClick={() => setShowForm(true)}
                                    className="bg-violet-600 hover:bg-violet-700"
                                >
                                    Fazer Avaliação
                                </Button>
                            </CardContent>
                        </Card>
                    )
                ) : (
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardContent className="py-8 text-center">
                            <div className="text-4xl mb-4">✅</div>
                            <p className="text-zinc-300 font-medium">
                                Você já avaliou este profissional
                            </p>
                            <p className="text-zinc-500 text-sm mt-2">
                                Sua avaliação é anônima e já foi contabilizada
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    )
}
