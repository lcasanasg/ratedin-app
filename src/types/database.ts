export interface Profile {
    id: string
    linkedin_url: string
    full_name: string
    avatar_url: string | null
    average_score: number
    total_assessments: number
    created_at: string
    updated_at: string
}

export interface User {
    id: string
    auth_id: string | null
    email: string
    full_name: string | null
    role: 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Staff'
    is_admin: boolean
    voucher_id: string | null
    created_at: string
    updated_at: string
}

export interface Voucher {
    id: string
    code: string
    created_by: string | null
    is_used: boolean
    used_by_user_id: string | null
    created_at: string
}

export interface Assessment {
    id: string
    evaluator_id: string
    target_profile_id: string
    comm_score: number
    resilience_score: number
    collab_score: number
    ownership_score: number
    commitment_score: number
    pragmatism_score: number
    weight_applied: number
    created_at: string
}

export interface AssessmentInput {
    target_profile_id: string
    comm_score: number
    resilience_score: number
    collab_score: number
    ownership_score: number
    commitment_score: number
    pragmatism_score: number
}

export interface RadarDataPoint {
    metric: string
    value: number
    fullMark: number
}
