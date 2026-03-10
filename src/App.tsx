/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Pill, 
  TestTube, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Calendar, 
  MessageSquare,
  ChevronRight,
  Heart,
  Scale,
  Thermometer,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GoogleGenAI } from "@google/genai";
import { cn } from './lib/utils';
import { Medication, LabResult, VitalSigns } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'meds' | 'labs' | 'vitals' | 'ai'>('dashboard');
  const [meds, setMeds] = useState<Medication[]>([]);
  const [labs, setLabs] = useState<LabResult[]>([]);
  const [vitals, setVitals] = useState<VitalSigns[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showAddMed, setShowAddMed] = useState(false);
  const [showAddLab, setShowAddLab] = useState(false);
  const [showAddVital, setShowAddVital] = useState(false);

  // AI state
  const [aiMessage, setAiMessage] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [medsRes, labsRes, vitalsRes] = await Promise.all([
        fetch('/api/medications'),
        fetch('/api/labs'),
        fetch('/api/vitals')
      ]);
      
      setMeds(await medsRes.json());
      setLabs(await labsRes.json());
      setVitals(await vitalsRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMed = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newMed = {
      name: formData.get('name') as string,
      dosage: formData.get('dosage') as string,
      frequency: formData.get('frequency') as string,
      time: formData.get('time') as string,
    };

    await fetch('/api/medications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMed),
    });
    setShowAddMed(false);
    fetchData();
  };

  const handleDeleteMed = async (id: number) => {
    await fetch(`/api/medications/${id}`, { method: 'DELETE' });
    fetchData();
  };

  const handleAddLab = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newLab = {
      date: formData.get('date') as string,
      creatinine: parseFloat(formData.get('creatinine') as string) || null,
      urea: parseFloat(formData.get('urea') as string) || null,
      potassium: parseFloat(formData.get('potassium') as string) || null,
      hemoglobin: parseFloat(formData.get('hemoglobin') as string) || null,
      tacrolimus: parseFloat(formData.get('tacrolimus') as string) || null,
    };

    await fetch('/api/labs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLab),
    });
    setShowAddLab(false);
    fetchData();
  };

  const handleAddVital = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newVital = {
      date: formData.get('date') as string,
      systolic: parseInt(formData.get('systolic') as string) || null,
      diastolic: parseInt(formData.get('diastolic') as string) || null,
      weight: parseFloat(formData.get('weight') as string) || null,
      temperature: parseFloat(formData.get('temperature') as string) || null,
    };

    await fetch('/api/vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVital),
    });
    setShowAddVital(false);
    fetchData();
  };

  const askAi = async () => {
    if (!aiMessage.trim()) return;
    setIsAiLoading(true);
    try {
      const context = `
        Dados do paciente transplantado renal:
        Medicamentos: ${meds.map(m => `${m.name} (${m.dosage})`).join(', ')}
        Últimos exames: ${labs.slice(0, 3).map(l => `Data: ${l.date}, Creatinina: ${l.creatinine}, FK: ${l.tacrolimus}`).join(' | ')}
        Últimos sinais vitais: ${vitals.slice(0, 3).map(v => `Data: ${v.date}, PA: ${v.systolic}/${v.diastolic}, Peso: ${v.weight}`).join(' | ')}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Você é um assistente virtual especializado em saúde renal. O paciente é um transplantado renal. Responda à seguinte pergunta de forma clara e informativa, lembrando sempre que você não substitui um médico. Use os dados de contexto fornecidos se necessário.
        
        Contexto: ${context}
        Pergunta: ${aiMessage}`,
      });
      setAiResponse(response.text || "Não foi possível obter uma resposta.");
    } catch (error) {
      console.error("AI Error:", error);
      setAiResponse("Erro ao consultar o assistente.");
    } finally {
      setIsAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">RenalCare</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Status do Enxerto</p>
              <p className="text-sm font-semibold text-emerald-600">Estável</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Última Creatinina</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{labs[0]?.creatinine || '--'}</span>
                    <span className="text-slate-500 text-sm">mg/dL</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Registrado em {labs[0]?.date ? format(new Date(labs[0].date), 'dd/MM/yyyy') : 'N/A'}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pressão Arterial</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{vitals[0]?.systolic || '--'}/{vitals[0]?.diastolic || '--'}</span>
                    <span className="text-slate-500 text-sm">mmHg</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Registrado em {vitals[0]?.date ? format(new Date(vitals[0].date), 'dd/MM/yyyy') : 'N/A'}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nível Tacrolimus (FK)</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{labs[0]?.tacrolimus || '--'}</span>
                    <span className="text-slate-500 text-sm">ng/mL</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Registrado em {labs[0]?.date ? format(new Date(labs[0].date), 'dd/MM/yyyy') : 'N/A'}</p>
                </div>
              </section>

              <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Tendência de Creatinina
                  </h2>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[...labs].reverse()}>
                      <defs>
                        <linearGradient id="colorCreat" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(str) => format(new Date(str), 'dd/MM')}
                        stroke="#94a3b8"
                        fontSize={12}
                      />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        labelFormatter={(str) => format(new Date(str), 'dd/MM/yyyy')}
                      />
                      <Area type="monotone" dataKey="creatinine" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCreat)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Pill className="w-5 h-5 text-emerald-600" />
                  Próximas Doses
                </h2>
                <div className="space-y-3">
                  {meds.length > 0 ? meds.map(med => (
                    <div key={med.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                          <Pill className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{med.name}</p>
                          <p className="text-xs text-slate-500">{med.dosage} • {med.frequency}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">{med.time}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Horário</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-center text-slate-400 py-4">Nenhum medicamento cadastrado.</p>
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'meds' && (
            <motion.div 
              key="meds"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Medicamentos</h2>
                <button 
                  onClick={() => setShowAddMed(true)}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-5 h-5" /> Adicionar
                </button>
              </div>

              <div className="grid gap-4">
                {meds.map(med => (
                  <div key={med.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-emerald-50 p-3 rounded-xl">
                        <Pill className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{med.name}</h3>
                        <p className="text-slate-500">{med.dosage} • {med.frequency} • {med.time}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteMed(med.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'labs' && (
            <motion.div 
              key="labs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Exames Laboratoriais</h2>
                <button 
                  onClick={() => setShowAddLab(true)}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-5 h-5" /> Novo Exame
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Data</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Creat.</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ureia</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">FK (Tacro)</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Hemogl.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labs.map(lab => (
                      <tr key={lab.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-medium">{format(new Date(lab.date), 'dd/MM/yyyy')}</td>
                        <td className="px-6 py-4">{lab.creatinine}</td>
                        <td className="px-6 py-4">{lab.urea}</td>
                        <td className="px-6 py-4 font-bold text-emerald-600">{lab.tacrolimus}</td>
                        <td className="px-6 py-4">{lab.hemoglobin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === 'vitals' && (
            <motion.div 
              key="vitals"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Sinais Vitais</h2>
                <button 
                  onClick={() => setShowAddVital(true)}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-5 h-5" /> Registrar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vitals.map(v => (
                  <div key={v.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-slate-500">{format(new Date(v.date), 'dd/MM/yyyy HH:mm')}</span>
                      <Calendar className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-red-50 p-2 rounded-lg">
                          <Heart className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-slate-400 font-bold">Pressão</p>
                          <p className="font-bold">{v.systolic}/{v.diastolic}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <Scale className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-slate-400 font-bold">Peso</p>
                          <p className="font-bold">{v.weight} kg</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="bg-orange-50 p-2 rounded-lg">
                          <Thermometer className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-slate-400 font-bold">Temp.</p>
                          <p className="font-bold">{v.temperature}°C</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'ai' && (
            <motion.div 
              key="ai"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="bg-emerald-600 p-8 rounded-3xl text-white shadow-lg shadow-emerald-200 overflow-hidden relative">
                <div className="relative z-10">
                  <h2 className="text-2xl font-bold mb-2">Assistente RenalCare</h2>
                  <p className="text-emerald-50 opacity-90">Tire suas dúvidas sobre transplante, medicamentos e exames.</p>
                </div>
                <Activity className="absolute -right-8 -bottom-8 w-48 h-48 text-emerald-500 opacity-20" />
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="space-y-4 mb-6">
                  {aiResponse && (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <div className="flex items-start gap-3">
                        <div className="bg-emerald-100 p-2 rounded-lg mt-1">
                          <Activity className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="prose prose-slate max-w-none">
                          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{aiResponse}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <textarea 
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    placeholder="Ex: Como devo tomar o Tacrolimus? Meus níveis de creatinina estão bons?"
                    className="w-full p-4 pr-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none min-h-[100px]"
                  />
                  <button 
                    onClick={askAi}
                    disabled={isAiLoading || !aiMessage.trim()}
                    className="absolute bottom-4 right-4 bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all"
                  >
                    {isAiLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-[10px] font-medium leading-tight">
                    AVISO: O assistente utiliza inteligência artificial. Nunca tome decisões médicas baseadas apenas nestas respostas. Consulte sempre seu nefrologista.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-around">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              activeTab === 'dashboard' ? "text-emerald-600" : "text-slate-400"
            )}
          >
            <Activity className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Início</span>
          </button>
          <button 
            onClick={() => setActiveTab('meds')}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              activeTab === 'meds' ? "text-emerald-600" : "text-slate-400"
            )}
          >
            <Pill className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Remédios</span>
          </button>
          <button 
            onClick={() => setActiveTab('labs')}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              activeTab === 'labs' ? "text-emerald-600" : "text-slate-400"
            )}
          >
            <TestTube className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Exames</span>
          </button>
          <button 
            onClick={() => setActiveTab('vitals')}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              activeTab === 'vitals' ? "text-emerald-600" : "text-slate-400"
            )}
          >
            <Heart className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Sinais</span>
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              activeTab === 'ai' ? "text-emerald-600" : "text-slate-400"
            )}
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">IA</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <AnimatePresence>
        {showAddMed && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6">Adicionar Medicamento</h3>
              <form onSubmit={handleAddMed} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome</label>
                  <input name="name" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Ex: Tacrolimus" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dosagem</label>
                    <input name="dosage" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Ex: 1mg" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Frequência</label>
                    <input name="frequency" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Ex: 12/12h" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Horário</label>
                  <input name="time" type="time" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddMed(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showAddLab && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-xl font-bold mb-6">Registrar Exame</h3>
              <form onSubmit={handleAddLab} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data</label>
                  <input name="date" type="date" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" defaultValue={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Creatinina</label>
                    <input name="creatinine" type="number" step="0.01" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" placeholder="mg/dL" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">FK (Tacro)</label>
                    <input name="tacrolimus" type="number" step="0.1" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" placeholder="ng/mL" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ureia</label>
                    <input name="urea" type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hemoglobina</label>
                    <input name="hemoglobin" type="number" step="0.1" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddLab(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showAddVital && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6">Registrar Sinais Vitais</h3>
              <form onSubmit={handleAddVital} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data e Hora</label>
                  <input name="date" type="datetime-local" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" defaultValue={new Date().toISOString().slice(0, 16)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sistólica (Máx)</label>
                    <input name="systolic" type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" placeholder="120" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Diastólica (Mín)</label>
                    <input name="diastolic" type="number" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" placeholder="80" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Peso (kg)</label>
                    <input name="weight" type="number" step="0.1" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Temp. (°C)</label>
                    <input name="temperature" type="number" step="0.1" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddVital(false)} className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
