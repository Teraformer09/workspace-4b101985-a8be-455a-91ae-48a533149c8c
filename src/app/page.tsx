'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calculator, 
  History, 
  RotateCcw, 
  Trash2,
  Plus,
  Minus,
  Layers,
  Zap,
  Circle,
  Square,
  Triangle,
  Info,
  Sparkles
} from 'lucide-react'

interface QuantumState {
  alpha: { real: number; imag: number }
  beta: { real: number; imag: number }
}

interface HistoryEntry {
  id: string
  operation: string
  gate: string
  initialState: QuantumState
  finalState: QuantumState
  timestamp: Date
}

export default function QuantumCalculator() {
  const [qubitState, setQubitState] = useState<QuantumState>({
    alpha: { real: 1, imag: 0 },
    beta: { real: 0, imag: 0 }
  })
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [selectedQubit, setSelectedQubit] = useState(0)
  const [gateInfo, setGateInfo] = useState<any[]>([])
  const [selectedGate, setSelectedGate] = useState<string | null>(null)

  const normalizeState = (state: QuantumState): QuantumState => {
    const norm = Math.sqrt(
      Math.pow(state.alpha.real, 2) + Math.pow(state.alpha.imag, 2) +
      Math.pow(state.beta.real, 2) + Math.pow(state.beta.imag, 2)
    )
    
    if (norm === 0) return { alpha: { real: 1, imag: 0 }, beta: { real: 0, imag: 0 } }
    
    return {
      alpha: { real: state.alpha.real / norm, imag: state.alpha.imag / norm },
      beta: { real: state.beta.real / norm, imag: state.beta.imag / norm }
    }
  }

  const addToHistory = (gate: string, operation: string, initialState: QuantumState, finalState: QuantumState) => {
    const entry: HistoryEntry = {
      id: Date.now().toString(),
      gate,
      operation,
      initialState,
      finalState,
      timestamp: new Date()
    }
    setHistory(prev => [entry, ...prev].slice(0, 50)) // Keep last 50 operations
  }

  const applyGate = (gateName: string, gateMatrix: number[][]) => {
    const initialState = { ...qubitState }
    
    const alpha = {
      real: gateMatrix[0][0] * initialState.alpha.real - gateMatrix[0][1] * initialState.beta.imag,
      imag: gateMatrix[0][0] * initialState.alpha.imag + gateMatrix[0][1] * initialState.beta.real
    }
    
    const beta = {
      real: gateMatrix[1][0] * initialState.alpha.real - gateMatrix[1][1] * initialState.beta.imag,
      imag: gateMatrix[1][0] * initialState.alpha.imag + gateMatrix[1][1] * initialState.beta.real
    }
    
    const newState = normalizeState({ alpha, beta })
    setQubitState(newState)
    addToHistory(gateName, `Applied ${gateName} gate`, initialState, newState)
  }

  const applyXGate = () => {
    applyGate('X', [[0, 1], [1, 0]])
  }

  const applyYGate = () => {
    applyGate('Y', [[0, -1], [1, 0]])
  }

  const applyZGate = () => {
    applyGate('Z', [[1, 0], [0, -1]])
  }

  const applyHGate = () => {
    const invSqrt2 = 1 / Math.sqrt(2)
    applyGate('H', [[invSqrt2, invSqrt2], [invSqrt2, -invSqrt2]])
  }

  const applySGate = () => {
    applyGate('S', [[1, 0], [0, { real: 0, imag: 1 } as any]])
  }

  const applyTGate = () => {
    const angle = Math.PI / 4
    applyGate('T', [[1, 0], [0, { real: Math.cos(angle), imag: Math.sin(angle) } as any]])
  }

  const resetState = () => {
    const initialState = { ...qubitState }
    const newState = { alpha: { real: 1, imag: 0 }, beta: { real: 0, imag: 0 } }
    setQubitState(newState)
    addToHistory('RESET', 'Reset to |0⟩', initialState, newState)
  }

  const clearHistory = () => {
    setHistory([])
  }

  const formatComplex = (c: { real: number; imag: number }) => {
    const { real, imag } = c
    if (Math.abs(real) < 0.0001 && Math.abs(imag) < 0.0001) return '0'
    if (Math.abs(imag) < 0.0001) return real.toFixed(3)
    if (Math.abs(real) < 0.0001) return `${imag.toFixed(3)}i`
    return `${real.toFixed(3)} ${imag >= 0 ? '+' : ''}${imag.toFixed(3)}i`
  }

  const getStateVector = () => {
    return `${formatComplex(qubitState.alpha)}|0⟩ + ${formatComplex(qubitState.beta)}|1⟩`
  }

  const getProbabilities = () => {
    const prob0 = Math.pow(qubitState.alpha.real, 2) + Math.pow(qubitState.alpha.imag, 2)
    const prob1 = Math.pow(qubitState.beta.real, 2) + Math.pow(qubitState.beta.imag, 2)
    return { prob0, prob1 }
  }

  const { prob0, prob1 } = getProbabilities()

  // Fetch gate information on component mount
  useEffect(() => {
    const fetchGateInfo = async () => {
      try {
        const response = await fetch('/api/quantum/info')
        const data = await response.json()
        if (data.success) {
          setGateInfo(data.gates)
        }
      } catch (error) {
        console.error('Failed to fetch gate info:', error)
      }
    }
    fetchGateInfo()
  }, [])

  const getGateDescription = (gateName: string) => {
    const gate = gateInfo.find(g => g.name === gateName)
    return gate ? gate.description : ''
  }

  // Simple Bloch sphere visualization
  const BlochSphere = () => {
    const theta = 2 * Math.acos(Math.sqrt(prob0))
    const phi = Math.atan2(qubitState.beta.imag, qubitState.beta.real)
    
    const x = Math.sin(theta) * Math.cos(phi) * 30
    const y = Math.sin(theta) * Math.sin(phi) * 30
    const z = Math.cos(theta) * 30
    
    return (
      <div className="relative w-32 h-32 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Sphere outline */}
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
          <ellipse cx="50" cy="50" rx="40" ry="15" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
          <ellipse cx="50" cy="50" rx="15" ry="40" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3"/>
          
          {/* Axes */}
          <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
          <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
          
          {/* State vector */}
          <line 
            x1="50" 
            y1="50" 
            x2={50 + x} 
            y2={50 - z} 
            stroke="rgb(147, 51, 234)" 
            strokeWidth="2"
          />
          <circle 
            cx={50 + x} 
            cy={50 - z} 
            r="3" 
            fill="rgb(147, 51, 234)"
          />
          
          {/* Labels */}
          <text x="92" y="53" fontSize="8" fill="currentColor">|0⟩</text>
          <text x="92" y="47" fontSize="8" fill="currentColor">|1⟩</text>
          <text x="46" y="8" fontSize="8" fill="currentColor">+Z</text>
          <text x="46" y="95" fontSize="8" fill="currentColor">-Z</text>
        </svg>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center justify-center gap-3">
            <Calculator className="w-8 h-8 text-purple-600" />
            Quantum Gate Calculator
          </h1>
          <p className="text-slate-600 dark:text-slate-400">Perform quantum operations and track calculation history</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Calculator */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current State Display */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  Current Qubit State
                </CardTitle>
                <CardDescription>Quantum state vector |ψ⟩ and Bloch sphere representation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg font-mono text-sm">
                      |ψ⟩ = {getStateVector()}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">P(|0⟩)</div>
                        <div className="text-2xl font-bold text-blue-600">{(prob0 * 100).toFixed(1)}%</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">P(|1⟩)</div>
                        <div className="text-2xl font-bold text-green-600">{(prob1 * 100).toFixed(1)}%</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">α = </span>
                        <span className="font-mono">{formatComplex(qubitState.alpha)}</span>
                      </div>
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">β = </span>
                        <span className="font-mono">{formatComplex(qubitState.beta)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Bloch Sphere</div>
                    <BlochSphere />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quantum Gates */}
            <Card>
              <CardHeader>
                <CardTitle>Quantum Gates</CardTitle>
                <CardDescription>Apply basic quantum gates to the qubit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                  <Button 
                    onClick={applyXGate} 
                    variant="outline" 
                    className="h-16 flex flex-col gap-1 relative group"
                    onMouseEnter={() => setSelectedGate('X')}
                    onMouseLeave={() => setSelectedGate(null)}
                  >
                    <Square className="w-6 h-6" />
                    <span className="text-xs">X Gate</span>
                  </Button>
                  
                  <Button 
                    onClick={applyYGate} 
                    variant="outline" 
                    className="h-16 flex flex-col gap-1 relative group"
                    onMouseEnter={() => setSelectedGate('Y')}
                    onMouseLeave={() => setSelectedGate(null)}
                  >
                    <Triangle className="w-6 h-6" />
                    <span className="text-xs">Y Gate</span>
                  </Button>
                  
                  <Button 
                    onClick={applyZGate} 
                    variant="outline" 
                    className="h-16 flex flex-col gap-1 relative group"
                    onMouseEnter={() => setSelectedGate('Z')}
                    onMouseLeave={() => setSelectedGate(null)}
                  >
                    <Circle className="w-6 h-6" />
                    <span className="text-xs">Z Gate</span>
                  </Button>
                  
                  <Button 
                    onClick={applyHGate} 
                    variant="outline" 
                    className="h-16 flex flex-col gap-1 relative group"
                    onMouseEnter={() => setSelectedGate('H')}
                    onMouseLeave={() => setSelectedGate(null)}
                  >
                    <Layers className="w-6 h-6" />
                    <span className="text-xs">H Gate</span>
                  </Button>
                  
                  <Button 
                    onClick={applySGate} 
                    variant="outline" 
                    className="h-16 flex flex-col gap-1 relative group"
                    onMouseEnter={() => setSelectedGate('S')}
                    onMouseLeave={() => setSelectedGate(null)}
                  >
                    <Plus className="w-6 h-6" />
                    <span className="text-xs">S Gate</span>
                  </Button>
                  
                  <Button 
                    onClick={applyTGate} 
                    variant="outline" 
                    className="h-16 flex flex-col gap-1 relative group"
                    onMouseEnter={() => setSelectedGate('T')}
                    onMouseLeave={() => setSelectedGate(null)}
                  >
                    <Minus className="w-6 h-6" />
                    <span className="text-xs">T Gate</span>
                  </Button>
                  
                  <Button onClick={resetState} variant="destructive" className="h-16 flex flex-col gap-1">
                    <RotateCcw className="w-6 h-6" />
                    <span className="text-xs">Reset</span>
                  </Button>
                </div>
                
                {selectedGate && (
                  <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-purple-800 dark:text-purple-200">{selectedGate} Gate</span>
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      {getGateDescription(selectedGate)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* History Panel */}
          <div className="lg:col-span-1">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-purple-600" />
                    History
                  </CardTitle>
                  <CardDescription>Recent quantum operations</CardDescription>
                </div>
                <Button 
                  onClick={clearHistory} 
                  variant="outline" 
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-[500px]">
                  {history.length === 0 ? (
                    <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                      No operations yet
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {history.map((entry) => (
                        <div key={entry.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary" className="text-xs">
                              {entry.gate}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {entry.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-xs space-y-1 font-mono">
                            <div className="text-slate-600 dark:text-slate-400">
                              Before: {formatComplex(entry.initialState.alpha)}|0⟩ + {formatComplex(entry.initialState.beta)}|1⟩
                            </div>
                            <div className="text-slate-900 dark:text-slate-100">
                              After: {formatComplex(entry.finalState.alpha)}|0⟩ + {formatComplex(entry.finalState.beta)}|1⟩
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}