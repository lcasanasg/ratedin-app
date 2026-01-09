-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Execute APÓS o schema.sql
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES: Todos podem ver, apenas autenticados podem criar
-- =============================================
CREATE POLICY "Profiles são visíveis para todos"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Usuários autenticados podem criar perfis"
  ON profiles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Usuários autenticados podem atualizar perfis"
  ON profiles FOR UPDATE
  USING (auth.role() = 'authenticated');

-- =============================================
-- USERS: Usuário vê apenas seu próprio registro
-- =============================================
CREATE POLICY "Usuários veem apenas próprio perfil"
  ON users FOR SELECT
  USING (auth.uid() = auth_id OR is_admin = true);

CREATE POLICY "Usuários podem atualizar próprio perfil"
  ON users FOR UPDATE
  USING (auth.uid() = auth_id);

CREATE POLICY "Service role pode criar usuários"
  ON users FOR INSERT
  WITH CHECK (true);

-- =============================================
-- VOUCHERS: Admins podem criar, todos podem usar
-- =============================================
CREATE POLICY "Vouchers visíveis para validação"
  ON vouchers FOR SELECT
  USING (true);

CREATE POLICY "Apenas admins criam vouchers"
  ON vouchers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Vouchers podem ser atualizados para uso"
  ON vouchers FOR UPDATE
  USING (is_used = false);

-- =============================================
-- ASSESSMENTS: Usuário só vê que avaliou, não quem o avaliou
-- =============================================
CREATE POLICY "Usuário vê apenas suas próprias avaliações"
  ON assessments FOR SELECT
  USING (
    evaluator_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

CREATE POLICY "Usuários autenticados podem criar avaliações"
  ON assessments FOR INSERT
  WITH CHECK (
    evaluator_id IN (
      SELECT id FROM users WHERE auth_id = auth.uid()
    )
  );

-- =============================================
-- FUNÇÃO: Buscar médias agregadas (sem expor avaliadores)
-- =============================================
CREATE OR REPLACE FUNCTION get_profile_aggregated_scores(profile_uuid UUID, senior_only BOOLEAN DEFAULT FALSE)
RETURNS TABLE (
  metric TEXT,
  average_score DECIMAL(3,2),
  total_evaluators INTEGER
) AS $$
BEGIN
  IF senior_only THEN
    RETURN QUERY
    SELECT 
      unnest(ARRAY['Comunicação', 'Resiliência', 'Colaboração', 'Ownership', 'Comprometimento', 'Pragmatismo']) as metric,
      unnest(ARRAY[
        AVG(a.comm_score * a.weight_applied) / NULLIF(SUM(a.weight_applied), 0),
        AVG(a.resilience_score * a.weight_applied) / NULLIF(SUM(a.weight_applied), 0),
        AVG(a.collab_score * a.weight_applied) / NULLIF(SUM(a.weight_applied), 0),
        AVG(a.ownership_score * a.weight_applied) / NULLIF(SUM(a.weight_applied), 0),
        AVG(a.commitment_score * a.weight_applied) / NULLIF(SUM(a.weight_applied), 0),
        AVG(a.pragmatism_score * a.weight_applied) / NULLIF(SUM(a.weight_applied), 0)
      ])::DECIMAL(3,2) as average_score,
      COUNT(*)::INTEGER as total_evaluators
    FROM assessments a
    JOIN users u ON a.evaluator_id = u.id
    WHERE a.target_profile_id = profile_uuid
      AND u.role IN ('Senior', 'Lead', 'Staff');
  ELSE
    RETURN QUERY
    SELECT 
      unnest(ARRAY['Comunicação', 'Resiliência', 'Colaboração', 'Ownership', 'Comprometimento', 'Pragmatismo']) as metric,
      unnest(ARRAY[
        SUM(a.comm_score * a.weight_applied) / NULLIF(SUM(a.weight_applied), 0),
        SUM(a.resilience_score * a.weight_applied) / NULLIF(SUM(a.weight_applied), 0),
        SUM(a.collab_score * a.weight_applied) / NULLIF(SUM(a.weight_applied), 0),
        SUM(a.ownership_score * a.weight_applied) / NULLIF(SUM(a.weight_applied), 0),
        SUM(a.commitment_score * a.weight_applied) / NULLIF(SUM(a.weight_applied), 0),
        SUM(a.pragmatism_score * a.weight_applied) / NULLIF(SUM(a.weight_applied), 0)
      ])::DECIMAL(3,2) as average_score,
      COUNT(*)::INTEGER as total_evaluators
    FROM assessments a
    WHERE a.target_profile_id = profile_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
