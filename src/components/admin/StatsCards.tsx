import { motion } from 'framer-motion'

interface Stat {
  label: string
  value: string | number
  icon: React.ReactNode
  color: 'indigo' | 'amber' | 'green' | 'red' | 'gray' | 'violet'
  sub?: string
}

const colorMap = {
  indigo: { bg: 'bg-indigo-50/80', icon: 'text-indigo-600', border: 'border-indigo-100/50', val: 'text-slate-900' },
  amber:  { bg: 'bg-amber-50/80',  icon: 'text-amber-600',  border: 'border-amber-100/50',  val: 'text-slate-900'  },
  green:  { bg: 'bg-emerald-50/80', icon: 'text-emerald-600', border: 'border-emerald-100/50', val: 'text-slate-900'  },
  red:    { bg: 'bg-red-50/80',    icon: 'text-red-600',    border: 'border-red-100/50',    val: 'text-slate-900'    },
  gray:   { bg: 'bg-slate-50/80',  icon: 'text-slate-500',  border: 'border-slate-200/50',  val: 'text-slate-900'   },
  violet: { bg: 'bg-violet-50/80', icon: 'text-violet-600', border: 'border-violet-100/50', val: 'text-slate-900' },
}

export default function StatsCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((stat, i) => {
        const c = colorMap[stat.color]
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`p-5 rounded-2xl border ${c.border} bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group`}
          >
            {/* Subtle background decoration */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${c.bg} opacity-20 group-hover:scale-150 transition-transform duration-500`} />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.icon} flex items-center justify-center shadow-sm`}>
                  {stat.icon}
                </div>
                <span className="text-sm font-semibold text-slate-500">{stat.label}</span>
              </div>
              <div>
                <div className={`text-3xl font-bold tracking-tight ${c.val}`}>{stat.value}</div>
                {stat.sub && <div className="text-xs font-medium text-slate-400 mt-1">{stat.sub}</div>}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
