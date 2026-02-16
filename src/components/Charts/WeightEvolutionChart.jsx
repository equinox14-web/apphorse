/**
 * Composant: WeightEvolutionChart
 * Affiche l'évolution du poids d'un cheval avec graphique interactif
 * Inclut: Trendline, target weight, BCS optionnel
 */

import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import useWeightData from '../../hooks/useWeightData';

const WeightEvolutionChart = ({ 
  userId, 
  horseId, 
  targetWeight = null,
  showBCS = false,
  showTrendline = true,
  compact = false 
}) => {
  const { chartData, stats, loading, error } = useWeightData(userId, horseId);
  const [dateRange, setDateRange] = useState('all'); // all, 30, 90

  /**
   * Filtrer les données selon la dates range sélectionnée
   */
  const filteredData = useMemo(() => {
    if (dateRange === 'all' || !chartData.length) return chartData;

    const daysToShow = dateRange === '30' ? 30 : 90;
    const cutoffTime = Date.now() - daysToShow * 24 * 60 * 60 * 1000;

    return chartData.filter((d) => d.timestamp >= cutoffTime);
  }, [chartData, dateRange]);

  /**
   * Calculer la trendline (lissée)
   */
  const trendlineData = useMemo(() => {
    if (!showTrendline || filteredData.length < 3) return filteredData;

    // Simple moving average (SMA 7)
    const windowSize = Math.min(7, Math.floor(filteredData.length / 3));
    return filteredData.map((point, index) => {
      const start = Math.max(0, index - windowSize);
      const end = index + 1;
      const window = filteredData.slice(start, end);
      const avgWeight =
        window.reduce((sum, p) => sum + p.weight, 0) / window.length;

      return {
        ...point,
        trend: Math.round(avgWeight * 10) / 10,
      };
    });
  }, [filteredData, showTrendline]);

  // Loading state
  if (loading && !chartData.length) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">📊 Chargement des données...</p>
      </div>
    );
  }

  // Error state
  if (error && !chartData.length) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
        <div className="text-center">
          <p className="text-red-700 font-medium">❌ Erreur chargement</p>
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!filteredData.length) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p className="text-gray-500">📊 Aucune donnée de pesée</p>
      </div>
    );
  }

  // Trend indicator
  const ShowsTrendIcon = () => {
    if (!stats) return null;
    const trend = stats.trend7days;
    if (trend > 0)
      return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (trend < 0)
      return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            📊 Évolution du Poids
            <ShowsTrendIcon />
          </h3>
          {stats && (
            <p className="text-sm text-gray-600">
              Moyenne: <span className="font-semibold">{stats.average} kg</span>
              {' '} • Min: <span className="font-semibold">{stats.min} kg</span>
              {' '} • Max: <span className="font-semibold">{stats.max} kg</span>
            </p>
          )}
        </div>

        {/* Date Range Buttons */}
        <div className="flex gap-2">
          {['30', '90', 'all'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1 text-sm rounded transition ${
                dateRange === range
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range === 'all' ? 'Tous' : `${range}j`}
            </button>
          ))}
        </div>
      </div>

      {/* Trend Info */}
      {stats && (
        <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-4'} gap-3 mb-4`}>
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-xs text-gray-600">Tendance 7j</p>
            <p className={`text-lg font-bold ${stats.trend7days > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {stats.trend7days > 0 ? '+' : ''}{stats.trend7days} kg
            </p>
          </div>

          {!compact && (
            <>
              <div className="bg-purple-50 p-3 rounded">
                <p className="text-xs text-gray-600">Tendance 30j</p>
                <p className={`text-lg font-bold ${stats.trend30days > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {stats.trend30days > 0 ? '+' : ''}{stats.trend30days} kg
                </p>
              </div>

              <div className="bg-yellow-50 p-3 rounded">
                <p className="text-xs text-gray-600">Variation</p>
                <p className="text-lg font-bold text-orange-600">±{stats.deviation} kg</p>
              </div>

              <div className="bg-green-50 p-3 rounded">
                <p className="text-xs text-gray-600">Enregistrements</p>
                <p className="text-lg font-bold text-green-600">{stats.count}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <ResponsiveContainer width="100%" height={compact ? 250 : 400}>
          <LineChart data={trendlineData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
              angle={filteredData.length > 30 ? -45 : 0}
              height={filteredData.length > 30 ? 80 : 40}
            />

            <YAxis
              label={{ value: 'Poids (kg)', angle: -90, position: 'insideLeft' }}
              domain={['dataMin - 5', 'dataMax + 5']}
              stroke="#9ca3af"
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '8px',
              }}
              formatter={(value, name) => {
                if (name === 'weight') return [value + ' kg', '📊 Poids'];
                if (name === 'bcs') return [value, '📏 BCS'];
                if (name === 'trend') return [value + ' kg', '📈 Tendance'];
                return [value, name];
              }}
              labelFormatter={(label) => `📅 ${label}`}
            />

            <Legend wrapperStyle={{ paddingTop: '16px' }} />

            {/* Target weight reference line */}
            {targetWeight && (
              <ReferenceLine
                y={targetWeight}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                label={{
                  value: `Cible: ${targetWeight} kg`,
                  position: 'right',
                  fill: '#f59e0b',
                  fontSize: 12,
                }}
              />
            )}

            {/* Main weight line */}
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#3b82f6"
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={true}
              name="Poids Actuel"
              strokeWidth={2}
            />

            {/* Trendline */}
            {showTrendline && (
              <Line
                type="monotone"
                dataKey="trend"
                stroke="#8b5cf6"
                strokeDasharray="5 5"
                dot={false}
                isAnimationActive={true}
                name="Tendance (SMA7)"
                strokeWidth={2}
              />
            )}

            {/* BCS if available */}
            {showBCS && (
              <Line
                type="monotone"
                yAxisId="right"
                dataKey="bcs"
                stroke="#10b981"
                dot={{ fill: '#10b981', r: 3 }}
                isAnimationActive={true}
                name="BCS"
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Last update info */}
      {stats?.lastMeasurement && (
        <p className="text-xs text-gray-500 mt-2 text-right">
          ℹ️ Dernière mesure:{' '}
          {new Date(stats.lastMeasurement.timestamp).toLocaleDateString('fr-FR')} (
          {stats.lastMeasurement.weight} kg)
        </p>
      )}

      {loading && (
        <div className="absolute top-2 right-2 text-xs text-blue-600 animate-pulse">
          🔄 Sync en cours...
        </div>
      )}
    </div>
  );
};

export default WeightEvolutionChart;
