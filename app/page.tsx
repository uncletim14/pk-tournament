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
    { id: 'cat1', label: '3.29 以下 (入門組)', max: 5 },
    { id: 'cat2', label: '3.3 - 3.9 (中階組)', max: 5 },
    { id: 'cat3', label: '4.0 以上 (菁英組)', max: 5 },
    { id: 'cat4', label: '女性專場', max: 5 },
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
    const currentMax = categories.find(c => c.label === activeTab)?.max || 5;

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
        
        <header className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4 tracking-tighter">
            七賢國小匹克球積分賽
          </h1>
          <p className="text-slate-400 text-base md:text-lg">專業積分、熱血對戰，展現您的最強實力！</p>
        </header>

        {/* 類別分頁 */}
        <div className="relative mb-8 group">
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide snap-x">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.label)}
                className={`px-6 py-4 rounded-2xl font-bold transition-all whitespace-nowrap snap-start shrink-0 border-2 text-lg ${
                  activeTab === cat.label 
                  ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/20' 
                  : 'bg-slate-800 border-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col md:grid md:grid-cols-5 gap-8">
          
          {/* 報名清單區域 */}
          <div className="md:col-span-3 order-1 md:order-2">
            <div className="flex justify-between items-end mb-6 px-1">
              <h2 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <span className="w-2 h-8 bg-orange-500 rounded-full"></span>
                目前報名清單
              </h2>
              <span className="text-sm text-slate-400 font-medium bg-slate-800 px-3 py-1 rounded-lg">
                正取剩餘：{Math.max(0, maxLimit - currentList.length)}
              </span>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20 animate-pulse">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {currentList.length === 0 ? (
                  <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 p-16 rounded-3xl text-center text-slate-500 text-xl font-bold">
                    尚無選手報名，快來搶頭香！
                  </div>
                ) : (
                  currentList.map((p, index) => {
                    const isWaitlist = index >= maxLimit;
                    const displayIndex = isWaitlist ? index - maxLimit + 1 : index + 1;
                    return (
                      <div key={p.id} className="bg-slate-800 border-2 border-slate-700/50 p-6 rounded-3xl flex justify-between items-center group hover:bg-slate-800/80 transition-all active:scale-[0.99] shadow-xl">
                        <div className="flex items-center gap-6">
                          {/* 正取/備取 狀態與編號 - 已加大 */}
                          <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0 ${
                            isWaitlist ? 'bg-amber-500/20 text-amber-500' : 'bg-green-500/20 text-green-500'
                          }`}>
                            <span className="text-lg font-black leading-none">{isWaitlist ? '備' : '正'}</span>
                            <span className="text-2xl font-mono font-bold leading-none mt-1">{displayIndex}</span>
                          </div>
                          
                          {/* 選手資訊 */}
                          <div>
                            <div className="font-black text-slate-100 text-xl md:text-2xl mb-1">{p.name}</div>
                            <div className="text-sm text-slate-500 font-bold tracking-widest">DUPR: {p.dupr}</div>
                          </div>
                        </div>

                        {/* 取消按鈕 - 已加大 */}
                        <button 
                          onClick={() => handleCancel(p)} 
                          className="px-6 py-3 rounded-2xl text-lg font-black text-slate-500 border-2 border-slate-700 hover:text-red-400 hover:border-red-400/50 hover:bg-red-500/5 transition-all active:scale-95"
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

          {/* 報名表單區域 */}
          <div className="md:col-span-2 order-2 md:order-1">
            <form onSubmit={handleRegister} className="bg-slate-800 p-8 rounded-[2rem] border-2 border-slate-700 shadow-2xl md:sticky md:top-8 overflow-hidden">
              <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                ✍️ 填寫報名
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-black text-slate-400 ml-1 mb-2 block tracking-wider">選手姓名</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="請輸入真實姓名" 
                    className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-lg font-bold" 
                  />
                </div>
                <div>
                  <label className="text-sm font-black text-slate-400 ml-1 mb-2 block tracking-wider">DUPR ID</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.dupr} 
                    onChange={e => setFormData({...formData, dupr: e.target.value})} 
                    placeholder="請輸入 DUPR 數值或 ID" 
                    className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-lg font-bold" 
                  />
                </div>
                <div>
                  <label className="text-sm font-black text-slate-400 ml-1 mb-2 block tracking-wider">設定 4 碼密碼 (取消用)</label>
                  <input 
                    type="password" 
                    maxLength={4} 
                    inputMode="numeric"
                    required 
                    value={formData.edit_code} 
                    onChange={e => setFormData({...formData, edit_code: e.target.value})} 
                    placeholder="例如: 1234" 
                    className="w-full bg-slate-900 border-2 border-slate-700 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-xl tracking-[0.5em] font-mono font-bold" 
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-br from-orange-500 to-red-600 text-white font-black py-5 rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-orange-900/40 text-xl"
                >
                  確認報名參加
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
      
      <footer className="mt-20 pb-10 text-center">
        <p className="text-slate-600 text-sm font-bold tracking-widest uppercase">七賢國小匹克球積分賽 • KAOHSIUNG PICKLEBALL</p>
      </footer>
    </main>
  );
}