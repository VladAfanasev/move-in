/**
 * Email service utilities for sending group invitations
 *
 * This file provides a centralized place to handle email sending.
 * Currently uses mailto: links for immediate functionality.
 */

interface InvitationEmailParams {
  to: string
  groupName: string
  groupDescription?: string
  inviterName: string
  inviteUrl: string
  expiryDate: string
}

interface EmailResult {
  success: boolean
  mailtoLink?: string
  emailSubject?: string
  emailBody?: string
  error?: string
}

/**
 * Generates email content for group invitations in Dutch
 */
export function generateInvitationEmail(params: InvitationEmailParams): EmailResult {
  const { to, groupName, groupDescription, inviterName, inviteUrl, expiryDate } = params

  const emailSubject = `Uitnodiging voor koopgroep: ${groupName}`

  const emailBody = `Hallo,

${inviterName} heeft je uitgenodigd om lid te worden van de koopgroep "${groupName}".

${groupDescription ? `Groepsbeschrijving: ${groupDescription}\n\n` : ""}Klik op de onderstaande link om de uitnodiging te accepteren:
${inviteUrl}

Deze uitnodiging verloopt op ${expiryDate}.

Als je nog geen account hebt, kun je er gratis een aanmaken via de link.

Met vriendelijke groet,
Het Move-in team`

  const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`

  return {
    success: true,
    mailtoLink,
    emailSubject,
    emailBody,
  }
}

/**
 * Send invitation email using mailto: links
 *
 * Generates a mailto: link with pre-filled subject and body
 * for users to send the invitation email manually.
 */
export async function sendInvitationEmail(params: InvitationEmailParams): Promise<EmailResult> {
  // Always use mailto: links for immediate functionality
  return generateInvitationEmail(params)
}
