import { useEffect, useState, useRef, FormEvent } from 'react';
import { getCalls, getAdvisors, uploadCall, getCallDetails } from '../api/client';
import { Call, Advisor } from '../types';
import { Activity, PhoneCall, AlertTriangle, CheckCircle, Upload, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import clsx from 'clsx';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [clientName, setClientName] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState<number | ''>('');
  const [file, setFile] = useState<File | null>(null);

  const fetchCalls = async () => {
    try {
      const [callsData, advisorsData] = await Promise.all([getCalls(), getAdvisors()]);
      
      const fullCallsData = await Promise.all(
        callsData.map(async (call) => {
          try {
            return await getCallDetails(call.id);
          } catch (e) {
            return call;
          }
        })
      );
      
      setCalls(fullCallsData);
      setAdvisors(advisorsData);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !selectedAdvisor) return;
    
    setUploading(true);
    try {
      await uploadCall(Number(selectedAdvisor), clientName, file);
      setIsUploadModalOpen(false);
      setFile(null);
      setClientName('');
      setSelectedAdvisor('');
      await fetchCalls();
    } catch (error) {
      console.error('Failed to upload file', error);
      alert('Failed to upload call. Check console for details.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center">Loading dashboard...</div>;
  }


  const totalCalls = calls.length;
  const completedCalls = calls.filter(c => c.status === 'COMPLETED');
  const avgScore = completedCalls.length 
    ? completedCalls.reduce((acc, c) => acc + (c.score?.overall_score || 0), 0) / completedCalls.length 
    : 0;

  const pendingCalls = calls.filter(c => c.status === 'PENDING' || c.status === 'PROCESSING').length;
  
  const callsByDay = [0, 0, 0, 0, 0, 0, 0];
  calls.forEach(call => {
    if (call.created_at) {
      const day = new Date(call.created_at).getDay();
      callsByDay[day]++;
    }
  });

  const chartData = [
    { name: 'Mon', calls: callsByDay[1] },
    { name: 'Tue', calls: callsByDay[2] },
    { name: 'Wed', calls: callsByDay[3] },
    { name: 'Thu', calls: callsByDay[4] },
    { name: 'Fri', calls: callsByDay[5] },
    { name: 'Sat', calls: callsByDay[6] },
    { name: 'Sun', calls: callsByDay[0] },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Upload className="h-4 w-4 mr-2" /> Upload Call
          </button>
        </div>
      </div>

      {isUploadModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    {/* Background */}
    <div
      className="absolute inset-0 bg-black/50"
      onClick={() => setIsUploadModalOpen(false)}
    />

    {/* Modal */}
    <div className="relative z-10 w-full max-w-lg rounded-xl bg-white shadow-2xl mx-4">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Upload New Call
        </h3>

        <button
          onClick={() => setIsUploadModalOpen(false)}
          className="rounded p-1 hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleUpload} className="p-6 space-y-5">

        <div>
          <label className="block text-sm font-medium mb-2">
            Client Name
          </label>

          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            placeholder="Enter client name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Advisor
          </label>

          <select
            value={selectedAdvisor}
            onChange={(e) => setSelectedAdvisor(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
            required
          >
            <option value="">Select Advisor</option>

            {advisors.map((advisor) => (
              <option key={advisor.id} value={advisor.id}>
                {advisor.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Audio File
          </label>

          <input
            type="file"
            accept=".mp3,.wav,.m4a"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full rounded-lg border border-gray-300 p-2"
            required
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">

          <button
            type="button"
            onClick={() => setIsUploadModalOpen(false)}
            className="rounded-lg border px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={uploading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>

        </div>

      </form>
    </div>
  </div>
)}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI Cards */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <PhoneCall className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Calls</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{totalCalls}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Average Score</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{avgScore.toFixed(1)}/10</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{completedCalls.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-amber-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Processing/Pending</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{pendingCalls}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 shadow rounded-lg border border-gray-100">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Weekly Call Volume</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280'}} />
                <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="calls" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 shadow rounded-lg border border-gray-100">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Calls</h2>
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {calls.slice(0, 4).map((call) => (
                <li key={call.id} className="py-4 flex items-center justify-between">
                  <div className="flex flex-col">
                    <Link to={`/calls/${call.id}`} className="text-sm font-medium text-blue-600 hover:underline">{call.client_name || 'Unknown Client'}</Link>
                    <p className="text-sm text-gray-500">{new Date(call.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center">
                    <span className={clsx(
                      "px-2.5 py-0.5 rounded-full text-xs font-medium",
                      call.status === 'COMPLETED' ? "bg-green-100 text-green-800" :
                      call.status === 'FAILED' ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    )}>
                      {call.status}
                    </span>
                  </div>
                </li>
              ))}
              {calls.length === 0 && (
                <li className="py-4 text-sm text-gray-500 text-center">No calls found.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
