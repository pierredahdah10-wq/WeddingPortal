import { motion } from 'framer-motion';

interface BarChartProps {
  data: { label: string; value: number }[];
  maxValue?: number;
  height?: number;
}

export function BarChart({ data, maxValue, height = 200 }: BarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex items-end gap-2 h-full" style={{ height }}>
      {data.map((item, index) => {
        const barHeight = (item.value / max) * 100;
        return (
          <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
            <motion.div
              className="w-full bg-primary/20 rounded-t-md relative overflow-hidden"
              initial={{ height: 0 }}
              animate={{ height: `${barHeight}%` }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
            >
              <motion.div
                className="absolute inset-0 gradient-primary rounded-t-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.3 }}
              />
              <motion.span
                className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-foreground"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.5 }}
              >
                {item.value}
              </motion.span>
            </motion.div>
            <span className="text-xs text-muted-foreground text-center truncate w-full">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
