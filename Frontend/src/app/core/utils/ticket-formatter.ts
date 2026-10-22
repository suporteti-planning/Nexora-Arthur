/**
 * Converte um ID de ticket (UUID ou string) em um número amigável para exibição
 * Exemplo: TKT-XXX-0XSXCX -> 1045 (sem o #, adicione no template)
 */
export function formatTicketId(id: string | number): string {
  if (typeof id === 'number') {
    // Para IDs numéricos, usa hash simples
    const hash = (id * 7919) % 9000 + 1000;
    return hash.toString();
  }
  
  // Remove prefixos comuns
  const clean = id.replace(/^TKT-/i, '').replace(/-/g, '');
  
  // Pega últimos 4 caracteres e converte para número
  const hex = clean.slice(-4);
  const num = parseInt(hex, 16);
  
  // Garante número entre 1000-9999
  const displayNum = 1000 + (num % 9000);
  
  return displayNum.toString();
}

/**
 * Mock de serviço de notificação por email
 * TODO: Integrar com backend quando disponível
 */
export function notifyTicketUpdate(ticketId: string, userEmail: string, updateType: string): void {
  const formattedId = formatTicketId(ticketId);
  
  console.log(`📧 [EMAIL MOCK] Enviando notificação para ${userEmail}`);
  console.log(`   Assunto: [Chamado ${formattedId}] - Atualização de status`);
  console.log(`   Tipo de atualização: ${updateType}`);
  console.log(`   ⚠️  Integração de email real pendente no backend`);
  
  // Payload que seria enviado ao backend:
  const emailPayload = {
    to: userEmail,
    subject: `[Chamado ${formattedId}] - Atualização`,
    template: 'ticket-update',
    data: {
      ticketId: formattedId,
      updateType,
      ticketUrl: `${window.location.origin}/acompanhamento`,
    },
  };
  
  console.log(`   Payload para backend:`, emailPayload);
}
