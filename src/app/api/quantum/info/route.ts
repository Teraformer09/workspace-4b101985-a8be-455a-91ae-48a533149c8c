import { NextResponse } from 'next/server'

export interface GateInfo {
  name: string
  description: string
  matrix: string[][]
  category: string
  commonUses: string[]
}

const gatesDatabase: GateInfo[] = [
  {
    name: 'X',
    description: 'Pauli-X gate (NOT gate) - flips the qubit state',
    matrix: [['0', '1'], ['1', '0']],
    category: 'Pauli',
    commonUses: ['Bit flip', 'State inversion', 'Quantum NOT operations']
  },
  {
    name: 'Y',
    description: 'Pauli-Y gate - rotates the qubit around the Y-axis of the Bloch sphere',
    matrix: [['0', '-i'], ['i', '0']],
    category: 'Pauli',
    commonUses: ['Phase and bit flip', 'Bloch sphere rotation', 'Quantum algorithms']
  },
  {
    name: 'Z',
    description: 'Pauli-Z gate (Phase flip) - applies a phase of -1 to the |1⟩ state',
    matrix: [['1', '0'], ['0', '-1']],
    category: 'Pauli',
    commonUses: ['Phase flip', 'Error correction', 'Quantum computing basics']
  },
  {
    name: 'H',
    description: 'Hadamard gate - creates superposition states',
    matrix: [['1/√2', '1/√2'], ['1/√2', '-1/√2']],
    category: 'Single-Qubit',
    commonUses: ['Superposition creation', 'Quantum algorithms initialization', 'Bell state preparation']
  },
  {
    name: 'S',
    description: 'Phase gate - applies a phase of π/2 to the |1⟩ state',
    matrix: [['1', '0'], ['0', 'i']],
    category: 'Phase',
    commonUses: ['Phase manipulation', 'Quantum circuits', 'Error correction']
  },
  {
    name: 'T',
    description: 'π/8 gate - applies a phase of π/4 to the |1⟩ state',
    matrix: [['1', '0'], ['0', 'e^(iπ/4)']],
    category: 'Phase',
    commonUses: ['Universal quantum computation', 'Phase manipulation', 'Quantum algorithms']
  }
]

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      gates: gatesDatabase,
      categories: ['Pauli', 'Single-Qubit', 'Phase'],
      totalGates: gatesDatabase.length
    })
  } catch (error) {
    console.error('Gate info API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}