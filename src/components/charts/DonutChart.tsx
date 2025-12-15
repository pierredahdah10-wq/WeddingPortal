import { motion } from 'framer-motion';

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  showCenterValue?: boolean;
  centerValue?: string;
  centerLabel?: string;
}

export function DonutChart({ 
  data, 
  size = 200, 
  showCenterValue = false,
  centerValue,
  centerLabel 
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -90; // Start from top

  const slices = data.map((item, index) => {
    const percentage = total > 0 ? item.value / total : 0;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    const largeArcFlag = angle > 180 ? 1 : 0;
    const radius = size / 2 - 15;
    const innerRadius = size / 3;
    const cx = size / 2;
    const cy = size / 2;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + angle) * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    const x3 = cx + innerRadius * Math.cos(endRad);
    const y3 = cy + innerRadius * Math.sin(endRad);
    const x4 = cx + innerRadius * Math.cos(startRad);
    const y4 = cy + innerRadius * Math.sin(startRad);

    const pathD = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;

    return {
      ...item,
      pathD,
      percentage,
      index,
      startAngle,
      angle,
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
        </svg>
        {showCenterValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-3xl font-bold text-foreground"
            >
              {centerValue}
            </motion.span>
            {centerLabel && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-xs text-muted-foreground mt-1"
              >
                {centerLabel}
              </motion.span>
            )}
          </div>
        )}
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

