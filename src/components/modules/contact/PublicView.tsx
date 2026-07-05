import { MessageCircle, Phone, Mail, MapPin, Link as LinkIcon } from "lucide-react";
import { contactDataSchema } from "@/lib/modules/schemas";

export default function ContactPublicView({ data }: { data: unknown }) {
  const parsed = contactDataSchema.safeParse(data);
  if (!parsed.success) return null;
  const { phone, whatsapp, email, location, socials } = parsed.data;

  return (
    <section id="contact">
      <h2 className="text-lg font-semibold">Contact</h2>
      <div className="mt-3 flex flex-col gap-2 text-sm">
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 font-medium text-white"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
        )}
        {phone && (
          <a href={`tel:${phone}`} className="flex items-center gap-2 text-neutral-700">
            <Phone size={16} /> {phone}
          </a>
        )}
        {email && (
          <a href={`mailto:${email}`} className="flex items-center gap-2 text-neutral-700">
            <Mail size={16} /> {email}
          </a>
        )}
        {location && (
          <p className="flex items-center gap-2 text-neutral-700">
            <MapPin size={16} /> {location}
          </p>
        )}
        {socials.map((s) => (
          <a
            key={s.url}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-neutral-700"
          >
            <LinkIcon size={16} /> {s.label}
          </a>
        ))}
      </div>
    </section>
  );
}
