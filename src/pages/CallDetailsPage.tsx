import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCallDetails } from '../api/client';
import { Call } from '../types';
import { ArrowLeft, PlayCircle, AlertCircle, Calendar, Clock, User, Mail, Award } from 'lucide-react';
import clsx from 'clsx';

export default function CallDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [call, setCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCall = async () => {
      if (!id) return;
      try {
        const data = await getCallDetails(parseInt(id, 10));
        setCall(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load call details');
      } finally {
        setLoading(false);
      }
    };
    fetchCall();
  }, [id]);

  if (loading) return <div className="flex justify-center py-12">Loading...</div>;
  if (error || !call) return <div className="text-red-500 py-12 text-center">{error || 'Call not found'}</div>;

  let utterances = [];
  if (call.transcript?.utterances_json) {
    try {
      if (typeof call.transcript.utterances_json === 'string') {
        utterances = JSON.parse(call.transcript.utterances_json);
      } else {
        utterances = call.transcript.utterances_json;
      }
    } catch (e) {
      console.error('Failed to parse utterances', e);
    }
  }

  const scores = call.score ? [
    { label: 'Needs Discovery', value: call.score.needs_discovery },
    { label: 'Product Knowledge', value: call.score.product_knowledge },
    { label: 'Rapport', value: call.score.rapport },
    { label: 'Empathy', value: call.score.empathy },
    { label: 'Objection Handling', value: call.score.objection_handling },
    { label: 'Compliance', value: call.score.compliance },
    { label: 'Closing', value: call.score.closing },
    { label: 'Trial Booking', value: call.score.trial_booking },
  ] : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/calls" className="p-2 text-gray-500 hover:text-gray-700 bg-white rounded-full border border-gray-200 shadow-sm transition-all duration-200 hover:shadow">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Call with {call.client_name || 'Unknown Client'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Call ID: #{call.id} • Registered under Operator: {call.advisor?.name || `ID: ${call.advisor_id}`}
          </p>
        </div>
        <span className={clsx(
          "px-3 py-1 rounded-full text-xs font-semibold tracking-wide ml-auto border",
          call.status === 'COMPLETED' ? "bg-green-50 text-green-700 border-green-200" :
          call.status === 'FAILED' ? "bg-red-50 text-red-700 border-red-200" :
          "bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse"
        )}>
          {call.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Transcript & Audio */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-5 shadow rounded-lg border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-blue-500" /> Audio Player
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex items-center justify-center">
              {call.audio_url ? (
                <audio 
                  src={`/api/${call.audio_url}`} 
                  controls 
                  className="w-full focus:outline-none"
                />
              ) : (
                <div className="text-gray-500 text-sm font-medium py-2">
                  No audio recording available for this call.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white shadow rounded-lg border border-gray-100 flex flex-col h-[600px]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Transcript</h2>
              <span className="text-xs font-mono text-gray-400">Diarization Active (2 Speakers)</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30 font-sans">
              {utterances.length > 0 ? (
                utterances.map((u: any, idx: number) => {
                  const isAgent = u.speaker === 'SPEAKER_1';
                  return (
                    <div key={idx} className={clsx("flex flex-col", isAgent ? "items-start" : "items-end")}>
                      <span className="text-2xs text-gray-400 mb-1 font-medium px-1">
                        {isAgent ? call.advisor?.name || 'Advisor' : call.client_name || 'Client'} • {u.start}
                      </span>
                      <div className={clsx(
                        "px-4 py-2 rounded-2xl max-w-[85%] text-sm shadow-sm border leading-relaxed",
                        isAgent 
                          ? "bg-blue-50 text-blue-900 border-blue-100 rounded-tl-none" 
                          : "bg-white text-gray-900 border-gray-200 rounded-tr-none"
                      )}>
                        {u.text}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-gray-500 text-center py-16 font-medium">
                  {call.status === 'COMPLETED' ? 'No transcript available.' : 'Transcript processing...'}
                </div>
              )}
            </div>
          </div>

          {/* AI Performance Evaluation Card */}
          {call.score && (
            <div className="bg-white p-5 shadow rounded-lg border border-gray-100 space-y-4">
              <h2 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-500" /> AI Performance Evaluation
              </h2>
              <div className="prose prose-blue max-w-none text-sm text-gray-600 space-y-2">
                <p className="font-medium text-gray-800">
                  {call.score.overall_score >= 8.0 
                    ? "🌟 Excellent performance. The advisor demonstrated outstanding sales fundamentals." 
                    : call.score.overall_score >= 5.0 
                    ? "📈 Satisfactory performance with clear pathways for development." 
                    : "⚠️ Performance requires immediate coaching and intervention."}
                </p>
                <p className="leading-relaxed">
                  Based on sales script compliance and conversational pattern analysis, the advisor completed the call with an overall quality score of <span className="font-bold text-blue-600">{Number(call.score.overall_score).toFixed(1)}/10.0</span>. 
                  {call.score.compliance >= 8.0 ? " Compliance protocols were adhered to flawlessly throughout the interaction." : " Attention is required to align with regulatory or internal compliance mandates."}
                  {call.score.rapport >= 7.0 ? " Rapport building and conversational empathy was well established." : " Conversational tone could be improved to foster a warmer customer relationship."}
                </p>
                {call.issues && call.issues.length > 0 ? (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Key Actionable Insights</h4>
                    <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
                      {call.issues.slice(0, 3).map((issue, idx) => (
                        <li key={idx}>
                          <span className="font-semibold text-gray-800">{issue.type}: </span>
                          {issue.recommendation || issue.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-green-700 bg-green-50/50 p-2.5 rounded border border-green-100/50">
                    🏆 <span className="font-semibold">Coaching Note:</span> No critical issues found. The advisor effectively managed the flow of conversation.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Scores, Issues & Metadata */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-white p-5 shadow rounded-lg border border-gray-100 space-y-4">
            <h2 className="text-lg font-medium text-gray-900 border-b border-gray-100 pb-2 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" /> Call Metadata
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-700">Client:</span>
                <span className="text-gray-900 ml-auto font-semibold">{call.client_name || 'Unidentified Client'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-700">Advisor:</span>
                <span className="text-gray-900 ml-auto font-semibold">{call.advisor?.name || `ID: ${call.advisor_id}`}</span>
              </div>
              {call.advisor?.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-700">Advisor Email:</span>
                  <span className="text-gray-900 ml-auto text-xs font-mono">{call.advisor.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-700">Upload Date:</span>
                <span className="text-gray-900 ml-auto font-semibold">
                  {new Date(call.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-700">Duration:</span>
                <span className="text-gray-900 ml-auto font-semibold">
                  {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` : '0s'}
                </span>
              </div>
            </div>
          </div>

          {/* Scores Breakdown Card */}
          <div className="bg-white p-5 shadow rounded-lg border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
              <span>Overall Score</span>
              <span className="text-xs text-gray-400 font-mono">Weighted Quality Index</span>
            </h2>
            <div className="flex items-center justify-center py-4 border-b border-gray-100 mb-4">
              <div className="relative h-32 w-32 flex flex-col items-center justify-center rounded-full border-8 border-blue-50 bg-blue-50/10 shadow-inner">
                <span className="text-4xl font-extrabold text-blue-600 leading-none">
                  {call.score?.overall_score !== undefined ? Number(call.score.overall_score).toFixed(1) : '0.0'}
                </span>
                <span className="text-xs text-gray-400 font-medium tracking-wide mt-1">/ 10.0</span>
              </div>
            </div>
            
            <div className="mt-4 space-y-3.5">
              {scores.map((s, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 font-medium">{s.label}</span>
                    <span className="font-bold text-gray-900">{Number(s.value).toFixed(1)}/10</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 border border-gray-200/40">
                    <div 
                      className={clsx("h-1.5 rounded-full transition-all duration-500", s.value >= 8 ? "bg-green-500" : s.value >= 5 ? "bg-yellow-500" : "bg-red-500")} 
                      style={{ width: `${(s.value / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Identified Issues Card */}
          <div className="bg-white p-5 shadow rounded-lg border border-gray-100">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" /> Identified Issues
            </h2>
            <div className="space-y-4">
              {call.issues && call.issues.length > 0 ? (
                call.issues.map((issue) => (
                  <div key={issue.id} className={clsx(
                    "p-4 border rounded-lg space-y-2.5 transition-all duration-200 hover:shadow-sm",
                    issue.severity === 'CRITICAL' || issue.severity === 'HIGH' 
                      ? "bg-red-50/60 border-red-100" 
                      : "bg-amber-50/40 border-amber-100"
                  )}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-sm font-bold text-gray-900">{issue.type}</h4>
                      <span className={clsx(
                        "px-2 py-0.5 text-3xs font-bold uppercase rounded border tracking-widest",
                        issue.severity === 'CRITICAL' ? "bg-red-200 text-red-800 border-red-300" :
                        issue.severity === 'HIGH' ? "bg-orange-100 text-orange-800 border-orange-200" :
                        issue.severity === 'MEDIUM' ? "bg-amber-100 text-amber-800 border-amber-200" :
                        "bg-blue-100 text-blue-800 border-blue-200"
                      )}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 font-normal leading-relaxed">{issue.reason}</p>
                    
                    {issue.transcript_quote && (
                      <div className="pl-3 border-l-2 border-gray-300 py-1 my-2 bg-gray-50/60 rounded-r">
                        <p className="text-xs italic text-gray-500 font-serif">"{issue.transcript_quote}"</p>
                      </div>
                    )}

                    {issue.recommendation && (
                      <div className="text-xs text-blue-800 bg-blue-50/60 p-2.5 rounded border border-blue-100/50 leading-relaxed">
                        <strong className="font-semibold">AI Recommendation: </strong>{issue.recommendation}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-3xs font-mono text-gray-400 border-t border-gray-100/50 pt-1.5 mt-2">
                      {issue.timestamp && <span>Timestamp: {issue.timestamp}</span>}
                      {issue.confidence && <span>AI Confidence: {Math.round(issue.confidence * 100)}%</span>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 py-4 text-center">No compliance or performance issues flagged in this call.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
