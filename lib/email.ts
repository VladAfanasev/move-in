/**
 * Email service utilities for sending group invitations
 *
 * This file provides a centralized place to handle email sending.
 * Supports multiple email services including Resend for production use.
 */

import { resend } from "./resend"

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
 * Send invitation email using the configured email service
 *
 * Currently uses mailto: links for immediate functionality.
 * To add a production email service:
 *
 * 1. Install your preferred service (e.g., `bun add resend`)
 * 2. Add environment variables for API keys
 * 3. Implement the service in the switch statement below
 * 4. Set EMAIL_SERVICE environment variable
 *
 * Example with Resend:
 * ```
 * case 'resend':
 *   const resend = new Resend(process.env.RESEND_API_KEY)
 *   const result = await resend.emails.send({
 *     from: 'noreply@move-in.nl',
 *     to: params.to,
 *     subject: emailSubject,
 *     text: emailBody,
 *   })
 *   return { success: !result.error, error: result.error?.message }
 * ```
 */
export async function sendInvitationEmail(params: InvitationEmailParams): Promise<EmailResult> {
  const emailService = process.env.EMAIL_SERVICE

  switch (emailService) {
    case "resend":
      try {
        const { emailSubject, emailBody } = generateInvitationEmail(params)

        if (emailSubject == null || emailBody == null) {
          return { success: false, error: "Failed to generate email content" }
        }

        const result = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "noreply@move-in.nl",
          to: [params.to],
          subject: emailSubject,
          text: emailBody,
        })

        if (result.error) {
          console.error("Resend email error:", result.error)
          return { success: false, error: result.error.message }
        }

        return { success: true }
      } catch (error) {
        console.error("Failed to send email via Resend:", error)
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error occurred",
        }
      }
    default:
      // Use mailto: links for immediate functionality
      return generateInvitationEmail(params)
  }
}

/**
 * Email service configuration options
 */
export const EMAIL_SERVICES = {
  RESEND: "resend",
} as const

export type EmailService = (typeof EMAIL_SERVICES)[keyof typeof EMAIL_SERVICES]
