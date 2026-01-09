'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileCard } from '@/components/ProfileCard'
import { toast } from 'sonner'
import type { Profile, User } from '@/types/database'

import { fetchLinkedInData } from '@/app/actions/fetchLinkedIn'

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null)
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [searchUrl, setSearchUrl] = useState('')
    const [newProfileName, setNewProfileName] = useState('')
    const [newProfileUrl, setNewProfileUrl] = useState('')
    const [newProfileImage, setNewProfileImage] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [isFetchingInfo, setIsFetchingInfo] = useState(false)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
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

            // Get or create user profile
            let { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('auth_id', authUser.id)
                .single()

            if (!userData) {
                // Create user from pending data
                const pendingRole = localStorage.getItem('pending_role') || 'Mid'
                const pendingVoucherId = localStorage.getItem('pending_voucher_id')

                const { data: newUser, error } = await supabase
                    .from('users')
                    .insert({
                        auth_id: authUser.id,
                        email: authUser.email,
                        role: pendingRole,
                        voucher_id: pendingVoucherId,
                    })
                    .select()
                    .single()

                if (error) {
                    console.error('Error creating user:', error)
                    toast.error('Erro ao criar perfil: ' + error.message)
                    return
                }

                // Mark voucher as used
                if (pendingVoucherId) {
                    await supabase
                        .from('vouchers')
                        .update({ is_used: true, used_by_user_id: newUser.id })
                        .eq('id', pendingVoucherId)
                }

                // Clean up localStorage
                localStorage.removeItem('pending_role')
                localStorage.removeItem('pending_voucher_id')
                localStorage.removeItem('pending_email')

                userData = newUser
            }

            setUser(userData)

            // Load profiles
            const { data: profilesData } = await supabase
                .from('profiles')
                .select('*')
                .order('average_score', { ascending: false })
                .limit(20)

            setProfiles(profilesData || [])
            setIsLoading(false)
        }

        loadData()
    }, [supabase, router])

    const handleSearch = async () => {
        if (!searchUrl.trim()) return

        const normalizedUrl = searchUrl.trim().toLowerCase()

        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .ilike('linkedin_url', `%${normalizedUrl}%`)
            .single()

        if (profile) {
            router.push(`/profile/${profile.id}`)
        } else {
            setNewProfileUrl(searchUrl)
            setShowCreateForm(true)
        }
    }

    const handleCreateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsCreating(true)

        try {
            // Normalize LinkedIn URL
            let url = newProfileUrl.trim()
            if (!url.startsWith('http')) {
                url = `https://www.linkedin.com/in/${url}`
            }

            const { data: newProfile, error } = await supabase
                .from('profiles')
                .insert({
                    linkedin_url: url,
                    full_name: newProfileName.trim(),
                    avatar_url: newProfileImage || undefined,
                })
                .select()
                .single()

            if (error) {
                console.error('Error creating profile:', error)
                if (error.code === '23505') {
                    toast.error('Este perfil já existe')
                } else {
                    toast.error('Erro ao criar perfil: ' + error.message)
                }
                return
            }

            toast.success('Perfil criado!')
            router.push(`/profile/${newProfile.id}`)
        } catch {
            toast.error('Erro ao criar perfil')
        } finally {
            setIsCreating(false)
        }
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    if (isLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="animate-pulse text-zinc-400">Carregando...</div>
            </main>
        )
    }

    return (
        <main className="min-h-screen px-4 py-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                            Ratedin
                        </h1>
                        <p className="text-sm text-zinc-500">
                            Olá, {user?.email} ({user?.role})
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {user?.is_admin && (
                            <Button
                                variant="outline"
                                onClick={() => router.push('/admin')}
                                className="border-zinc-700 text-zinc-300"
                            >
                                Admin
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="text-zinc-400 hover:text-zinc-100"
                        >
                            Sair
                        </Button>
                    </div>
                </header>

                {/* Search */}
                <Card className="bg-zinc-900 border-zinc-800 mb-8">
                    <CardHeader>
                        <CardTitle className="text-zinc-100">Buscar ou Avaliar Perfil</CardTitle>
                        <CardDescription className="text-zinc-400">
                            Cole a URL do LinkedIn ou nome de usuário
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-2">
                            <Input
                                placeholder="linkedin.com/in/usuario ou usuario"
                                value={searchUrl}
                                onChange={(e) => setSearchUrl(e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-zinc-100"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button
                                onClick={handleSearch}
                                className="bg-violet-600 hover:bg-violet-700"
                            >
                                Buscar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Create Profile Form */}
                {showCreateForm && (
                    <Card className="bg-zinc-900 border-zinc-800 mb-8">
                        <CardHeader>
                            <CardTitle className="text-zinc-100">Criar Novo Perfil</CardTitle>
                            <CardDescription className="text-zinc-400">
                                Perfil não encontrado. Preencha os dados para criar:
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleCreateProfile} className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">URL do LinkedIn</Label>
                                    <Input
                                        value={newProfileUrl}
                                        onChange={(e) => setNewProfileUrl(e.target.value)}
                                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                            if (!newProfileUrl) return
                                            setIsFetchingInfo(true)
                                            const data = await fetchLinkedInData(newProfileUrl)
                                            setIsFetchingInfo(false)

                                            if (data.error) {
                                                toast.error(data.error === 'LinkedIn requires authentication'
                                                    ? 'LinkedIn bloqueou o acesso público. Preencha manualmente.'
                                                    : `Erro: ${data.error}`)
                                            } else {
                                                if (data.title) setNewProfileName(data.title)
                                                if (data.image) setNewProfileImage(data.image)
                                                toast.success('dados preenchidos via linkedin!')
                                            }
                                        }}
                                        disabled={isFetchingInfo || !newProfileUrl}
                                        className="mt-2 w-full border-zinc-700 text-zinc-300"
                                    >
                                        {isFetchingInfo ? 'buscando...' : '✨ preencher com dados públicos'}
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-300">Nome Completo</Label>
                                    <Input
                                        value={newProfileName}
                                        onChange={(e) => setNewProfileName(e.target.value)}
                                        placeholder="João da Silva"
                                        className="bg-zinc-800 border-zinc-700 text-zinc-100"
                                        required
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="submit"
                                        className="bg-violet-600 hover:bg-violet-700"
                                        disabled={isCreating}
                                    >
                                        {isCreating ? 'Criando...' : 'Criar e Avaliar'}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setShowCreateForm(false)}
                                        className="text-zinc-400"
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Profiles List */}
                <section>
                    <h2 className="text-lg font-semibold text-zinc-200 mb-4">
                        Perfis Recentes
                    </h2>
                    {profiles.length === 0 ? (
                        <p className="text-zinc-500 text-center py-8">
                            Nenhum perfil cadastrado ainda. Seja o primeiro a adicionar!
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {profiles.map((profile) => (
                                <ProfileCard
                                    key={profile.id}
                                    profile={profile}
                                    onClick={() => router.push(`/profile/${profile.id}`)}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}
