import { Resend } from "resend";
import { COMPANY_NAME } from "./i18n";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

/** e.g. "Canaaustralasia Staff Check-In <notifications@canaaustralasia.com>" */
const FROM_ADDRESS =
  process.env.LEAVE_NOTIFY_FROM_EMAIL || "onboarding@resend.dev";

export async function sendLeaveRequestEmail({
  to,
  staffName,
  leaveType,
  startDate,
  days,
  reason,
}: {
  to: string[];
  staffName: string;
  leaveType: "sick" | "annual";
  startDate: string;
  days: number;
  reason?: string | null;
}) {
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping leave request email");
    return;
  }
  if (to.length === 0) return;

  const leaveTypeLabel = leaveType === "sick" ? "Sick leave / ลาป่วย" : "Annual leave / ลาพักร้อน";
  const formattedDate = new Date(startDate).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  try {
    await resend.emails.send({
      from: `${COMPANY_NAME} Staff Check-In <${FROM_ADDRESS}>`,
      to,
      subject: `New leave request from ${staffName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="margin-bottom: 4px;">New Leave Request</h2>
          <p style="color: #64748b; margin-top: 0;">${COMPANY_NAME} Staff Check-In</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Staff</td>
              <td style="padding: 6px 0; font-weight: 600;">${staffName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Type</td>
              <td style="padding: 6px 0; font-weight: 600;">${leaveTypeLabel}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Start date</td>
              <td style="padding: 6px 0; font-weight: 600;">${formattedDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Days</td>
              <td style="padding: 6px 0; font-weight: 600;">${days}</td>
            </tr>
            ${
              reason
                ? `<tr><td style="padding: 6px 0; color: #64748b;">Reason</td><td style="padding: 6px 0;">${reason}</td></tr>`
                : ""
            }
          </table>
          <p style="color: #64748b; font-size: 13px;">
            Review and approve/reject this request in the Leave tab of the staff check-in app.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send leave request email", err);
  }
}
