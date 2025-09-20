"use client";

import { useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateTimeSelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function DateTimeSelector({
  selectedDate,
  onDateChange,
}: DateTimeSelectorProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (dateStr === formatDate(today)) {
      return "Today";
    } else if (dateStr === formatDate(tomorrow)) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  };

  const handleTomorrowClick = () => {
    onDateChange(formatDate(tomorrow));
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateChange(e.target.value);
  };

  const isTomorrow = selectedDate === formatDate(tomorrow);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Date Selector */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Date:</span>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full sm:w-[160px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  {selectedDate
                    ? formatDisplayDate(selectedDate)
                    : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-3">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={handleDateInputChange}
                    className="w-full"
                  />
                </div>
              </PopoverContent>
            </Popover>

            {/* Tomorrow Tab */}
            <Button
              variant={isTomorrow ? "primary" : "outline"}
              size="sm"
              onClick={handleTomorrowClick}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap",
                isTomorrow
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              Tomorrow
            </Button>
          </div>
        </div>

        {/* Static Departure Time */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />

            <span className="text-sm font-medium text-gray-700">
              Departure:
            </span>
            <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-sm font-semibold text-green-700">
                6:00 AM
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
