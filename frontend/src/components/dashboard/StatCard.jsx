import React from 'react';
import { Card } from '../common/Card';

export function StatCard({ title, value, icon: Icon, color, bgColor, badge }) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border border-slate-200/80">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-500">
            {title}
          </span>
          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${color} flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </div>
          {badge && (
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${bgColor}`}>
              {badge}
            </span>
          )}
        </div>
      </div>
      <div className={`h-1.5 w-full bg-gradient-to-r ${color}`} />
    </Card>
  );
}
