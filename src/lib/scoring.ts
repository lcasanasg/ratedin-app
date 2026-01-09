// Pesos por senioridade para cálculo da média ponderada
export const ROLE_WEIGHTS: Record<string, number> = {
    Junior: 0.8,
    Mid: 1.0,
    Senior: 1.2,
    Lead: 1.5,
    Staff: 1.5,
}

export type Role = 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Staff'

export interface Assessment {
    comm_score: number
    resilience_score: number
    collab_score: number
    ownership_score: number
    commitment_score: number
    pragmatism_score: number
}

export interface WeightedAssessment extends Assessment {
    weight_applied: number
}

// Retorna o peso baseado na senioridade
export function getWeightForRole(role: Role): number {
    return ROLE_WEIGHTS[role] || 1.0
}

// Calcula a média simples de um assessment
export function calculateAssessmentAverage(assessment: Assessment): number {
    const scores = [
        assessment.comm_score,
        assessment.resilience_score,
        assessment.collab_score,
        assessment.ownership_score,
        assessment.commitment_score,
        assessment.pragmatism_score,
    ]
    return scores.reduce((a, b) => a + b, 0) / scores.length
}

// Calcula a média ponderada de múltiplos assessments
export function calculateWeightedAverage(assessments: WeightedAssessment[]): number {
    if (assessments.length === 0) return 0

    let weightedSum = 0
    let totalWeight = 0

    for (const assessment of assessments) {
        const avg = calculateAssessmentAverage(assessment)
        weightedSum += avg * assessment.weight_applied
        totalWeight += assessment.weight_applied
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0
}

// Prepara os dados para o Radar Chart
export function prepareRadarData(
    assessments: WeightedAssessment[],
    seniorOnly: boolean = false
): { metric: string; value: number; fullMark: number }[] {
    const metrics = [
        { key: 'comm_score', label: 'Comunicação' },
        { key: 'resilience_score', label: 'Resiliência' },
        { key: 'collab_score', label: 'Colaboração' },
        { key: 'ownership_score', label: 'Ownership' },
        { key: 'commitment_score', label: 'Comprometimento' },
        { key: 'pragmatism_score', label: 'Pragmatismo' },
    ]

    // Filtra por senioridade se necessário
    const filtered = seniorOnly
        ? assessments.filter((a) => a.weight_applied >= 1.2)
        : assessments

    if (filtered.length === 0) {
        return metrics.map((m) => ({ metric: m.label, value: 0, fullMark: 5 }))
    }

    return metrics.map((m) => {
        let weightedSum = 0
        let totalWeight = 0

        for (const assessment of filtered) {
            const score = assessment[m.key as keyof Assessment] as number
            weightedSum += score * assessment.weight_applied
            totalWeight += assessment.weight_applied
        }

        return {
            metric: m.label,
            value: totalWeight > 0 ? weightedSum / totalWeight : 0,
            fullMark: 5,
        }
    })
}
