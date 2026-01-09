'use client'

import { useRouter } from 'next/navigation'
import { VoucherForm } from '@/components/VoucherForm'

export default function Home() {
  const router = useRouter()

  const handleVoucherSuccess = () => {
    router.push('/auth/confirm')
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
            Ratedin
          </span>
        </h1>
        <p className="text-xl text-zinc-400 max-w-lg mx-auto">
          Plataforma de reputação comportamental para profissionais de tecnologia
        </p>
        <div className="flex gap-3 justify-center mt-6">
          <span className="px-3 py-1 bg-zinc-800 rounded-full text-sm text-zinc-400">
            🎯 Avaliações Anônimas
          </span>
          <span className="px-3 py-1 bg-zinc-800 rounded-full text-sm text-zinc-400">
            ⚖️ Peso por Senioridade
          </span>
          <span className="px-3 py-1 bg-zinc-800 rounded-full text-sm text-zinc-400">
            📊 6 Competências
          </span>
        </div>
      </div>

      {/* Voucher Form */}
      <VoucherForm onSuccess={handleVoucherSuccess} />

      {/* Footer */}
      <footer className="mt-16 text-center text-zinc-600 text-sm">
        <p>Acesso apenas por convite</p>
      </footer>
    </main>
  )
}
