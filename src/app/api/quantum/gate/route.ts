import { NextRequest, NextResponse } from 'next/server'

export interface QuantumState {
  alpha: { real: number; imag: number }
  beta: { real: number; imag: number }
}

export interface GateOperation {
  gate: string
  state: QuantumState
}

function normalizeState(state: QuantumState): QuantumState {
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

function applyGate(state: QuantumState, gateName: string): QuantumState {
  let gateMatrix: number[][] = []
  
  switch (gateName) {
    case 'X':
      gateMatrix = [[0, 1], [1, 0]]
      break
    case 'Y':
      gateMatrix = [[0, -1], [1, 0]]
      break
    case 'Z':
      gateMatrix = [[1, 0], [0, -1]]
      break
    case 'H':
      const invSqrt2 = 1 / Math.sqrt(2)
      gateMatrix = [[invSqrt2, invSqrt2], [invSqrt2, -invSqrt2]]
      break
    case 'S':
      // S gate: phase gate with π/2
      const sResult = {
        alpha: { ...state.alpha },
        beta: { 
          real: -state.beta.imag, 
          imag: state.beta.real 
        }
      }
      return normalizeState(sResult)
    case 'T':
      // T gate: phase gate with π/4
      const angle = Math.PI / 4
      const cosAngle = Math.cos(angle)
      const sinAngle = Math.sin(angle)
      const tResult = {
        alpha: { ...state.alpha },
        beta: { 
          real: state.beta.real * cosAngle - state.beta.imag * sinAngle,
          imag: state.beta.real * sinAngle + state.beta.beta.imag * cosAngle
        }
      }
      return normalizeState(tResult)
    default:
      return state
  }
  
  // Apply 2x2 matrix multiplication for X, Y, Z, H gates
  const alpha = {
    real: gateMatrix[0][0] * state.alpha.real - gateMatrix[0][1] * state.beta.imag,
    imag: gateMatrix[0][0] * state.alpha.imag + gateMatrix[0][1] * state.beta.real
  }
  
  const beta = {
    real: gateMatrix[1][0] * state.alpha.real - gateMatrix[1][1] * state.beta.imag,
    imag: gateMatrix[1][0] * state.alpha.imag + gateMatrix[1][1] * state.beta.real
  }
  
  return normalizeState({ alpha, beta })
}

export async function POST(request: NextRequest) {
  try {
    const body: GateOperation = await request.json()
    
    if (!body.gate || !body.state) {
      return NextResponse.json(
        { error: 'Missing gate or state in request body' },
        { status: 400 }
      )
    }
    
    const validGates = ['X', 'Y', 'Z', 'H', 'S', 'T']
    if (!validGates.includes(body.gate)) {
      return NextResponse.json(
        { error: `Invalid gate. Supported gates: ${validGates.join(', ')}` },
        { status: 400 }
      )
    }
    
    const result = applyGate(body.state, body.gate)
    
    return NextResponse.json({
      success: true,
      gate: body.gate,
      inputState: body.state,
      outputState: result,
      probabilities: {
        zero: Math.pow(result.alpha.real, 2) + Math.pow(result.alpha.imag, 2),
        one: Math.pow(result.beta.real, 2) + Math.pow(result.beta.imag, 2)
      }
    })
    
  } catch (error) {
    console.error('Quantum gate calculation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}