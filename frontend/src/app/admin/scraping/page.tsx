'use client'

import { useEffect, useState } from 'react'
import adminApi from '@/lib/admin-api'
import { 
  Play, Pause, Trash2, Plus, RefreshCw, CheckCircle, XCircle, 
  AlertCircle, Clock, Database, Activity, Settings, ChevronDown, Loader2
} from 'lucide-react'

interface MerchantWebsite {
  id: number
  name: string
  base_url: string
}

interface ScrapingScript {
  id: number
  merchant_website_id: number
  name: string
  target_url: string
  frequency: string
  frequency_minutes: number | null
  status: string
  last_run: string | null
  merchant_website?: MerchantWebsite
}

interface ScrapingLog {
  id: number
  scraping_script_id: number
  started_at: string
  ended_at: string | null
  records_collected: number
  errors_count: number
  result: string
}

interface Stats {
  total_scripts: number
  active_scripts: number
  last_24h: {
    total_records: number
    total_errors: number
    successful_runs: number
    failed_runs: number
  }
}

export default function ScrapingPage() {
  const [scripts, setScripts] = useState<ScrapingScript[]>([])
  const [websites, setWebsites] = useState<MerchantWebsite[]>([])
  const [logs, setLogs] = useState<ScrapingLog[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [runningScriptId, setRunningScriptId] = useState<number | null>(null)
  const [runningAll, setRunningAll] = useState(false)
  
  const [form, setForm] = useState({
    merchant_website_id: '',
    name: '',
    target_url: '',
    frequency: 'daily',
    frequency_minutes: '',
  })

  const fetchData = async () => {
    try {
      const [scriptsRes, logsRes, statsRes] = await Promise.all([
        adminApi.get('/admin/scraping'),
        adminApi.get('/admin/scraping/logs'),
        adminApi.get('/admin/scraping/stats'),
      ])
      setScripts(scriptsRes.data.scripts || [])
      setWebsites(scriptsRes.data.websites || [])
      setLogs(logsRes.data || [])
      setStats(statsRes.data)
    } catch (err) {
      console.error('Failed to fetch scraping data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        merchant_website_id: parseInt(form.merchant_website_id),
        frequency_minutes: form.frequency_minutes ? parseInt(form.frequency_minutes) : null,
      }
      await adminApi.post('/admin/scraping', payload)
      setShowModal(false)
      setForm({ merchant_website_id: '', name: '', target_url: '', frequency: 'daily', frequency_minutes: '' })
      fetchData()
    } catch (err) {
      console.error('Failed to create script:', err)
    }
  }

  const handleToggle = async (script: ScrapingScript) => {
    try {
      await adminApi.post(`/admin/scraping/${script.id}/toggle`)
      fetchData()
    } catch (err) {
      console.error('Failed to toggle script:', err)
    }
  }

  const handleDelete = async (script: ScrapingScript) => {
    if (!confirm(`Delete script "${script.name}"?`)) return
    try {
      await adminApi.delete(`/admin/scraping/${script.id}`)
      fetchData()
    } catch (err) {
      console.error('Failed to delete script:', err)
    }
  }

  const handleRun = async (script: ScrapingScript) => {
    setRunningScriptId(script.id)
    try {
      const response = await adminApi.post(`/admin/scraping/${script.id}/run`)
      const { message, spider } = response.data
      alert(`${message}\n\nSpider: ${spider}\n\nThe scraper is running in the background.\nCheck the logs table for results.`)
      fetchData()
    } catch (err) {
      console.error('Failed to run script:', err)
      alert('Scraping failed. Check logs for details.')
    } finally {
      setRunningScriptId(null)
    }
  }

  const handleRunAll = async () => {
    setRunningAll(true)
    try {
      const response = await adminApi.post('/admin/scraping/run-all')
      alert(`Scraping complete!\nRecords: ${response.data.total_records}\nErrors: ${response.data.total_errors}\n${response.data.message}`)
      fetchData()
    } catch (err) {
      console.error('Failed to run all scripts:', err)
    } finally {
      setRunningAll(false)
    }
  }

  const handleRunSingle = async (siteName: string) => {
    const script = scripts.find(s => s.merchant_website?.name?.toLowerCase().includes(siteName.toLowerCase()))
    if (script) {
      setRunningScriptId(script.id)
      try {
        const response = await adminApi.post(`/admin/scraping/${script.id}/run`)
        alert(`${siteName}: ${response.data.records_collected} records collected`)
        fetchData()
      } catch (err) {
        console.error(`Failed to run ${siteName}:`, err)
      } finally {
        setRunningScriptId(null)
      }
    }
  }

  const getFrequencyLabel = (frequency: string, minutes: number | null) => {
    if (frequency === 'hourly' && minutes) return `Every ${minutes} min`
    if (frequency === 'hourly') return 'Hourly'
    if (frequency === 'daily') return 'Daily'
    if (frequency === 'weekly') return 'Weekly'
    return 'Manual'
  }

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">Inactive</span>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scraping Scripts</h1>
          <p className="text-gray-500">Manage and monitor web scraping tasks</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRunAll}
            disabled={runningAll}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {runningAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {runningAll ? 'Running...' : 'Run All Sites'}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
          >
            <Plus className="w-4 h-4" />
            Add Script
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Scripts</p>
              <p className="text-xl font-bold">{stats?.total_scripts ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Scripts</p>
              <p className="text-xl font-bold">{stats?.active_scripts ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Last 24h Records</p>
              <p className="text-xl font-bold">{(stats?.last_24h?.total_records ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Last 24h Errors</p>
              <p className="text-xl font-bold">{stats?.last_24h?.total_errors ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: 'Tunisianet', action: () => handleRunSingle('tunisianet') },
          { name: 'TunisiaTech', action: () => handleRunSingle('tunisiaTech') },
          { name: 'Zoom', action: () => handleRunSingle('zoom') },
          { name: 'Khadraoui', action: () => handleRunSingle('khadraoui') },
        ].map((site) => (
          <button
            key={site.name}
            onClick={site.action}
            className="flex items-center justify-center gap-2 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 border border-gray-200 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="font-medium">{site.name}</span>
          </button>
        ))}
      </div>

      {/* Scripts Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-900">Configured Scripts</h2>
        </div>
        {scripts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No scraping scripts configured.</p>
            <button onClick={() => setShowModal(true)} className="mt-2 text-brand-600 hover:underline">
              Create your first script
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Script</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Website</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Run</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scripts.map((script) => (
                  <tr key={script.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{script.name}</p>
                        <a href={script.target_url} target="_blank" className="text-xs text-gray-400 hover:text-brand-600 truncate block max-w-xs">
                          {script.target_url}
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm">{script.merchant_website?.name ?? 'N/A'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">
                        {getFrequencyLabel(script.frequency, script.frequency_minutes)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(script.status)}
                    </td>
                    <td className="px-4 py-3">
                      {script.last_run ? (
                        <span className="text-sm text-gray-600">
                          {new Date(script.last_run).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Never</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleRun(script)}
                          disabled={runningScriptId === script.id}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                          title="Run script"
                        >
                          {runningScriptId === script.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleToggle(script)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"
                          title={script.status === 'active' ? 'Pause' : 'Activate'}
                        >
                          {script.status === 'active' ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(script)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Logs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-900">Recent Logs</h2>
        </div>
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No logs yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Records</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Errors</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.slice(0, 20).map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      {new Date(log.started_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {log.ended_at ? (
                        `${Math.round((new Date(log.ended_at).getTime() - new Date(log.started_at).getTime()) / 1000)}s`
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-green-600">
                        {log.records_collected.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {log.errors_count > 0 ? (
                        <span className="text-sm font-medium text-red-600">{log.errors_count}</span>
                      ) : (
                        <span className="text-sm text-gray-400">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {getResultIcon(log.result)}
                        <span className="text-sm capitalize">{log.result}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Add Scraping Script</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <select
                  value={form.merchant_website_id}
                  onChange={(e) => setForm({ ...form, merchant_website_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  required
                >
                  <option value="">Select website</option>
                  {websites.map((site) => (
                    <option key={site.id} value={site.id}>{site.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Script Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g., Tunisianet Laptops"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target URL</label>
                <input
                  type="url"
                  value={form.target_url}
                  onChange={(e) => setForm({ ...form, target_url: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="https://..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="manual">Manual</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interval (min)</label>
                  <input
                    type="number"
                    value={form.frequency_minutes}
                    onChange={(e) => setForm({ ...form, frequency_minutes: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="30"
                    min="15"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
                >
                  Create Script
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}