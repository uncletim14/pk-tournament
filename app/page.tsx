'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Participant = {
  id: number;
  name: string;
  category: string;
  dupr: string;
  edit_code: string;
  created_at: string;
};

export default function TournamentRegistration() {
  const categories = [
    { id: 'cat1', label: 'NR-2.799', max: 5, enabled: true },
    { id: 'cat2', label: '2.8-3.299', max: 5, enabled: false },
    { id: 'cat3', label: '3.3-3.99', max: 5, enabled: false },
    { id: 'cat4', label: '女性專場', max: 5, enabled: false },
  ];

  const [activeTab, setActiveTab] = useState(categories[0].label);
  const [formData, setFormData] = useState({ name: '', dupr: '', edit_code: '' });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "七賢國小匹克球積分賽";
    fetchParticipants();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_participants' }, fetchParticipants)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchParticipants = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('tournament_participants').select('*').order('id', { ascending: true });
    if (!error && data) setParticipants(data);
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentCat = categories.find(c => c.label === activeTab);
    if (currentCat && !currentCat.enabled) {
      alert("該組別目前未開放報名喔！");
      return;
    }
    if (formData.edit_code.length !== 4) { alert("請設定 4 位數修改密碼"); return; }
    if (!formData.dupr) { alert("請輸入 DUPR ID"); return; }

    const isDuplicate = participants.some(
      p => p.name.trim() === formData.name.trim() && p.category === activeTab
    );
    
    if (isDuplicate) {
      alert(`「${formData.name}」已經在【${activeTab}】名單中囉，請勿重複報名！`);
      return;
    }

    const categoryList = participants.filter(p => p.category === activeTab);
    const currentMax = currentCat?.max || 5;

    if (categoryList.length >= currentMax) {
      const waitlistNum = categoryList.length - currentMax + 1;
      if (!window.confirm(`目前正取已滿，報名後將列為「備取第 ${waitlistNum} 位」，確定報名嗎？`)) return;
    }

    const { error } = await supabase.from('tournament_participants').insert([{
      name: formData.name.trim(),
      category: activeTab,
      dupr: formData.dupr,
      edit_code: formData.edit_code
    }]);

    if (!error) {
      alert("報名成功！");
      setFormData({ name: '', dupr: '', edit_code: '' });
      fetchParticipants();
    } else {
      alert("報名失敗：" + error.message);
    }
  };

  const handleCancel = async (participant: Participant) => {
    const inputCode = window.prompt("請輸入報名時設定的 4 碼密碼以取消報名：");
    if (inputCode === null) return;
    if (inputCode === participant.edit_code) {
      if (window.confirm("確定要取消報名嗎？")) {
        const { error } = await supabase.from('tournament_participants').delete().eq('id', participant.id);
        if (!error) {
          alert("已成功取消報名");
          fetchParticipants();
        }
      }
    } else {
      alert("密碼錯誤，無法取消！");
    }
  };

  const currentList = participants.filter(p => p.category === activeTab);
  const currentCategoryInfo = categories.find(c => c.label === activeTab);
  const maxLimit = currentCategoryInfo?.max || 5;

  return (
    <main className="min-h-screen bg-slate-900 p-4 md:p-8 font-sans text-slate-100">
      <div className="max-w-4xl mx-auto">
        
        <header className="text-center mb-6">
          <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2 tracking-tighter">
            七賢國小匹克球積分賽
          </h1>
          <p className="text-slate-400 text-sm md:text-lg font-medium">專業積分、熱血對戰，展現您的最強實力！</p>
        </header>

        <div className="flex justify-center mb-8">
          <div className="bg-orange-500/10 border border-orange-500/30 px-6 py-2.5 rounded-full shadow-lg shadow-orange-500/5">
             <span className="text-orange-400 font-black tracking-widest text-lg md:text-2xl">比賽時間：6/6 (六) 18:00-21:00</span>
          </div>
        </div>

        {/* 2x2 網格佈局：更新分組名稱 */}
        <div className="mb-10">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.label)}
                className={`flex flex-col items-center justify-center gap-2 p-4 md:p-6 rounded-2xl font-bold transition-all border-2 ${
                  activeTab === cat.label 
                  ? 'bg-orange-500 border-orange-400 text-white shadow-xl scale-[1.02]' 
                  : 'bg-slate-800 border-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                <span className="text-lg md:text-2xl tracking-tight">{cat.label}</span>
                {cat.enabled ? (
                  <span className="bg-white text-slate-900 px-3 py-0.5 rounded-full text-xs md:text-sm font-black uppercase">
                    有開放
                  </span>
                ) : (
                  <span className="text-xs md:text-sm font-bold opacity-40">
                    未開放
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-5 gap-10">
          
          <div className="md:col-span-3 order-1 md:order-2">
            <div className="flex justify-between items-end mb-6 px-1">
              <h2 className="text-2xl font-bold flex items-center gap-3 tracking-tight">
                <span className="w-2 h-7 bg-orange-500 rounded-full"></span>
                目前報名清單
              </h2>
              <span className="text-xs text-slate-400 font-bold bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
                正取剩餘：{currentCategoryInfo?.enabled ? Math.max(0, maxLimit - currentList.length) : '未開放'}
              </span>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20 animate-pulse">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {!currentCategoryInfo?.enabled ? (
                  <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 p-20 rounded-[2.5rem] text-center text-slate-500 font-bold italic">
                    此組別本次活動尚未開放
                  </div>
                ) : currentList.length === 0 ? (
                  <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 p-20 rounded-[2.5rem] text-center text-slate-600 font-bold">
                    尚無選手報名
                  </div>
                ) : (
                  currentList.map((p, index) => {
                    const isWaitlist = index >= maxLimit;
                    return (
                      <div key={p.id} className="bg-slate-800 border-2 border-slate-700/50 p-5 md:p-8 rounded-[1.8rem] flex justify-between items-center shadow-xl">
                        <div className="flex items-center gap-4 md:gap-8">
                          <div className={`px-5 py-2.5 rounded-xl flex items-center justify-center shrink-0 min-w-[85px] ${
                            isWaitlist ? 'bg-amber-500/20 text-amber-500' : 'bg-green-500/20 text-green-500'
                          }`}>
                            <span className="text-xl md:text-2xl font-black">{isWaitlist ? '備取' : '正取'}</span>
                          </div>
                          <div>
                            <div className="font-black text-slate-100 text-2xl md:text-3xl">{p.name}</div>
                            <div className="text-xs text-slate-500 font-bold tracking-widest uppercase mt-1">DUPR: {p.dupr}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleCancel(p)} 
                          className="px-5 py-3 rounded-xl text-lg font-black text-slate-500 border-2 border-slate-700 hover:text-red-400 hover:border-red-400/50 transition-all"
                        >
                          取消
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-2 order-2 md:order-1">
            <form onSubmit={handleRegister} className="bg-slate-800 p-8 rounded-[2.5rem] border-2 border-slate-700 shadow-2xl md:sticky md:top-8">
              <h2 className="text-2xl font-black mb-8 flex items-center gap-2">✍️ 填寫報名</h2>
              <div className="space-y-6">
                <div className={!currentCategoryInfo?.enabled ? 'opacity-30 pointer-events-none' : ''}>
                  <label className="text-xs font-black text-slate-400 ml-1 mb-2 block tracking-wider uppercase">LINE群內的ID</label>
                  <input type="text" disabled={!currentCategoryInfo?.enabled} required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="請輸入 LINE ID" className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-5 py-4 focus:border-orange-500 outline-none text-xl font-bold text-slate-100 placeholder:text-slate-700" />
                </div>
                <div className={!currentCategoryInfo?.enabled ? 'opacity-30 pointer-events-none' : ''}>
                  <label className="text-xs font-black text-slate-400 ml-1 mb-2 block tracking-wider uppercase">DUPR 完整ID</label>
                  <input type="text" disabled={!currentCategoryInfo?.enabled} required value={formData.dupr} onChange={e => setFormData({...formData, dupr: e.target.value})} placeholder="請輸入 DUPR ID" className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-5 py-4 focus:border-orange-500 outline-none text-xl font-bold text-slate-100 placeholder:text-slate-700" />
                </div>
                <div className={!currentCategoryInfo?.enabled ? 'opacity-30 pointer-events-none' : ''}>
                  <label className="text-xs font-black text-slate-400 ml-1 mb-2 block tracking-wider uppercase">4 碼密碼 (取消報名用)</label>
                  <input type="password" disabled={!currentCategoryInfo?.enabled} maxLength={4} inputMode="numeric" required value={formData.edit_code} onChange={e => setFormData({...formData, edit_code: e.target.value})} placeholder="設定密碼" className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-5 py-4 focus:border-orange-500 outline-none text-2xl tracking-[0.4em] font-mono font-bold text-slate-100 placeholder:text-slate-700" />
                </div>
                <button type="submit" disabled={!currentCategoryInfo?.enabled} className={`w-full font-black py-5 rounded-2xl transition-all shadow-xl text-2xl mt-4 ${currentCategoryInfo?.enabled ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white active:scale-95 shadow-orange-900/40' : 'bg-slate-700 text-slate-500 cursor-not-allowed shadow-none opacity-50'}`}>
                  {currentCategoryInfo?.enabled ? '確認報名' : '組別未開放'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
      <footer className="mt-24 pb-12 text-center">
        <p className="text-slate-600 text-[10px] font-black tracking-[0.4em] uppercase tracking-widest">七賢國小匹克球積分賽 • KAOHSIUNG PICKLEBALL</p>
      </footer>
    </main>
  );
}