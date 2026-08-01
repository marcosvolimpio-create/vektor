import { CreateWorkspaceForm } from '@/components/onboarding/create-workspace-form';

export default function CriarWorkspacePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Criar seu Workspace</h1>
      <div className="w-full max-w-sm">
        <CreateWorkspaceForm />
      </div>
    </div>
  );
}
