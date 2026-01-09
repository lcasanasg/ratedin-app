export default function AuthConfirmPage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="text-6xl mb-6">📧</div>
                <h1 className="text-2xl font-bold text-zinc-100 mb-4">
                    Verifique seu Email
                </h1>
                <p className="text-zinc-400 mb-6">
                    Enviamos um link mágico para seu email. Clique no link para acessar a plataforma.
                </p>
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
                    <p className="text-sm text-zinc-500">
                        Não recebeu o email? Verifique sua pasta de spam ou tente novamente em alguns minutos.
                    </p>
                </div>
            </div>
        </main>
    )
}
