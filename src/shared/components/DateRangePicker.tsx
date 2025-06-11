import { forwardRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';
import "react-datepicker/dist/react-datepicker.css";

registerLocale('es', es);

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onChange: (start?: Date, end?: Date) => void;
  placeholderText?: string;
  className?: string;
}

export const DateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(
  ({ startDate, endDate, onChange, placeholderText = "Seleccionar fechas", className = "" }, ref) => {
    return (
      <div ref={ref} className={className}>
        <DatePicker
          selectsRange={true}
          startDate={startDate}
          endDate={endDate}
          onChange={(dates) => {
            const [start, end] = dates;
            onChange(start || undefined, end || undefined);
          }}
          placeholderText={placeholderText}
          locale="es"
          dateFormat="dd/MM/yyyy"
          className="w-full px-4 py-2 border border-input-border dark:border-input-border bg-input-bg dark:bg-input-bg rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          isClearable
        />
      </div>
    );
  }
); 