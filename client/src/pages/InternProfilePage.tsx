import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Briefcase, Award, Save, Upload, FileText, Plus, X, ExternalLink, CheckCircle2, Camera, Image } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const InternProfilePage: React.FC = () => {
  const { currentUser, updateCurrentUser, showToast } = useApp();

  // Fixed fields (from registration)
  const fixedName = currentUser.name || 'Rahul Kumar';
  const fixedEmail = currentUser.email || 'rahul.kumar@company.com';

  // Editable fields
  const [avatar, setAvatar] = useState(
    currentUser.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
  );
  const [phone, setPhone] = useState('+91 98765 43210');
  const [githubUrl, setGithubUrl] = useState('https://github.com/rahulkumar');
  const [linkedinUrl, setLinkedinUrl] = useState('https://linkedin.com/in/rahulkumar');
  const [bio, setBio] = useState(
    'Passionate Full-Stack Intern working on Email Automation Engine & Node.js backend integrations.'
  );

  // Resume Document State
  const [resumeFileName, setResumeFileName] = useState('Rahul_Kumar_Resume_2026.pdf');
  const [resumeUrl, setResumeUrl] = useState('https://example.com/resumes/rahulkumar.pdf');

  // Primary Skills Tag State
  const [skills, setSkills] = useState<string[]>([
    'React & TS',
    'Node.js',
    'FastAPI',
    'PostgreSQL',
    'Python',
  ]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentUser.avatar) setAvatar(currentUser.avatar);
  }, [currentUser]);

  // Profile Image File Upload Handler
  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const resultUrl = event.target?.result as string;
        if (resultUrl) {
          setAvatar(resultUrl);
          updateCurrentUser({ avatar: resultUrl });
          showToast('Profile photo updated successfully!');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkillInput('');
      showToast(`Added skill: ${trimmed}`);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFileName(file.name);
      setResumeUrl(URL.createObjectURL(file));
      showToast(`Uploaded new resume: ${file.name}`);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    updateCurrentUser({
      avatar,
    });

    setTimeout(() => {
      setIsSaving(false);
    }, 400);
  };

  const AVATAR_PRESETS = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">My Profile & Workspace Details</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal profile, profile photo, primary skill tags, resume document, and social links.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6 text-center lg:text-left">
          <div className="flex flex-col items-center lg:items-start gap-4">
            {/* Interactive Photo Upload Area */}
            <div className="flex flex-col items-center lg:items-start gap-2">
              <div className="relative group">
                <img
                  src={avatar}
                  alt={fixedName}
                  className="w-24 h-24 rounded-2xl border-2 border-sky-200 object-cover shadow-md group-hover:brightness-90 transition-all"
                />
                <label className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center text-white cursor-pointer transition-all gap-1">
                  <Camera className="w-5 h-5" />
                  <span className="text-[10px] font-bold">Change Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Upload Photo Button */}
              <label className="bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-800 font-bold text-[11px] px-3 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-sky-600" /> Upload Image File
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileUpload}
                  className="hidden"
                />
              </label>

              {/* Presets */}
              <div className="flex items-center gap-1 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold mr-1">Presets:</span>
                {AVATAR_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    title="Choose Avatar Preset"
                    onClick={() => {
                      setAvatar(p);
                      updateCurrentUser({ avatar: p });
                    }}
                    className={`w-6 h-6 rounded-full border-2 overflow-hidden transition-all ${
                      avatar === p ? 'border-sky-600 scale-110' : 'border-white hover:scale-105'
                    }`}
                  >
                    <img src={p} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2.5 py-1 rounded-full border border-sky-200">
                ID: INT-1001
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">{fixedName}</h3>
              <p className="text-xs text-slate-500">{currentUser.title}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Project:
              </span>
              <span className="font-bold text-slate-900">GLC AI Lead Intelligence</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400" /> Squad Lead:
              </span>
              <span className="font-bold text-slate-900">Vikram Malhotra</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Joined Date:
              </span>
              <span className="font-semibold text-slate-700">Aug 15, 2026</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-purple-600" /> FTE Status:
              </span>
              <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[11px]">
                Strong Potential
              </span>
            </div>
          </div>

          {/* Primary Skills Section */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Primary Skills</p>
              <span className="text-[10px] text-slate-400 font-semibold">{skills.length} skills</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add New Skill Input */}
            <form onSubmit={handleAddSkill} className="flex gap-1.5 pt-1">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                placeholder="Add skill (e.g. Docker)..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-lg p-1.5 text-xs text-slate-800 placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold p-1.5 rounded-lg text-xs flex items-center justify-center shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Profile Details Form */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">Personal Contact & Professional Links</h3>
            <p className="text-xs text-slate-500">Name and Email are fixed upon registration. Update photo, phone, links, resume, and bio.</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5 text-xs">
            {/* Fixed Registration Info Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Full Name <span className="text-[10px] text-slate-400 font-normal">(Fixed upon Registration)</span>
                </label>
                <input
                  type="text"
                  value={fixedName}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-slate-600 font-bold cursor-not-allowed select-none"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-semibold mb-1">
                  Email Address <span className="text-[10px] text-slate-400 font-normal">(Fixed upon Registration)</span>
                </label>
                <input
                  type="email"
                  value={fixedEmail}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-slate-600 font-bold cursor-not-allowed select-none"
                />
              </div>
            </div>

            {/* Editable Contact Fields */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-sky-500 rounded-xl p-2.5 text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">GitHub Profile URL</label>
                <input
                  type="url"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-sky-500 rounded-xl p-2.5 text-slate-800 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">LinkedIn Profile URL</label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full bg-white border border-slate-200 focus:border-sky-500 rounded-xl p-2.5 text-slate-800 font-medium"
              />
            </div>

            {/* Resume Upload Section */}
            <div className="bg-sky-50/50 border border-sky-100 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-slate-800 font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600" /> Resume Document
                </label>
                {resumeFileName && (
                  <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Attached
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <label className="bg-white border border-slate-200 hover:border-sky-500 text-slate-700 font-semibold text-xs px-4 py-2 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-2 shrink-0">
                  <Upload className="w-4 h-4 text-sky-600" /> Upload Resume PDF
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} className="hidden" />
                </label>

                {resumeFileName ? (
                  <div className="flex items-center gap-2 overflow-hidden text-xs">
                    <span className="font-semibold text-slate-800 truncate">{resumeFileName}</span>
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:text-sky-500 font-bold text-[11px] underline flex items-center gap-1 shrink-0"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <span className="text-slate-400 italic text-xs">No resume document uploaded yet.</span>
                )}
              </div>
            </div>

            {/* Bio & Summary */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Intern Bio & Summary</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your engineering focus, project goals, and technical background..."
                className="w-full bg-white border border-slate-200 focus:border-sky-500 rounded-xl p-2.5 text-slate-800 font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-sky-600 hover:bg-sky-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-sky-600/20 transition-all flex items-center gap-2 text-xs"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving Details...' : 'Save Profile Details'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
