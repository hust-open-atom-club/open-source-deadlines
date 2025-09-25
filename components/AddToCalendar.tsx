"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { google, ics, outlook, yahoo } from "calendar-link";
import {
  Apple,
  Calendar,
  CalendarDays,
  CalendarRange,
  Mail,
} from "lucide-react";
import { DateTime } from "luxon";

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
  const start = DateTime.fromISO(
    `${startDate}T${startTime ?? "00:00"}`,
    { zone: timeZone }
  ).toISO();

  const end = DateTime.fromISO(
    `${endDate}T${endTime ?? "23:59"}`,
    { zone: timeZone }
  ).toISO();

  const event = {
    title,
    description,
    location,
    start,
    end,
  };

  // 生成 ICS 下载
  const handleDownloadICS = () => {
    const fileContent = ics(event);
    const blob = new Blob([fileContent], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          日历
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
          <Apple className="h-4 w-4" /> Apple / iCal (下载 .ics)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
