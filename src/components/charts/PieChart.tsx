import { motion } from 'framer-motion';

interface PieChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

export function PieChart({ data, size = 160 }: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90; // Start from top for consistency

  const slices = data.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    const largeArcFlag = angle > 180 ? 1 : 0;
    const radius = size / 2 - 10;
    const cx = size / 2;
    const cy = size / 2;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (startAngle + angle - 90) * (Math.PI / 180);

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    return {
      ...item,
      pathD,
      percentage,
      index,
    };
  });

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="relative">
        <svg width={size} height={size} className="overflow-visible">
          {slices.map((slice) => (
            <motion.path
              key={slice.label}
              d={slice.pathD}
              fill={slice.color}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: slice.index * 0.1 }}
              className="hover:opacity-90 transition-opacity cursor-pointer"
            />
          ))}
          {/* Center circle for donut effect */}
          <circle cx={size / 2} cy={size / 2} r={size / 4} fill="hsl(var(--card))" />
        </svg>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
        {slices.map((slice) => (
          <motion.div
            key={slice.label}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: slice.index * 0.1 + 0.3 }}
          >
            <div
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: slice.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{slice.label}</p>
              <p className="text-xs text-muted-foreground">{slice.value} ({slice.percentage > 0 ? (slice.percentage * 100).toFixed(1) : 0}%)</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
