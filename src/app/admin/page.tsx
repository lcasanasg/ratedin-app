'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { User, Voucher } from '@/types/database'

function generateVoucherCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const segments = []
    for (let i = 0; i < 3; i++) {
        let segment = ''
        for (let j = 0; j < 4; j++) {
            segment += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        segments.push(segment)
    }
    return segments.join('-')
}

export default function AdminPage() {
    const [user, setUser] = useState<User | null>(null)
    const [vouchers, setVouchers] = useState<Voucher[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function loadData() {
            const { data: { user: authUser } } = await supabase.auth.getUser()

            if (!authUser) {
                router.push('/')
                return
            }

            const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('auth_id', authUser.id)
                .single()

            if (!userData?.is_admin) {
                router.push('/dashboard')
                return
            }

            setUser(userData)

            // Load vouchers created by this admin
            const { data: vouchersData } = await supabase
                .from('vouchers')
                .select('*')
                .eq('created_by', userData.id)
                .order('created_at', { ascending: false })

            setVouchers(vouchersData || [])
            setIsLoading(false)
        }

        loadData()
    }, [supabase, router])

    const handleCreateVoucher = async () => {
        if (!user) return
        setIsCreating(true)

        try {
            const code = generateVoucherCode()

            const { data: newVoucher, error } = await supabase
                .from('vouchers')
                .insert({
                    code,
                    created_by: user.id,
                })
                .select()
                .single()

            if (error) {
                toast.error('Erro ao criar voucher')
                return
            }

            setVouchers([newVoucher, ...vouchers])
            toast.success(`Voucher criado: ${code}`)

            // Copy to clipboard
            navigator.clipboard.writeText(code)
            toast.info('Código copiado para a área de transferência')
        } catch {
            toast.error('Erro ao criar voucher')
        } finally {
            setIsCreating(false)
        }
    }

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code)
        toast.success('Código copiado!')
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
                        <h1 className="text-2xl font-bold text-zinc-100">
                            Painel Admin
                        </h1>
                        <p className="text-sm text-zinc-500">
                            Gerenciamento de vouchers
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/dashboard')}
                        className="text-zinc-400 hover:text-zinc-100"
                    >
                        ← Dashboard
                    </Button>
                </header>

                {/* Create Voucher */}
                <Card className="bg-zinc-900 border-zinc-800 mb-8">
                    <CardHeader>
                        <CardTitle className="text-zinc-100">Gerar Novo Voucher</CardTitle>
                        <CardDescription className="text-zinc-400">
                            Crie códigos de acesso para novos usuários
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={handleCreateVoucher}
                            disabled={isCreating}
                            className="bg-violet-600 hover:bg-violet-700"
                        >
                            {isCreating ? 'Gerando...' : '+ Gerar Voucher'}
                        </Button>
                    </CardContent>
                </Card>

                {/* Vouchers List */}
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-zinc-100">
                            Vouchers Criados ({vouchers.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {vouchers.length === 0 ? (
                            <p className="text-zinc-500 text-center py-4">
                                Nenhum voucher criado ainda
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {vouchers.map((voucher) => (
                                    <div
                                        key={voucher.id}
                                        className="flex items-center justify-between p-4 bg-zinc-800 rounded-lg"
                                    >
                                        <div className="flex items-center gap-4">
                                            <code
                                                className="font-mono text-lg text-violet-400 cursor-pointer hover:text-violet-300"
                                                onClick={() => copyToClipboard(voucher.code)}
                                                title="Clique para copiar"
                                            >
                                                {voucher.code}
                                            </code>
                                            <Badge
                                                variant={voucher.is_used ? 'secondary' : 'default'}
                                                className={voucher.is_used ? 'bg-zinc-700 text-zinc-400' : 'bg-emerald-600 text-white'}
                                            >
                                                {voucher.is_used ? 'Usado' : 'Disponível'}
                                            </Badge>
                                        </div>
                                        <span className="text-sm text-zinc-500">
                                            {new Date(voucher.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    )
}
