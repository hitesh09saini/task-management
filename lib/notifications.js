import Notification from "@/models/Notification";
import User from "@/models/User";
import { sendEmail, notificationEmail } from "./email";

export async function notify(userId, { type, message, link = "" }) {
  if (!userId) return null;
  try {
    const note = await Notification.create({
      user: userId,
      type,
      message,
      link,
    });

    // Fire-and-forget email (only if SMTP is configured)
    if (process.env.SMTP_HOST) {
      (async () => {
        try {
          const u = await User.findById(userId).select("email").lean();
          if (u?.email) {
            await sendEmail({
              to: u.email,
              ...notificationEmail({
                subject: `[Smart PMS] ${message.slice(0, 80)}`,
                message,
                link,
              }),
            });
          }
        } catch (e) {
          console.error("notify email failed:", e);
        }
      })();
    }

    return note;
  } catch (e) {
    console.error("notify failed:", e);
    return null;
  }
}

export async function notifyMany(userIds, payload) {
  const unique = [...new Set(userIds.filter(Boolean).map(String))];
  return Promise.all(unique.map((id) => notify(id, payload)));
}
