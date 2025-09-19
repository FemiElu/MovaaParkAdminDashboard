"use client";

import { useState } from "react";
import { Calendar } from "lucide-react";
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
  selectedTime: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}

export function DateTimeSelector({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
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

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTimeChange(e.target.value);
  };

  const isToday = selectedDate === formatDate(today);
  const isTomorrow = selectedDate === formatDate(tomorrow);

  return (
    <div className="bg-white rounded-lg border p-6 mb-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Date Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Date:</span>
          </div>

          <div className="flex items-center gap-2">
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[140px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  {formatDisplayDate(selectedDate)}
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
                "px-3 py-1 text-xs font-medium transition-all duration-200",
                isTomorrow
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              )}
            >
              Tomorrow
            </Button>
          </div>
        </div>

        {/* Time Selector */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Time:</span>
          <div className="relative">
            <Input
              type="time"
              value={selectedTime}
              onChange={handleTimeChange}
              className="w-[120px] text-center font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* Selected Date/Time Display */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {formatDisplayDate(selectedDate)}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Departure time: {selectedTime}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
