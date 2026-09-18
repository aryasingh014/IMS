import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Star, CheckCircle2, ShieldCheck, Zap, User } from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

export const WeeklyReviewPage: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentRole, currentUser } = useApp();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.getPerformanceOverview();
      setReviews(res.performance || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-slate-500 p-6">Loading Performance Scorecard...</div>;
  }

  // Filter reviews for Intern and Team Lead roles
  const displayedReviews = currentRole === 'INTERN'
    ? reviews.filter((r) => r.name?.toLowerCase().includes('rahul') || r.email === currentUser.email)
    : currentRole === 'TEAM_LEAD'
    ? reviews.filter((r) => r.projectName === 'GLC AI Lead Intelligence' || r.projectLead?.toLowerCase().includes('vikram') || r.name === 'Rahul Kumar')
    : reviews;


  const myPerformance = displayedReviews[0] || {
    name: currentUser.name || 'Rahul Kumar',
    projectName: 'GLC AI Lead Intelligence',
    learningSpeed: 5,
    technicalAbility: 5,
    ownership: 5,
    workQuality: 5,
    consistency: 5,
    communication: 5,
    problemSolving: 5,
    ftPotential: 'HIGH',
    learningEvidence: 'Demonstrated stellar technical capability by building unit test coverage for OAuth endpoints and fixing WebSocket retry loops ahead of schedule.',
  };

  const metrics = [
    { label: 'Learning Speed', score: myPerformance.learningSpeed || 5, max: 5 },
    { label: 'Technical Ability', score: myPerformance.technicalAbility || 5, max: 5 },
    { label: 'Ownership & Initiative', score: myPerformance.ownership || 5, max: 5 },
    { label: 'Work Quality', score: myPerformance.workQuality || 5, max: 5 },
    { label: 'Consistency & Reliability', score: myPerformance.consistency || 5, max: 5 },
    { label: 'Communication', score: myPerformance.communication || 5, max: 5 },
    { label: 'Problem Solving', score: myPerformance.problemSolving || 5, max: 5 },
  ];

  const overallAvg = (metrics.reduce((acc, m) => acc + m.score, 0) / metrics.length).toFixed(1);

  if (currentRole === 'INTERN') {
    return (
      <div className="space-y-6 pb-10">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Weekly Performance Scorecard</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Your individual 7-axis evaluation ratings reviewed by Squad Lead Vikram Malhotra.
          </p>
        </div>

        {/* Overview Banner Card */}
        <div className="bg-gradient-to-r from-sky-600 to-indigo-600 text-white p-6 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center font-bold text-xl text-white">
              {myPerformance.name?.charAt(0)}
            </div>
            <div>
              <span className="bg-white/20 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Software Engineer Intern
              </span>
              <h3 className="text-2xl font-bold text-white mt-1">{myPerformance.name}</h3>
              <p className="text-xs text-sky-100">Project: <span className="font-semibold text-white">{myPerformance.projectName}</span></p>
            </div>
          </div>

          <div className="bg-white/10 border border-white/20 p-4 rounded-xl text-right space-y-1">
            <p className="text-[10px] font-bold text-sky-200 uppercase tracking-wider">Overall Score Rating</p>
            <div className="text-3xl font-extrabold text-white flex items-center justify-end gap-1">
              <span>{overallAvg}</span>
              <span className="text-amber-300 text-xl">⭐</span>
              <span className="text-xs font-normal text-sky-200">/ 5.0</span>
            </div>
            <span className="inline-block bg-emerald-400/30 text-emerald-100 text-[10px] px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
              FAST LEARNER & TOP PERFORMER
            </span>
          </div>
        </div>

        {/* 7 Core Performance Metrics */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">7 Core Indicator Breakdown</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Evaluated Weekly</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {metrics.map((m, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-800">
                  <span>{m.label}</span>
                  <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    {m.score} / {m.max} ⭐
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-sky-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(m.score / m.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FTE Evaluation Status & Lead Review Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
              <Award className="w-5 h-5 text-purple-600" /> FTE Conversion Potential Status
            </div>
            <div className="bg-white border border-purple-200 p-4 rounded-xl space-y-1">
              <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded uppercase">
                Status: Highly Recommended
              </span>
              <p className="text-xs font-bold text-slate-900 mt-2">Full-Time Software Engineer Track</p>
              <p className="text-xs text-slate-600 leading-relaxed">
                Consistently delivers high-quality production features, manages ticket state proactively, and communicates dependencies clearly.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Lead Review Notes & Feedback
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-xl text-xs text-slate-700 space-y-2">
              <p className="font-semibold text-slate-900">Evaluated by: Vikram Malhotra (Squad Lead)</p>
              <p className="text-slate-600 italic">"{myPerformance.learningEvidence || 'Demonstrated outstanding ownership on FastAPI integration and unit testing modules.'}"</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin / Team Lead View: Matrix of All Interns
  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Weekly Performance Matrix</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          7-axis evaluation scores (Learning Speed, Technical Ability, Ownership, Work Quality, Consistency, Communication, Problem Solving).
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
            <tr>
              <th className="p-4">Intern</th>
              <th className="p-4">Learning Speed</th>
              <th className="p-4">Technical Ability</th>
              <th className="p-4">Ownership</th>
              <th className="p-4">Consistency</th>
              <th className="p-4">Overall Score</th>
              <th className="p-4">Category</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedReviews.map((rev) => (
              <tr key={rev.id} className="hover:bg-slate-50">
                <td className="p-4">
                  <p className="font-bold text-slate-900">{rev.name}</p>
                  <p className="text-[10px] text-slate-500">{rev.projectName || 'GLC AI Lead Intelligence'}</p>
                </td>
                <td className="p-4 font-bold text-slate-800">{rev.learningSpeed}/5</td>
                <td className="p-4 font-bold text-slate-800">{rev.technicalAbility}/5</td>
                <td className="p-4 font-bold text-slate-800">{rev.ownership}/5</td>
                <td className="p-4 font-bold text-slate-800">{rev.consistency}/5</td>
                <td className="p-4">
                  <span className="font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
                    {Math.round((rev.learningSpeed + rev.technicalAbility + rev.ownership + rev.consistency) / 4 * 10) / 10}/5.0
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded border ${
                      rev.learningSpeed >= 4
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {rev.learningSpeed >= 4 ? 'Fast Learner' : 'Consistent'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
