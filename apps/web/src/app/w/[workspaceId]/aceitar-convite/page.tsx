import { AcceptInviteButton } from '@/components/configuracoes/accept-invite-button';

interface AceitarConvitePageProps {
  params: Promise<{ workspaceId: string }>;
}

export default async function AceitarConvitePage({ params }: AceitarConvitePageProps) {
  const { workspaceId } = await params;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Convite para Workspace</h1>
      <p className="text-sm text-muted-foreground">
        Você foi convidado para este Workspace. Aceite para começar a colaborar.
      </p>
      <AcceptInviteButton workspaceId={workspaceId} />
    </div>
  );
}
