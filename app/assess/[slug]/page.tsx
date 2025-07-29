'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea'
import * as Tabs from '@radix-ui/react-tabs'
import { Plus, X, Sun, Moon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'

// Type voor één proces
interface ProcessData {
  id: string
  taskName: string
  processDescription: string
  taskGoal: string
  perfectResult: string
  ergernis: string
  frequency: string
  volumeVariation: string
  hoursPerMonth: string
  peopleInvolved: string
  costsExcludingLabor: string
  directRevenue: string
  revenueIncreasePotential: string
  dataSources: string
  systemsUsed: string
  dataConsistency: string
  dataConsistencyNotes: string
  exceptionsRequireIntervention: string
  exceptionPercentage: string
  exceptionNotes: string
  taskCriticality: string
  complianceInvolved: string
  complianceDetails: string
  additionalComments: string
}

// Style themes met dark mode
const themes = {
  light: {
    name: 'Light Mode',
    fonts: {
      heading: 'font-serif',
      body: 'font-sans'
    },
    colors: {
      bg: 'bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50',
      card: 'bg-white',
      cardBorder: 'border-purple-200',
      primary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
      primaryText: 'text-purple-600',
      heading: 'text-gray-900',
      text: 'text-gray-700',
      border: 'border-purple-300',
      tabActive: 'border-purple-500 text-purple-600',
      tabInactive: 'text-gray-600 hover:text-purple-600',
      toggleBg: 'bg-gray-200',
      toggleButton: 'bg-white'
    },
    rounded: 'rounded-2xl',
    shadow: 'shadow-lg shadow-purple-200/50'
  },
  dark: {
    name: 'Dark Mode',
    fonts: {
      heading: 'font-serif',
      body: 'font-sans'
    },
    colors: {
      bg: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
      card: 'bg-slate-800',
      cardBorder: 'border-slate-700',
      primary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
      primaryText: 'text-purple-400',
      heading: 'text-white',
      text: 'text-slate-300',
      border: 'border-slate-600',
      tabActive: 'border-purple-400 text-purple-400',
      tabInactive: 'text-slate-400 hover:text-slate-200',
      toggleBg: 'bg-slate-700',
      toggleButton: 'bg-slate-900'
    },
    rounded: 'rounded-2xl',
    shadow: 'shadow-xl shadow-purple-900/30'
  }
}

// Lege proces template
const emptyProcess: ProcessData = {
  id: '',
  taskName: '',
  processDescription: '',
  taskGoal: '',
  perfectResult: '',
  ergernis: '', 
  frequency: '',
  volumeVariation: '',
  hoursPerMonth: '',
  peopleInvolved: '',
  costsExcludingLabor: '',
  directRevenue: '',
  revenueIncreasePotential: '',
  dataSources: '',
  systemsUsed: '',
  dataConsistency: '',
  dataConsistencyNotes: '',
  exceptionsRequireIntervention: '',
  exceptionPercentage: '',
  exceptionNotes: '',
  taskCriticality: '',
  complianceInvolved: '',
  complianceDetails: '',
  additionalComments: ''
}
// Logo Component (tijdelijk hier)
function AlpacaLogo({ size = 'normal' }: { size?: 'small' | 'normal' | 'large' }) {
  const sizes = {
    small: { text: 'text-xl', box: 'w-10 h-9', letter: 'text-2xl' },
    normal: { text: 'text-2xl', box: 'w-[53px] h-[45px]', letter: 'text-4xl' },
    large: { text: 'text-3xl', box: 'w-16 h-14', letter: 'text-5xl' }
  }

  const currentSize = sizes[size]

  return (
    <div className="flex items-center">
      <div className="relative">
        <div className={`absolute -left-1 -top-1 ${currentSize.box} bg-pink-500/15 border-2 border-pink-500 rounded-lg drop-shadow-[0_0_20px_rgba(236,72,153,0.5)]`}></div>
        <span className={`relative z-10 ${currentSize.text}`}>
          <span className={`font-extrabold ${currentSize.letter} text-pink-500`}>A</span>
          <span className="font-semibold">lpaca</span>
        </span>
      </div>
      <div className="relative ml-2">
        <div className={`absolute -left-1 -top-1 w-[33px] ${currentSize.box.split(' ')[1]} bg-blue-400/15 border-2 border-blue-400 rounded-lg drop-shadow-[0_0_20px_rgba(96,165,250,0.5)]`}></div>
        <span className={`relative z-10 ${currentSize.text}`}>
          <span className={`font-extrabold ${currentSize.letter} text-blue-400`}>i</span>
          <span className="font-semibold">ntegrations</span>
        </span>
      </div>
    </div>
  )
}
export default function AssessmentPage() {
  const params = useParams()
  const slug = params.slug as string
  console.log('AssessmentPage loaded for:', slug)

  // State voor dark mode
  const [isDarkMode, setIsDarkMode] = useState(false)
  const theme = themes.light

  // State voor meerdere processen
  const [processes, setProcesses] = useState<ProcessData[]>([
    { ...emptyProcess, id: '1' }
  ])
  const [activeTab, setActiveTab] = useState('1')
  const router = useRouter()
  const [client, setClient] = useState<{company_name?: string; id?: string} | null>(null)
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  // Autosave functionality
const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
const lastSavedRef = useRef<string>('')
const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | ''>('')

// Save to Supabase with debounce
const saveToSupabase = useCallback(async (data: ProcessData[]) => {
  const dataString = JSON.stringify(data)
  
  // Only save if data changed
  if (dataString === lastSavedRef.current) return
  
  setSaveStatus('saving')
  
  try {
    const { error } = await supabase
      .from('assessment_drafts')
      .upsert({
        client_slug: slug,
        process_data: data
      }, {
        onConflict: 'client_slug'
      })
    
    if (!error) {
      lastSavedRef.current = dataString
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(''), 2000)
      console.log('Autosaved at', new Date().toLocaleTimeString())
    } else {
      console.error('Save error:', error.message || 'Unknown error', error)
    }
  } catch (err) {
    console.error('Save error:', err)
  }
}, [slug])

// Debounced save function
const debouncedSave = useCallback((data: ProcessData[]) => {
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current)
  }
  
  saveTimeoutRef.current = setTimeout(() => {
    saveToSupabase(data)
  }, 1000) // Save 1 second after user stops typing
}, [saveToSupabase])

// Load saved data on mount
useEffect(() => {
  const loadSavedData = async () => {
    try {
      const { data, error } = await supabase
        .from('assessment_drafts')
        .select('process_data')
        .eq('client_slug', slug)
        .single()
      
      if (data?.process_data) {
        setProcesses(data.process_data)
        lastSavedRef.current = JSON.stringify(data.process_data)
      }
    } catch (err) {
      console.log('No saved data found')
    }
  }
  
  loadSavedData()
}, [slug])

// Trigger save when processes change
useEffect(() => {
  if (processes.length > 0 && processes[0].id) {
    debouncedSave(processes)
  }
}, [processes, debouncedSave])

  // Voeg nieuw proces toe
  const addNewProcess = () => {
    const newId = String(processes.length + 1)
    setProcesses([...processes, { ...emptyProcess, id: newId }])
    setActiveTab(newId)
  }

  // Verwijder proces
  const removeProcess = (id: string) => {
    if (processes.length > 1) {
      const newProcesses = processes.filter(p => p.id !== id)
      setProcesses(newProcesses)
      if (activeTab === id) {
        setActiveTab(newProcesses[0].id)
      }
    }
  }

  // Update proces data
  const updateProcess = (id: string, field: string, value: string) => {
    setProcesses(processes.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ))
  }

  // Get tab label
  const getTabLabel = (process: ProcessData, index: number) => {
    if (process.taskName.trim()) {
      return process.taskName.length > 20 
        ? process.taskName.substring(0, 20) + '...' 
        : process.taskName
    }
    return `Proces ${index + 1}`
  }

  // Add Google Fonts
  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }, [])
// Check authentication and load client data
useEffect(() => {
  const checkAuth = async () => {
    console.log('Checking auth for:', slug)
    
    // Check if client exists and is active
    const { data: clientData } = await supabase
      .from('clients')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (!clientData) {
  console.log('No client found, redirecting to home')
  setIsAuthChecking(false)
  router.push('/')
  return
}

    // Check for valid device token
    const deviceToken = Cookies.get(`device_${slug}`)
    console.log('Device token:', deviceToken)
    
    if (!deviceToken) {
  console.log('No device token, redirecting to login')
  setIsAuthChecking(false)
  router.push(`/assess/${slug}/login`)
  return
}

    // For session cookies (not remembered), we don't check the database
// Only check database if it's meant to be a remembered device
if (deviceToken.length > 0) {
  // Valid session - could be temporary or permanent
  // For permanent tokens, verify in database
  const { data: device } = await supabase
    .from('trusted_devices')
    .select('*')
    .eq('device_token', deviceToken)
    .eq('client_id', clientData.id)
    .single()

  // If no device found, it's a temporary session cookie which is OK
  console.log('Device lookup result:', device)
}

console.log('Auth successful, setting client data')
setClient(clientData)
setIsAuthChecking(false)

    console.log('Auth successful, setting client data')
    setClient(clientData)
  }

  checkAuth()
}, [slug, router])
// Show loading while checking auth
if (isAuthChecking) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Laden...</p>
      </div>
    </div>
  )
}
  return (
<div className={`min-h-screen ${theme.colors.bg} transition-colors duration-300`}>
  {/* Dark Mode Toggle */}
  {/* Save indicator */}
      {saveStatus && (
        <div className="fixed top-20 right-4 z-40">
          <div className={`${theme.colors.card} ${theme.rounded} px-4 py-2 text-sm ${theme.colors.text} ${theme.shadow}`}>
            {saveStatus === 'saving' ? '💾 Opslaan...' : '✅ Opgeslagen'}
          </div>
        </div>
      )}
  

      {/* Header */}
{/* Header */}
<div className={`${theme.colors.card} border-b ${theme.colors.cardBorder} ${theme.shadow} transition-all duration-300`}>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="flex items-center justify-between">
      <AlpacaLogo size="normal" />
      <h1 className={`text-2xl font-bold ${theme.colors.heading} ${theme.fonts.heading} tracking-tight`}>
        {client?.company_name ? `${client.company_name} - Proces Assessment` : 'Proces Assessment'}
      </h1>
    </div>
  </div>
</div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className={`flex space-x-1 border-b ${theme.colors.cardBorder} mb-8`}>
            {processes.map((process, index) => (
              <Tabs.Trigger
                key={process.id}
                value={process.id}
                className={`group relative px-4 py-2 text-sm font-medium border-b-2 border-transparent transition-all ${theme.fonts.body}
                  data-[state=active]:${theme.colors.tabActive}
                  ${theme.colors.tabInactive}`}
              >
                {getTabLabel(process, index)}
                {processes.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeProcess(process.id)
                    }}
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                  </button>
                )}
              </Tabs.Trigger>
            ))}
            <button
              onClick={addNewProcess}
              className={`px-4 py-2 text-sm font-medium flex items-center space-x-1 transition-all ${theme.fonts.body} ${theme.colors.tabInactive}`}
            >
              <Plus className="w-4 h-4" />
              <span>Nieuw proces</span>
            </button>
          </Tabs.List>

          {processes.map((process) => (
            <Tabs.Content key={process.id} value={process.id}>
              <ProcessForm
                process={process}
                onUpdate={(field, value) => updateProcess(process.id, field, value)}
                theme={theme}
              />
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </div>
    </div>
  )
}

// Component voor één proces formulier
function ProcessForm({ 
  process, 
  onUpdate,
  theme
}: { 
  process: ProcessData
  onUpdate: (field: string, value: string) => void
  theme: typeof themes.light
}) {
  // Conditional visibility states
  const [showDataConsistencyNotes, setShowDataConsistencyNotes] = useState(
    process.dataConsistency !== '' && process.dataConsistency !== 'zeer_goed'
  )
  const [showExceptionDetails, setShowExceptionDetails] = useState(
    process.exceptionsRequireIntervention !== '' && process.exceptionsRequireIntervention !== 'nee'
  )
  const [showComplianceDetails, setShowComplianceDetails] = useState(
    process.complianceInvolved === 'ja'
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    onUpdate(name, value)
  }

  const handleRadioChange = (name: string, value: string) => {
    onUpdate(name, value)
    
    if (name === 'dataConsistency') {
      setShowDataConsistencyNotes(value !== 'zeer_goed')
    }
    if (name === 'exceptionsRequireIntervention') {
      setShowExceptionDetails(value !== 'nee')
    }
    if (name === 'complianceInvolved') {
      setShowComplianceDetails(value === 'ja')
    }
  }

  const inputClasses = `w-full px-4 py-3 ${theme.colors.border} border ${theme.rounded} focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 ${theme.colors.card} ${theme.colors.text} transition-all duration-200`

  return (
    <form className="space-y-8">
      {/* Algemene Informatie */}
      <div className={`${theme.colors.card} ${theme.shadow} ${theme.rounded} p-8 border ${theme.colors.cardBorder} transition-all duration-300`}>
        <h2 className={`text-2xl font-bold ${theme.colors.heading} mb-8 ${theme.fonts.heading} flex items-center`}>
          <span className="mr-3 text-3xl">📋</span>
          Algemene Informatie
        </h2>
        
        <div className="space-y-6">
          {/* 1. Naam van de taak/proces */}
          <div>
            <label htmlFor="taskName" className={`block text-sm font-medium ${theme.colors.text} mb-2 ${theme.fonts.body}`}>
              1. Naam van de taak/proces:
            </label>
            <input
              type="text"
              id="taskName"
              name="taskName"
              value={process.taskName}
              onChange={handleInputChange}
              placeholder="Geef een korte, duidelijke naam voor deze taak"
              className={inputClasses}
            />
          </div>

          {/* 2. Beschrijf het proces gedetailleerd */}
          <div>
            <label htmlFor="processDescription" className={`block text-sm font-medium ${theme.colors.text} mb-2 ${theme.fonts.body}`}>
              2. Beschrijf het proces gedetailleerd:
            </label>
            <AutoResizeTextarea
              id="processDescription"
              name="processDescription"
              value={process.processDescription}
              onChange={handleInputChange}
              minRows={3}
              maxRows={30}
              placeholder="Nummer de stappen voor de duidelijkheid (bijv. 1. Open Excel bestand, 2. Controleer data, 3. Maak rapport, etc.)"
              className={inputClasses}
            />
          </div>

          {/* 3. Doel van deze taak */}
          <div>
            <label htmlFor="taskGoal" className={`block text-sm font-medium ${theme.colors.text} mb-2 ${theme.fonts.body}`}>
              3. Doel van deze taak:
            </label>
            <AutoResizeTextarea
              id="taskGoal"
              name="taskGoal"
              value={process.taskGoal}
              onChange={handleInputChange}
              minRows={2}
              maxRows={8}
              placeholder="Wat wil je bereiken met deze taak? Wat is het eindresultaat?"
              className={inputClasses}
            />
          </div>

          {/* 4. Wanneer zou het resultaat perfect zijn? */}
          <div>
            <label htmlFor="perfectResult" className={`block text-sm font-medium ${theme.colors.text} mb-2 ${theme.fonts.body}`}>
              4. Wanneer zou het resultaat perfect zijn?
            </label>
            <AutoResizeTextarea
              id="perfectResult"
              name="perfectResult"
              value={process.perfectResult}
              onChange={handleInputChange}
              minRows={2}
              maxRows={8}
              placeholder="Wat kan er nog verbeterd worden aan de huidige uitkomst. Wat is het best denkbare resultaat?"
              className={inputClasses}
            />
          </div>

          {/* 5. Wat is de grootste ergernis aan dit proces */}
          <div>
            <label htmlFor="ergernis" className={`block text-sm font-medium ${theme.colors.text} mb-2 ${theme.fonts.body}`}>
              5. Wat is de grootste ergernis aan dit proces?
            </label>
            <AutoResizeTextarea
              id="ergernis"
              name="ergernis"
              value={process.ergernis}
              onChange={handleInputChange}
              minRows={2}
              maxRows={8}
              placeholder="Wat frustreert u het meest aan dit proces?"
              className={inputClasses}
            />
          </div>
        </div>   {/* Dit sluit space-y-6 */}
      </div>     {/* Dit sluit de witte box */}

      {/* Hier komt de volgende sectie (Frequentie & Volume) */}
      {/* Frequentie & Volume */}
      <div className={`${theme.colors.card} ${theme.shadow} ${theme.rounded} p-8 border ${theme.colors.cardBorder} transition-all duration-300`}>
        <h2 className={`text-2xl font-bold ${theme.colors.heading} mb-8 ${theme.fonts.heading} flex items-center`}>
          <span className="mr-3 text-3xl">📊</span>
          Frequentie & Volume
        </h2>
        
        <div className="space-y-6">
          {/* 6. Hoe vaak wordt deze taak uitgevoerd */}
          <div>
            <label htmlFor="frequency" className={`block text-sm font-medium ${theme.colors.text} mb-2 ${theme.fonts.body}`}>
              6. Hoe vaak wordt deze taak uitgevoerd en bij welke gebeurtenis?
            </label>
            <input
              type="text"
              id="frequency"
              name="frequency"
              value={process.frequency}
              onChange={handleInputChange}
              placeholder="Bijvoorbeeld: 5 keer per dag, 2 keer per week, 1 keer per maand, bij een actie of gebeurtenis, willekeurig"
              className={inputClasses}
            />
          </div>

          {/* 7. Varieert het volume? */}
          <div>
            <label htmlFor="volumeVariation" className={`block text-sm font-medium ${theme.colors.text} mb-2 ${theme.fonts.body}`}>
              7. Varieert het volume?
            </label>
            <input
              type="text"
              id="volumeVariation"
              name="volumeVariation"
              value={process.volumeVariation}
              onChange={handleInputChange}
              placeholder="Nee, ja afhankelijk van..."
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      {/* Tijd & Kosten */}
      <div className={`${theme.colors.card} ${theme.shadow} ${theme.rounded} p-8 border ${theme.colors.cardBorder} transition-all duration-300`}>
        <h2 className={`text-2xl font-bold ${theme.colors.heading} mb-8 ${theme.fonts.heading} flex items-center`}>
          <span className="mr-3 text-3xl">💰</span>
          Tijd & Kosten
        </h2>
        
        <div className="space-y-6">
          {/* 8. Hoeveel uren per maand */}
          <div>
            <label htmlFor="hoursPerMonth" className={`block text-sm font-medium ${theme.colors.text} mb-2 ${theme.fonts.body}`}>
              8. Hoeveel uren per maand kost deze taak gemiddeld?
            </label>
            <input
              type="text"
              id="hoursPerMonth"
              name="hoursPerMonth"
              value={process.hoursPerMonth}
              onChange={handleInputChange}
              placeholder="Aantal uur per maand gemiddeld"
              className={inputClasses}
            />
          </div>

          {/* 9. Hoeveel personen zijn hierbij betrokken */}
          <div>
            <label htmlFor="peopleInvolved" className={`block text-sm font-medium ${theme.colors.text} mb-2 ${theme.fonts.body}`}>
              9. Hoeveel personen zijn hierbij betrokken?
            </label>
            <input
              type="text"
              id="peopleInvolved"
              name="peopleInvolved"
              value={process.peopleInvolved}
              onChange={handleInputChange}
              placeholder="Aantal personen dat deze taak uitvoert"
              className={inputClasses}
            />
          </div>

          {/* 10. Wat zijn de kosten exclusief loonkosten */}
          <div>
            <label htmlFor="costsExcludingLabor" className={`block text-sm font-medium ${theme.colors.text} mb-2 ${theme.fonts.body}`}>
              10. Wat zijn de kosten van deze taak exclusief loonkosten
            </label>
            <input
              type="text"
              id="costsExcludingLabor"
              name="costsExcludingLabor"
              value={process.costsExcludingLabor}
              onChange={handleInputChange}
              placeholder="Software, materialen, externe diensten, etc. per maand"
              className={inputClasses}
            />
          </div>

          {/* 11. Levert deze taak direct omzet op */}
          <div>
            <label htmlFor="directRevenue" className={`block text-sm font-medium ${theme.colors.text} mb-2 ${theme.fonts.body}`}>
              11. Levert deze taak direct omzet op?
            </label>
            <input
              type="text"
              id="directRevenue"
              name="directRevenue"
              value={process.directRevenue}
              onChange={handleInputChange}
              placeholder="Nee, ja ongeveer € ... per maand"
              className={inputClasses}
            />
          </div>

          {/* 12. Kan dit meer worden door automatisering */}
          <div>
            <label htmlFor="revenueIncreasePotential" className={`block text-sm font-medium ${theme.colors.text} mb-2 ${theme.fonts.body}`}>
              12. Kan dit meer worden door de taak te automatiseren en op te schalen?
            </label>
            <input
              type="text"
              id="revenueIncreasePotential"
              name="revenueIncreasePotential"
              value={process.revenueIncreasePotential}
              onChange={handleInputChange}
              placeholder="Zo ja, hoeveel meer omzet per maand?"
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      {/* Data & Systemen */}
      <div className={`${theme.colors.card} ${theme.shadow} ${theme.rounded} p-8 border ${theme.colors.cardBorder} transition-all duration-300`}>
        <h2 className={`text-2xl font-bold ${theme.colors.heading} mb-8 ${theme.fonts.heading} flex items-center`}>
          <span className="mr-3 text-3xl">🔧</span>
          Data & Systemen
        </h2>
        
        <div className="space-y-6">
          {/* 13. Waar komen de gegevens vandaan */}
          <div>
            <label htmlFor="dataSources" className={`block text-sm font-medium ${theme.colors.text} mb-2 ${theme.fonts.body}`}>
              13. Waar komen de gegevens vandaan?
            </label>
            <AutoResizeTextarea
              id="dataSources"
              name="dataSources"
              value={process.dataSources}
              onChange={handleInputChange}
              minRows={2}
              maxRows={8}
              placeholder="Beschrijf alle databronnen (bijv. Excel bestanden, CRM systeem, e-mails, handmatige invoer)"
              className={inputClasses}
            />
          </div>

          {/* 14. Welke systemen/tools worden gebruikt */}
          <div>
            <label htmlFor="systemsUsed" className={`block text-sm font-medium ${theme.colors.text} mb-2 ${theme.fonts.body}`}>
              14. Welke systemen/tools worden gebruikt?
            </label>
            <AutoResizeTextarea
              id="systemsUsed"
              name="systemsUsed"
              value={process.systemsUsed}
              onChange={handleInputChange}
              minRows={2}
              maxRows={8}
              placeholder="Lijst alle software, systemen en tools die nodig zijn"
              className={inputClasses}
            />
          </div>

          {/* 15. Is de data consistent? */}
          <div>
            <label className={`block text-sm font-medium ${theme.colors.text} mb-3 ${theme.fonts.body}`}>
              15. Is de data consistent?
            </label>
            <div className="space-y-2">
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="dataConsistency"
                  value="zeer_goed"
                  checked={process.dataConsistency === 'zeer_goed'}
                  onChange={() => handleRadioChange('dataConsistency', 'zeer_goed')}
                  className="mt-1 mr-3 text-purple-600 focus:ring-purple-500"
                />
                <span className={`text-sm ${theme.colors.text}`}>Zeer goed - tot op de komma en altijd compleet zonder fouten</span>
              </label>
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="dataConsistency"
                  value="goed"
                  checked={process.dataConsistency === 'goed'}
                  onChange={() => handleRadioChange('dataConsistency', 'goed')}
                  className="mt-1 mr-3 text-purple-600 focus:ring-purple-500"
                />
                <span className={`text-sm ${theme.colors.text}`}>Goed - soms kleine aanpassingen nodig</span>
              </label>
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="dataConsistency"
                  value="matig"
                  checked={process.dataConsistency === 'matig'}
                  onChange={() => handleRadioChange('dataConsistency', 'matig')}
                  className="mt-1 mr-3 text-purple-600 focus:ring-purple-500"
                />
                <span className={`text-sm ${theme.colors.text}`}>Matig - regelmatig opschonen/corrigeren nodig</span>
              </label>
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="dataConsistency"
                  value="slecht"
                  checked={process.dataConsistency === 'slecht'}
                  onChange={() => handleRadioChange('dataConsistency', 'slecht')}
                  className="mt-1 mr-3 text-purple-600 focus:ring-purple-500"
                />
                <span className={`text-sm ${theme.colors.text}`}>Slecht - veel handmatige correcties nodig</span>
              </label>
            </div>
            
            {showDataConsistencyNotes && (
              <div className="mt-4">
                <label htmlFor="dataConsistencyNotes" className={`block text-sm font-medium ${theme.colors.text} mb-2 ${theme.fonts.body}`}>
                  Toelichting:
                </label>
                <AutoResizeTextarea
                  id="dataConsistencyNotes"
                  name="dataConsistencyNotes"
                  value={process.dataConsistencyNotes}
                  onChange={handleInputChange}
                  minRows={2}
                  maxRows={8}
                  className={inputClasses}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complexiteit & Risico's */}
      <div className={`${theme.colors.card} ${theme.shadow} ${theme.rounded} p-8 border ${theme.colors.cardBorder} transition-all duration-300`}>
        <h2 className={`text-2xl font-bold ${theme.colors.heading} mb-8 ${theme.fonts.heading} flex items-center`}>
          <span className="mr-3 text-3xl">⚠️</span>
          Complexiteit &amp; Risico&apos;s
        </h2>
        
        <div className="space-y-6">
          {/* 16. Zijn er uitzonderingen */}
          <div>
            <label className={`block text-sm font-medium ${theme.colors.text} mb-3 ${theme.fonts.body}`}>
              16. Zijn er uitzonderingen die handmatige interventie vereisen?
            </label>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="exceptionsRequireIntervention"
                  value="nee"
                  checked={process.exceptionsRequireIntervention === 'nee'}
                  onChange={() => handleRadioChange('exceptionsRequireIntervention', 'nee')}
                  className="mr-3 text-purple-600 focus:ring-purple-500"
                />
                <span className={`text-sm ${theme.colors.text}`}>Nee, altijd hetzelfde proces</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="exceptionsRequireIntervention"
                  value="ja_soms"
                  checked={process.exceptionsRequireIntervention === 'ja_soms'}
                  onChange={() => handleRadioChange('exceptionsRequireIntervention', 'ja_soms')}
                  className="mr-3 text-purple-600 focus:ring-purple-500"
                />
                <span className={`text-sm ${theme.colors.text}`}>Ja, soms</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="exceptionsRequireIntervention"
                  value="ja_regelmatig"
                  checked={process.exceptionsRequireIntervention === 'ja_regelmatig'}
                  onChange={() => handleRadioChange('exceptionsRequireIntervention', 'ja_regelmatig')}
                  className="mr-3 text-purple-600 focus:ring-purple-500"
                />
                <span className={`text-sm ${theme.colors.text}`}>Ja, regelmatig</span>
              </label>
            </div>
            
            {showExceptionDetails && (
              <div className="mt-4 space-y-3">
                <div>
                  <label htmlFor="exceptionPercentage" className={`block text-sm font-medium ${theme.colors.text} mb-2 ${theme.fonts.body}`}>
                    Indien ja: In hoeveel procent van de gevallen (schatting):
                  </label>
                  <input
                    type="text"
                    id="exceptionPercentage"
                    name="exceptionPercentage"
                    value={process.exceptionPercentage}
                    onChange={handleInputChange}
                    placeholder="Bijvoorbeeld: 10%"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label htmlFor="exceptionNotes" className={`block text-sm font-medium ${theme.colors.text} mb-2 ${theme.fonts.body}`}>
                    Toelichting:
                  </label>
                  <AutoResizeTextarea
                    id="exceptionNotes"
                    name="exceptionNotes"
                    value={process.exceptionNotes}
                    onChange={handleInputChange}
                    minRows={2}
                    maxRows={8}
                    className={inputClasses}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 17. Hoe kritiek is deze taak */}
          <div>
            <label className={`block text-sm font-medium ${theme.colors.text} mb-3 ${theme.fonts.body}`}>
              17. Hoe kritiek is deze taak voor het bedrijf?
            </label>
            <div className="space-y-2">
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="taskCriticality"
                  value="zeer_kritiek"
                  checked={process.taskCriticality === 'zeer_kritiek'}
                  onChange={() => handleRadioChange('taskCriticality', 'zeer_kritiek')}
                  className="mt-1 mr-3 text-purple-600 focus:ring-purple-500"
                />
                <span className={`text-sm ${theme.colors.text}`}>Zeer kritiek (bedrijf kan niet zonder)</span>
              </label>
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="taskCriticality"
                  value="belangrijk"
                  checked={process.taskCriticality === 'belangrijk'}
                  onChange={() => handleRadioChange('taskCriticality', 'belangrijk')}
                  className="mt-1 mr-3 text-purple-600 focus:ring-purple-500"
                />
                <span className={`text-sm ${theme.colors.text}`}>Belangrijk (grote impact bij uitval)</span>
              </label>
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="taskCriticality"
                  value="nuttig"
                  checked={process.taskCriticality === 'nuttig'}
                  onChange={() => handleRadioChange('taskCriticality', 'nuttig')}
                  className="mt-1 mr-3 text-purple-600 focus:ring-purple-500"
                />
                <span className={`text-sm ${theme.colors.text}`}>Nuttig (efficiency verbetering)</span>
              </label>
              <label className="flex items-start cursor-pointer">
                <input
                  type="radio"
                  name="taskCriticality"
                  value="nice_to_have"
                  checked={process.taskCriticality === 'nice_to_have'}
                  onChange={() => handleRadioChange('taskCriticality', 'nice_to_have')}
                  className="mt-1 mr-3 text-purple-600 focus:ring-purple-500"
                />
                <span className={`text-sm ${theme.colors.text}`}>Nice-to-have</span>
              </label>
            </div>
          </div>

          {/* 18. Is er compliance/regelgeving */}
          <div>
            <label className={`block text-sm font-medium ${theme.colors.text} mb-3 ${theme.fonts.body}`}>
              18. Is er compliance/regelgeving bij betrokken?
            </label>
            <div className="space-y-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="complianceInvolved"
                  value="nee"
                  checked={process.complianceInvolved === 'nee'}
                  onChange={() => handleRadioChange('complianceInvolved', 'nee')}
                  className="mr-3 text-purple-600 focus:ring-purple-500"
                />
                <span className={`text-sm ${theme.colors.text}`}>Nee</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="complianceInvolved"
                  value="ja"
                  checked={process.complianceInvolved === 'ja'}
                  onChange={() => handleRadioChange('complianceInvolved', 'ja')}
                  className="mr-3 text-purple-600 focus:ring-purple-500"
                />
                <span className={`text-sm ${theme.colors.text}`}>Ja, namelijk:</span>
              </label>
            </div>
            
            {showComplianceDetails && (
              <div className="mt-4">
                <input
                  type="text"
                  id="complianceDetails"
                  name="complianceDetails"
                  value={process.complianceDetails}
                  onChange={handleInputChange}
                  placeholder="Beschrijf welke compliance/regelgeving van toepassing is"
                  className={inputClasses}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Aanvullende opmerkingen */}
      <div className={`${theme.colors.card} ${theme.shadow} ${theme.rounded} p-8 border ${theme.colors.cardBorder} transition-all duration-300`}>
        <h2 className={`text-2xl font-bold ${theme.colors.heading} mb-6 ${theme.fonts.heading} flex items-center`}>
          <span className="mr-3 text-3xl">💬</span>
          Aanvullende opmerkingen
        </h2>
        <AutoResizeTextarea
          id="additionalComments"
          name="additionalComments"
          value={process.additionalComments}
          onChange={handleInputChange}
          minRows={3}
          maxRows={15}
          placeholder="Ruimte voor aanvullende opmerkingen of informatie die relevant kan zijn voor de automatisering"
          className={inputClasses}
        />
      </div>

      {/* Submit button */}
      <div className="flex justify-end pb-8">
        <button
          type="submit"
          className={`px-10 py-4 bg-pink-500/15 border-2 border-pink-500 text-pink-500 font-semibold text-lg rounded-full focus:outline-none focus:ring-4 focus:ring-pink-500/50 transition-all transform hover:scale-105 hover:bg-pink-500/25 shadow-lg`}
        >
          Alle processen indienen
        </button>
      </div>
    </form>
  )
}