import { useEffect, useState } from 'react';
import { getCalls, getAdvisors, getCallDetails } from '../api/client';
import { Call, Advisor } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { PhoneCall, CheckCircle, AlertTriangle, Activity, RefreshCw, BarChart2, TrendingUp, Users } from 'lucide-react';
import clsx from 'clsx';

export default function AnalyticsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchAnalyticsData = async (isSync = false) => {
    if (isSync) {
      setSyncing(true);
    } else {
      setLoading(true);
    }
    try {
      const [callsData, advisorsData] = await Promise.all([
        getCalls(),
        getAdvisors()
      ]);

      // Resolve detailed records for each call to gather their real scores and issues
      const detailedCalls = await Promise.all(
        callsData.map(async (call) => {
          try {
            return await getCallDetails(call.id);
          } catch (e) {
            return call;
          }
        })
      );

      setCalls(detailedCalls);
      setAdvisors(advisorsData);
    } catch (error) {
      console.error('Failed to fetch analytics data', error);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-sm font-medium text-gray-500">Compiling real-time business intelligence...</p>
      </div>
    );
  }

  // Filter completed calls with valid score metrics
  const completedCalls = calls.filter(c => c.status === 'COMPLETED');
  const completedWithScore = completedCalls.filter(c => c.score?.overall_score !== undefined);

  // Summary Metrics
  const totalCalls = calls.length;
  const completedCount = completedCalls.length;
  const failedCount = calls.filter(c => c.status === 'FAILED').length;
  const processingCount = calls.filter(c => c.status === 'PROCESSING' || c.status === 'PENDING').length;
  
  const totalIssuesCount = calls.reduce((sum, c) => sum + (c.issues?.length || 0), 0);

  const averageOverallScore = completedWithScore.length > 0
    ? completedWithScore.reduce((sum, c) => sum + (c.score?.overall_score || 0), 0) / completedWithScore.length
    : 0;

  // 1. Score Distribution Buckets (0-2, 3-4, 5-6, 7-8, 9-10)
  const scoreDistribution = [
    { range: '0-2', count: 0 },
    { range: '3-4', count: 0 },
    { range: '5-6', count: 0 },
    { range: '7-8', count: 0 },
    { range: '9-10', count: 0 },
  ];

  completedWithScore.forEach(c => {
    const score = c.score?.overall_score || 0;
    if (score <= 2) scoreDistribution[0].count++;
    else if (score <= 4) scoreDistribution[1].count++;
    else if (score <= 6) scoreDistribution[2].count++;
    else if (score <= 8) scoreDistribution[3].count++;
    else scoreDistribution[4].count++;
  });

  // 2. Issue Tag Frequencies
  const issueCounts: { [key: string]: number } = {};
  calls.forEach(c => {
    if (c.issues) {
      c.issues.forEach(issue => {
        const type = issue.type || 'Other Compliance Issue';
        issueCounts[type] = (issueCounts[type] || 0) + 1;
      });
    }
  });

  const issueCategoriesData = Object.entries(issueCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const PIE_COLORS = ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6'];

  // 3. Average Skill Scores (Sub-categories)
  const skillKeys = [
    { key: 'needs_discovery', label: 'Needs Discovery' },
    { key: 'product_knowledge', label: 'Product Knowledge' },
    { key: 'rapport', label: 'Rapport' },
    { key: 'empathy', label: 'Empathy' },
    { key: 'objection_handling', label: 'Objection Handling' },
    { key: 'compliance', label: 'Compliance' },
    { key: 'closing', label: 'Closing' },
    { key: 'trial_booking', label: 'Trial Booking' },
  ];

  const skillScoresData = skillKeys.map(skill => {
    const scoredCalls = completedWithScore.filter(c => c.score && (c.score as any)[skill.key] !== undefined);
    const avg = scoredCalls.length > 0
      ? scoredCalls.reduce((sum, c) => sum + Number((c.score as any)[skill.key] || 0), 0) / scoredCalls.length
      : 0;
    return {
      skill: skill.label,
      score: Number(avg.toFixed(1)),
    };
  });

  // 4. Weekly Trend (Mon - Sun)
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weeklyTrendsMap = daysOfWeek.map(day => ({
    day,
    Completed: 0,
    Failed: 0,
    Processing: 0,
  }));

  calls.forEach(c => {
    if (c.created_at) {
      const dayIndex = new Date(c.created_at).getDay();
      const dayName = daysOfWeek[dayIndex];
      const trendObj = weeklyTrendsMap.find(t => t.day === dayName);
      if (trendObj) {
        if (c.status === 'COMPLETED') trendObj.Completed++;
        else if (c.status === 'FAILED') trendObj.Failed++;
        else trendObj.Processing++;
      }
    }
  });

  const weeklyTrendsData = [
    weeklyTrendsMap[1], // Mon
    weeklyTrendsMap[2], // Tue
    weeklyTrendsMap[3], // Wed
    weeklyTrendsMap[4], // Thu
    weeklyTrendsMap[5], // Fri
    weeklyTrendsMap[6], // Sat
    weeklyTrendsMap[0], // Sun
  ];

  // 5. Advisor Quality Leaderboard
  const advisorStatsMap: { [key: number]: { name: string; total: number; completed: number; scoreSum: number } } = {};

  advisors.forEach(a => {
    advisorStatsMap[a.id] = { name: a.name, total: 0, completed: 0, scoreSum: 0 };
  });

  calls.forEach(c => {
    const advId = c.advisor_id;
    if (!advisorStatsMap[advId]) {
      advisorStatsMap[advId] = { name: c.advisor?.name || `Operator ID: ${advId}`, total: 0, completed: 0, scoreSum: 0 };
    }
    advisorStatsMap[advId].total++;
    if (c.status === 'COMPLETED') {
      advisorStatsMap[advId].completed++;
      if (c.score?.overall_score !== undefined) {
        advisorStatsMap[advId].scoreSum += c.score.overall_score;
      }
    }
  });

  const advisorLeaderboardData = Object.entries(advisorStatsMap)
    .map(([id, data]) => {
      const avg = data.completed > 0 ? Number((data.scoreSum / data.completed).toFixed(1)) : 0;
      return {
        id: Number(id),
        name: data.name,
        total: data.total,
        completed: data.completed,
        averageScore: avg,
      };
    })
    .sort((a, b) => b.averageScore - a.averageScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time compliance audit results & operator efficiency scorecards
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => fetchAnalyticsData(true)}
            disabled={syncing}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={clsx("h-4 w-4 mr-2 text-gray-400", syncing && "animate-spin")} />
            {syncing ? 'Syncing...' : 'Re-sync'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <PhoneCall className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xs font-bold text-gray-400 uppercase tracking-wider">Total Calls Processed</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{totalCalls}</h3>
            <p className="text-xs text-gray-500 mt-1">
              <span className="font-semibold text-blue-600">{processingCount}</span> in progress
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xs font-bold text-gray-400 uppercase tracking-wider">Evaluation Completed</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{completedCount}</h3>
            <p className="text-xs text-gray-500 mt-1">
              <span className="font-semibold text-green-600">
                {totalCalls > 0 ? Math.round((completedCount / totalCalls) * 100) : 0}%
              </span> success rate
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xs font-bold text-gray-400 uppercase tracking-wider">Identified Risk Alerts</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{totalIssuesCount}</h3>
            <p className="text-xs text-red-500 mt-1 font-medium">
              Requires training attention
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xs font-bold text-gray-400 uppercase tracking-wider">Average Quality Score</p>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">
              {averageOverallScore > 0 ? `${averageOverallScore.toFixed(1)}/10` : '-'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Weighted global benchmark
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution Chart */}
        <div className="bg-white p-6 shadow rounded-lg border border-gray-100 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-blue-500" /> Overall Quality Distribution
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 mb-6">Distribution bucket of audited interaction scores</p>
          </div>
          <div className="h-72">
            {completedWithScore.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} />
                  <RechartsTooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontFamily: 'sans-serif', fontSize: '12px'}} />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-400 font-medium bg-gray-50/50 rounded border border-dashed">
                No completed scores registered yet.
              </div>
            )}
          </div>
        </div>

        {/* Issue Categories Chart */}
        <div className="bg-white p-6 shadow rounded-lg border border-gray-100 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" /> Compliance & Performance Flags
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 mb-6">Aggregate count of advisor violations or misses</p>
          </div>
          {issueCategoriesData.length > 0 ? (
            <div className="h-72 flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="w-full sm:w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={issueCategoriesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {issueCategoriesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px'}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="w-full sm:w-1/2 flex flex-col gap-2.5 max-h-full overflow-y-auto pr-1">
                {issueCategoriesData.slice(0, 6).map((entry, index) => (
                  <div key={index} className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></div>
                      <span className="truncate font-medium">{entry.name}</span>
                    </div>
                    <span className="font-bold text-gray-900 shrink-0 bg-gray-100 px-1.5 py-0.5 rounded text-2xs">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-sm text-gray-400 font-medium bg-gray-50/50 rounded border border-dashed">
              No flagged compliance warnings recorded.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skill Scores Horizontal Bars */}
        <div className="bg-white p-6 shadow rounded-lg border border-gray-100 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-500" /> Skill Competencies Breakdown
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 mb-6">Average score per audited communication dimension</p>
          </div>
          <div className="h-72">
            {completedWithScore.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skillScoresData} layout="vertical" margin={{ top: 5, right: 10, left: 15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis type="number" domain={[0, 10]} axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 10}} />
                  <YAxis dataKey="skill" type="category" axisLine={false} tickLine={false} tick={{fill: '#374151', fontSize: 10, fontWeight: 500}} width={120} />
                  <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px'}} />
                  <Bar dataKey="score" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-400 font-medium bg-gray-50/50 rounded border border-dashed">
                No competency scores populated.
              </div>
            )}
          </div>
        </div>

        {/* Weekly Trend of Statuses */}
        <div className="bg-white p-6 shadow rounded-lg border border-gray-100 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" /> Weekly Activity Trend
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 mb-6">Trend of processed calls grouped by calendar week day</p>
          </div>
          <div className="h-72">
            {calls.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrendsData} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} />
                  <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '11px'}} />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '11px', paddingTop: '10px'}} />
                  <Line type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Failed" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Processing" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-400 font-medium bg-gray-50/50 rounded border border-dashed">
                No recorded transmissions during this week.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="bg-white shadow rounded-lg border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Operator Quality Leaderboard</h2>
            <p className="text-xs text-gray-400 mt-0.5">Ranked by average evaluated overall score of completed audits</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Advisor Name</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Uploads</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Audits Completed</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Average Quality Score</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {advisorLeaderboardData.length > 0 ? (
                advisorLeaderboardData.map((adv, idx) => (
                  <tr key={adv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-500">
                      #{idx + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {adv.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                      {adv.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                      {adv.completed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={clsx(
                        "inline-flex items-center px-2.5 py-1 rounded-md text-sm font-bold",
                        adv.averageScore >= 8.0 ? "bg-green-50 text-green-700" :
                        adv.averageScore >= 5.0 ? "bg-yellow-50 text-yellow-700" :
                        adv.completed === 0 ? "bg-gray-100 text-gray-400 font-normal text-xs" :
                        "bg-red-50 text-red-700"
                      )}>
                        {adv.completed > 0 ? `${adv.averageScore.toFixed(1)} / 10.0` : 'No Audited Calls'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500 font-medium">
                    No active operators or advisors registered in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
