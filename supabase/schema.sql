-- =============================================
-- RATEDIN DATABASE SCHEMA
-- Execute este script no Supabase SQL Editor
-- =============================================

-- Habilitar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABELA: profiles (Perfis do LinkedIn avaliados)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  linkedin_url TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  average_score DECIMAL(3,2) DEFAULT 0,
  total_assessments INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABELA: users (Avaliadores registrados)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE, -- Referência ao auth.users do Supabase
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('Junior', 'Mid', 'Senior', 'Lead', 'Staff')) DEFAULT 'Mid',
  is_admin BOOLEAN DEFAULT FALSE,
  voucher_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABELA: vouchers (Códigos de acesso)
-- =============================================
CREATE TABLE IF NOT EXISTS vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABELA: assessments (Avaliações realizadas)
-- =============================================
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluator_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  target_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  -- Scores (1-5)
  comm_score INTEGER CHECK (comm_score BETWEEN 1 AND 5) NOT NULL,
  resilience_score INTEGER CHECK (resilience_score BETWEEN 1 AND 5) NOT NULL,
  collab_score INTEGER CHECK (collab_score BETWEEN 1 AND 5) NOT NULL,
  ownership_score INTEGER CHECK (ownership_score BETWEEN 1 AND 5) NOT NULL,
  commitment_score INTEGER CHECK (commitment_score BETWEEN 1 AND 5) NOT NULL,
  pragmatism_score INTEGER CHECK (pragmatism_score BETWEEN 1 AND 5) NOT NULL,
  -- Peso aplicado baseado na senioridade
  weight_applied DECIMAL(2,1) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Constraint: usuário só pode avaliar cada perfil uma vez
  UNIQUE(evaluator_id, target_profile_id)
);

-- =============================================
-- FUNÇÃO: Calcular média ponderada do perfil
-- =============================================
CREATE OR REPLACE FUNCTION calculate_weighted_average(profile_uuid UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
  weighted_sum DECIMAL;
  total_weight DECIMAL;
  result DECIMAL(3,2);
BEGIN
  SELECT 
    SUM(
      ((comm_score + resilience_score + collab_score + 
        ownership_score + commitment_score + pragmatism_score) / 6.0) 
      * weight_applied
    ),
    SUM(weight_applied)
  INTO weighted_sum, total_weight
  FROM assessments
  WHERE target_profile_id = profile_uuid;
  
  IF total_weight > 0 THEN
    result := weighted_sum / total_weight;
  ELSE
    result := 0;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGER: Atualizar média quando assessment é inserido
-- =============================================
CREATE OR REPLACE FUNCTION update_profile_average()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET 
    average_score = calculate_weighted_average(NEW.target_profile_id),
    total_assessments = (
      SELECT COUNT(*) FROM assessments 
      WHERE target_profile_id = NEW.target_profile_id
    ),
    updated_at = NOW()
  WHERE id = NEW.target_profile_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_assessment_insert
AFTER INSERT ON assessments
FOR EACH ROW
EXECUTE FUNCTION update_profile_average();

-- =============================================
-- ÍNDICES para performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_assessments_target ON assessments(target_profile_id);
CREATE INDEX IF NOT EXISTS idx_assessments_evaluator ON assessments(evaluator_id);
CREATE INDEX IF NOT EXISTS idx_vouchers_code ON vouchers(code);
CREATE INDEX IF NOT EXISTS idx_profiles_linkedin ON profiles(linkedin_url);

-- =============================================
-- INSERIR ADMIN INICIAL (ajuste o email)
-- =============================================
-- INSERT INTO users (email, role, is_admin) 
-- VALUES ('seu-email@exemplo.com', 'Staff', TRUE);
