import { MessageCircle, Phone, Mail, MapPin, Link as LinkIcon } from "lucide-react";
import { contactDataSchema } from "@/lib/modules/schemas";
import { btnClass } from "@/components/ui/button";

export default function ContactPublicView({ data }: { data: unknown }) {
  const parsed = contactDataSchema.safeParse(data);
  if (!parsed.success) return null;
  const { phone, whatsapp, email, location, socials } = parsed.data;

  return (
    <div>
      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnClass("solid", "md")} mb-4`}
        >
          <MessageCircle size={16} />
          Message on WhatsApp
        </a>
      )}

      <div className="flex flex-col gap-3 text-[14.5px]">
        {phone && (
          <a href={`tel:${phone}`} className="flex items-center gap-3 text-ink transition-colors hover:text-emerald">
            <Phone size={17} className="text-muted" /> {phone}
          </a>
        )}
        {email && (
          <a href={`mailto:${email}`} className="flex items-center gap-3 text-ink transition-colors hover:text-emerald">
            <Mail size={17} className="text-muted" /> {email}
          </a>
        )}
        {location && (
          <p className="flex items-center gap-3 text-ink">
            <MapPin size={17} className="text-muted" /> {location}
          </p>
        )}
        {socials.map((s) => (
          <a
            key={s.url}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-ink transition-colors hover:text-emerald"
          >
            <LinkIcon size={17} className="text-muted" /> {s.label}
          </a>
        ))}
      </div>
    </div>
  );
}
