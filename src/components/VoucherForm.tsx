'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { createClient } from '@/lib/supabase/client'
import type { Role } from '@/lib/scoring'

interface VoucherFormProps {
    onSuccess: () => void
}

export function VoucherForm({ onSuccess }: VoucherFormProps) {
    const [step, setStep] = useState<'voucher' | 'email' | 'role'>('voucher')
    const [voucher, setVoucher] = useState('')
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<Role>('Mid')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    const supabase = createClient()

    const handleVoucherSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            // Verificar se o voucher existe e não foi usado
            const { data: voucherData, error: voucherError } = await supabase
                .from('vouchers')
                .select('*')
                .eq('code', voucher.toUpperCase().trim())
                .eq('is_used', false)
                .single()

            if (voucherError || !voucherData) {
                setError('Voucher inválido ou já utilizado')
                setIsLoading(false)
                return
            }

            // Guardar voucher ID no localStorage temporariamente
            localStorage.setItem('pending_voucher_id', voucherData.id)
            setStep('email')
        } catch {
            setError('Erro ao validar voucher')
        } finally {
            setIsLoading(false)
        }
    }

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError('')

        try {
            const { error: signInError } = await supabase.auth.signInWithOtp({
                email: email.trim(),
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            })

            if (signInError) {
                setError(signInError.message)
                setIsLoading(false)
                return
            }

            localStorage.setItem('pending_email', email.trim())
            setStep('role')
        } catch {
            setError('Erro ao enviar email')
        } finally {
            setIsLoading(false)
        }
    }

    const handleRoleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        localStorage.setItem('pending_role', role)
        onSuccess()
    }

    if (step === 'role') {
        return (
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-xl text-zinc-100">
                        Qual sua senioridade?
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                        Sua senioridade define o peso da sua avaliação
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleRoleSubmit}>
                    <CardContent>
                        <RadioGroup value={role} onValueChange={(v) => setRole(v as Role)}>
                            <div className="flex items-center space-x-3 py-2">
                                <RadioGroupItem value="Junior" id="junior" />
                                <Label htmlFor="junior" className="text-zinc-300 cursor-pointer">
                                    Junior <span className="text-zinc-500">(peso 0.8)</span>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-3 py-2">
                                <RadioGroupItem value="Mid" id="mid" />
                                <Label htmlFor="mid" className="text-zinc-300 cursor-pointer">
                                    Mid-Level <span className="text-zinc-500">(peso 1.0)</span>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-3 py-2">
                                <RadioGroupItem value="Senior" id="senior" />
                                <Label htmlFor="senior" className="text-zinc-300 cursor-pointer">
                                    Senior <span className="text-zinc-500">(peso 1.2)</span>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-3 py-2">
                                <RadioGroupItem value="Lead" id="lead" />
                                <Label htmlFor="lead" className="text-zinc-300 cursor-pointer">
                                    Lead <span className="text-zinc-500">(peso 1.5)</span>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-3 py-2">
                                <RadioGroupItem value="Staff" id="staff" />
                                <Label htmlFor="staff" className="text-zinc-300 cursor-pointer">
                                    Staff+ <span className="text-zinc-500">(peso 1.5)</span>
                                </Label>
                            </div>
                        </RadioGroup>
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full bg-violet-600 hover:bg-violet-700"
                        >
                            Continuar
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        )
    }

    if (step === 'email') {
        return (
            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
                <CardHeader>
                    <CardTitle className="text-xl text-zinc-100">
                        Verificar Email
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                        Enviaremos um link mágico para seu email
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleEmailSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-300">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                            />
                        </div>
                        {error && <p className="text-red-400 text-sm">{error}</p>}
                    </CardContent>
                    <CardFooter>
                        <Button
                            type="submit"
                            className="w-full bg-violet-600 hover:bg-violet-700"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Enviando...' : 'Enviar Link Mágico'}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
            <CardHeader>
                <CardTitle className="text-xl text-zinc-100">
                    Acesso Restrito
                </CardTitle>
                <CardDescription className="text-zinc-400">
                    Insira seu código de voucher para continuar
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleVoucherSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="voucher" className="text-zinc-300">Código do Voucher</Label>
                        <Input
                            id="voucher"
                            type="text"
                            placeholder="XXXX-XXXX-XXXX"
                            value={voucher}
                            onChange={(e) => setVoucher(e.target.value.toUpperCase())}
                            required
                            className="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 font-mono text-center text-lg tracking-wider"
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                </CardContent>
                <CardFooter>
                    <Button
                        type="submit"
                        className="w-full bg-violet-600 hover:bg-violet-700"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Validando...' : 'Validar Voucher'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
