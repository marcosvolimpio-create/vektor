import { SignupForm } from '@/components/auth/signup-form';

interface CadastroPageProps {
  searchParams: Promise<{ redirectTo?: string }>;
}

export default async function CadastroPage({ searchParams }: CadastroPageProps) {
  const { redirectTo } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Criar conta na VEKTOR</h1>
      <div className="w-full max-w-sm">
        <SignupForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}
