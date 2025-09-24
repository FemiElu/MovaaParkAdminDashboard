"use client";

import React, { useState } from "react"; // useMemo not used
import { Calendar, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RecurrencePattern } from "@/types";

interface RecurrenceEditorProps {
  pattern?: RecurrencePattern;
  onChange: (pattern: RecurrencePattern | undefined) => void;
  startDate: string;
}

export function RecurrenceEditor({
  pattern,
  onChange,
  startDate,
}: RecurrenceEditorProps) {
  const [showExceptions, setShowExceptions] = useState(false);
  const [newException, setNewException] = useState("");

  const recurrencePattern = pattern || {
    type: "daily",
    exceptions: [],
  };

  const updatePattern = (updates: Partial<RecurrencePattern>) => {
    onChange({
      ...recurrencePattern,
      ...updates,
    });
  };

  const generatePreview = (): string[] => {
    if (!recurrencePattern || !startDate) return [];

    const previewDates: string[] = [];
    const start = new Date(startDate);
    const endDate = recurrencePattern.endDate
      ? new Date(recurrencePattern.endDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days for preview

    const currentDate = new Date(start);
    currentDate.setDate(currentDate.getDate() + 1); // Start from next day for preview

    while (currentDate <= endDate && previewDates.length < 7) {
      const dateStr = currentDate.toISOString().split("T")[0];

      if (recurrencePattern.exceptions?.includes(dateStr)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      if (shouldIncludeDate(currentDate, recurrencePattern)) {
        previewDates.push(dateStr);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return previewDates;
  };

  const shouldIncludeDate = (
    date: Date,
    pattern: RecurrencePattern
  ): boolean => {
    const dayOfWeek = date.getDay();

    switch (pattern.type) {
      case "daily":
        return true;
      case "weekdays":
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      case "custom":
        return pattern.daysOfWeek?.includes(dayOfWeek) || false;
      default:
        return false;
    }
  };

  const addException = () => {
    if (!newException || recurrencePattern.exceptions?.includes(newException)) {
      return;
    }

    const updatedExceptions = [
      ...(recurrencePattern.exceptions || []),
      newException,
    ];
    updatePattern({ exceptions: updatedExceptions });
    setNewException("");
  };

  const removeException = (dateToRemove: string) => {
    const updatedExceptions =
      recurrencePattern.exceptions?.filter((date) => date !== dateToRemove) ||
      [];
    updatePattern({ exceptions: updatedExceptions });
  };

  const previewDates = generatePreview();

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Recurrence Pattern</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(undefined)}
          className="text-red-600 border-red-200 hover:bg-red-50"
        >
          <X className="w-4 h-4 mr-1" />
          Remove Recurrence
        </Button>
      </div>

      {/* Recurrence Type */}
      <div>
        <Label>Repeat</Label>
        <Select
          value={recurrencePattern.type}
          onValueChange={(value) =>
            updatePattern({ type: value as "daily" | "weekdays" | "custom" })
          }
        >
          <option value="daily">Daily</option>
          <option value="weekdays">Weekdays (Mon-Fri)</option>
          <option value="custom">Custom</option>
        </Select>
      </div>

      {/* Custom Days of Week */}
      {recurrencePattern.type === "custom" && (
        <div>
          <Label>Days of Week</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
              (day, index) => (
                <label key={day} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={
                      recurrencePattern.daysOfWeek?.includes(index) || false
                    }
                    onChange={(e) => {
                      const days = recurrencePattern.daysOfWeek || [];
                      const newDays = e.target.checked
                        ? [...days, index]
                        : days.filter((d) => d !== index);
                      updatePattern({ daysOfWeek: newDays });
                    }}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <span className="text-sm">{day}</span>
                </label>
              )
            )}
          </div>
        </div>
      )}

      {/* End Date */}
      <div>
        <Label htmlFor="endDate">End Date (Optional)</Label>
        <Input
          id="endDate"
          type="date"
          value={recurrencePattern.endDate || ""}
          onChange={(e) => updatePattern({ endDate: e.target.value })}
        />
        <p className="text-sm text-gray-500 mt-1">
          Leave empty for indefinite recurrence (trips generated up to 90 days
          ahead)
        </p>
      </div>

      {/* Exceptions */}
      <div>
        <div className="flex items-center justify-between">
          <Label>Exceptions (Blackout Dates)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowExceptions(!showExceptions)}
          >
            {showExceptions ? "Hide" : "Show"} Exceptions
          </Button>
        </div>

        {showExceptions && (
          <div className="mt-2 space-y-2">
            <div className="flex gap-2">
              <Input
                type="date"
                value={newException}
                onChange={(e) => setNewException(e.target.value)}
                placeholder="Select date to exclude"
                min={startDate}
              />
              <Button
                type="button"
                onClick={addException}
                disabled={!newException}
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {recurrencePattern.exceptions &&
              recurrencePattern.exceptions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {recurrencePattern.exceptions.map((date) => (
                    <Badge
                      key={date}
                      variant="secondary"
                      className="bg-red-100 text-red-800 border-red-200"
                    >
                      {new Date(date).toLocaleDateString()}
                      <button
                        type="button"
                        onClick={() => removeException(date)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
          </div>
        )}
      </div>

      {/* Preview */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="w-4 h-4 text-gray-600" />
          <Label>Preview (Next 7 occurrences)</Label>
        </div>

        {previewDates.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {previewDates.map((date) => (
              <div
                key={date}
                className="flex items-center justify-center p-2 bg-green-50 border border-green-200 rounded-md"
              >
                <span className="text-sm font-medium text-green-800">
                  {new Date(date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              No occurrences found in preview period. Check your recurrence
              settings.
            </p>
          </div>
        )}

        <p className="text-xs text-gray-500 mt-2">
          Recurring trips will be generated up to 90 days ahead and extended
          automatically
        </p>
      </div>
    </div>
  );
}
