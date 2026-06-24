"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { google, outlook, yahoo } from "calendar-link";
import {
  Apple,
  Bell,
  Calendar,
  CalendarDays,
  CalendarRange,
  Check,
  Copy,
  Link as LinkIcon,
  Mail,
} from "lucide-react";
import { DateTime } from "luxon";
import { useTranslation } from "react-i18next";

interface AddToCalendarProps {
  title: string;
  description?: string;
  location?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  timeZone: string;   // e.g. "Asia/Shanghai"
  /**
   * When provided, the dropdown also shows a "Subscribe (auto-update)" group
   * that points at GET /api/activities/[subscriptionEventId]/ics. This is
   * the event-level (single yearly edition) subscription endpoint, which
   * tracks every deadline in the timeline at once.
   */
  subscriptionEventId?: string;
}

function buildSubscriptionUrl(eventId: string): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/api/activities/${encodeURIComponent(eventId)}/ics`;
}

function toWebcalUrl(httpUrl: string): string {
  return httpUrl.replace(/^https?:\/\//, "webcal://");
}

export function AddToCalendar({
  title,
  description,
  location,
  startDate,
  endDate,
  startTime,
  endTime,
  timeZone,
  subscriptionEventId,
}: AddToCalendarProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [subscriptionUrl, setSubscriptionUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!subscriptionEventId) {
      setSubscriptionUrl(null);
      return;
    }
    setSubscriptionUrl(buildSubscriptionUrl(subscriptionEventId));
  }, [subscriptionEventId]);

  const startLuxon = DateTime.fromISO(
    `${startDate}T${startTime ?? "00:00"}`,
    { zone: timeZone }
  );
  const endLuxon = DateTime.fromISO(
    `${endDate}T${endTime ?? "23:59"}`,
    { zone: timeZone }
  );

  const start = startLuxon.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
  const end = endLuxon.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");

  const event = {
    title,
    description,
    location,
    start: startLuxon.toISO(),
    end: endLuxon.toISO(),
  };

  const handleDownloadICS = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//YourApp//EN
BEGIN:VEVENT
UID:${Date.now()}-${Math.random().toString(36).substring(2, 11)}@example.com
DTSTAMP:${DateTime.now().toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'")}
DTSTART:${start}
DTEND:${end}
SUMMARY:${title.replace(/[\n\r]/g, "\\n")}
${description ? `DESCRIPTION:${description.replace(/[\n\r]/g, "\\n")}` : ""}
${location ? `LOCATION:${location.replace(/[\n\r]/g, "\\n")}` : ""}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}_${startDate}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const googleSubscribeUrl = subscriptionUrl
    ? `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(subscriptionUrl)}`
    : null;
  const appleSubscribeUrl = subscriptionUrl ? toWebcalUrl(subscriptionUrl) : null;

  const handleCopySubscriptionLink = async (
    e: React.MouseEvent<HTMLDivElement>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!subscriptionUrl) return;
    try {
      await navigator.clipboard.writeText(subscriptionUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.warn("Failed to copy subscription link:", err);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {t("calendar.title")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem asChild>
          <a
            href={google(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <CalendarDays className="h-4 w-4" /> Google
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={outlook(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" /> Outlook.com
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a
            href={yahoo(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <CalendarRange className="h-4 w-4" /> Yahoo
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDownloadICS}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Apple className="h-4 w-4" /> Apple / iCal ({t("calendar.download")})
        </DropdownMenuItem>

        {subscriptionUrl && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
              <Bell className="h-3.5 w-3.5" />
              {t("calendar.subscribe")}
            </DropdownMenuLabel>
            {googleSubscribeUrl && (
              <DropdownMenuItem asChild>
                <a
                  href={googleSubscribeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <CalendarDays className="h-4 w-4" />
                  {t("calendar.googleSubscribe")}
                </a>
              </DropdownMenuItem>
            )}
            {appleSubscribeUrl && (
              <DropdownMenuItem asChild>
                <a
                  href={appleSubscribeUrl}
                  className="flex items-center gap-2"
                >
                  <LinkIcon className="h-4 w-4" />
                  {t("calendar.appleSubscribe")}
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              onClick={handleCopySubscriptionLink}
              className="flex items-center gap-2 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  {t("calendar.copied")}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  {t("calendar.copyLink")}
                </>
              )}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
