"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { google, outlook, yahoo } from "calendar-link";
import {
  Apple,
  Calendar,
  CalendarDays,
  CalendarRange,
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
}: AddToCalendarProps) {
  // 组合 ISO 格式时间
  const startLuxon = DateTime.fromISO(
    `${startDate}T${startTime ?? "00:00"}`,
    { zone: timeZone }
  );
  const endLuxon = DateTime.fromISO(
    `${endDate}T${endTime ?? "23:59"}`,
    { zone: timeZone }
  );

  // For ICS export (UTC format)
  const start = startLuxon.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
  const end = endLuxon.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");

  // For Google/Outlook/Yahoo (ISO format)
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

  const { t } = useTranslation();

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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}