'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import type { AssessmentInput } from '@/types/database'

interface AssessmentFormProps {
    profileName: string
    onSubmit: (assessment: Omit<AssessmentInput, 'target_profile_id'>) => Promise<void>
    isLoading?: boolean
}

const METRICS = [
    {
        key: 'comm_score',
        label: 'Comunicação Técnica',
        description: 'Clareza ao explicar conceitos técnicos e se fazer entender',
    },
    {
        key: 'resilience_score',
        label: 'Resiliência e Adaptabilidade',
        description: 'Capacidade de lidar com mudanças e pressão',
    },
    {
        key: 'collab_score',
        label: 'Colaboração (Teamwork)',
        description: 'Trabalho em equipe e apoio aos colegas',
    },
    {
        key: 'ownership_score',
        label: 'Ownership (Senso de Dono)',
        description: 'Responsabilidade e proatividade com o produto/código',
    },
    {
        key: 'commitment_score',
        label: 'Comprometimento',
        description: 'Entregas no prazo e participação em rituais',
    },
    {
        key: 'pragmatism_score',
        label: 'Pragmatismo',
        description: 'Equilíbrio entre solução simples vs over-engineering',
    },
] as const

export function AssessmentForm({ profileName, onSubmit, isLoading }: AssessmentFormProps) {
    const [scores, setScores] = useState<Record<string, number>>({
        comm_score: 3,
        resilience_score: 3,
        collab_score: 3,
        ownership_score: 3,
        commitment_score: 3,
        pragmatism_score: 3,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await onSubmit({
            comm_score: scores.comm_score,
            resilience_score: scores.resilience_score,
            collab_score: scores.collab_score,
            ownership_score: scores.ownership_score,
            commitment_score: scores.commitment_score,
            pragmatism_score: scores.pragmatism_score,
        })
    }

    const handleScoreChange = (key: string, value: number[]) => {
        setScores((prev) => ({ ...prev, [key]: value[0] }))
    }

    return (
        <Card className="w-full max-w-2xl bg-zinc-900 border-zinc-800">
            <CardHeader>
                <CardTitle className="text-xl text-zinc-100">
                    Avaliar {profileName}
                </CardTitle>
                <CardDescription className="text-zinc-400">
                    Atribua notas de 1 a 5 para cada competência. Sua avaliação é anônima.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                    {METRICS.map((metric) => (
                        <div key={metric.key} className="space-y-3">
                            <div className="flex justify-between items-center">
                                <Label htmlFor={metric.key} className="text-zinc-200 font-medium">
                                    {metric.label}
                                </Label>
                                <span className="text-2xl font-bold text-violet-400">
                                    {scores[metric.key]}
                                </span>
                            </div>
                            <p className="text-sm text-zinc-500">{metric.description}</p>
                            <Slider
                                id={metric.key}
                                min={1}
                                max={5}
                                step={1}
                                value={[scores[metric.key]]}
                                onValueChange={(value) => handleScoreChange(metric.key, value)}
                                className="py-2"
                            />
                            <div className="flex justify-between text-xs text-zinc-600">
                                <span>1 - Precisa melhorar</span>
                                <span>5 - Excelente</span>
                            </div>
                        </div>
                    ))}
                </CardContent>
                <CardFooter>
                    <Button
                        type="submit"
                        className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Enviando...' : 'Enviar Avaliação'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
