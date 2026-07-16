export type MockTone = "violet" | "green" | "amber" | "red"

export type MockRow = {
  /** Avatar initials (OPD-style rows). */
  avatar?: string
  avatarTone?: MockTone
  /** Leading colored dot (stock-style rows). */
  dot?: MockTone
  name: string
  sub?: string
  /** Status pill on the right. */
  badge?: { label: string; tone: MockTone }
  /** Right-aligned text value (e.g. "245 units"). */
  value?: string
  valueTone?: MockTone
}

export type ListMock = {
  kind: "list"
  title: string
  badges?: { label: string; tone: MockTone }[]
  rows: MockRow[]
  /** Footer note banner (e.g. a low-stock warning). */
  note?: { label: string; tone: MockTone }
}

export type ChartMock = {
  kind: "chart"
  title: string
  amount: string
  delta: string
  bars: number[]
  labels: string[]
  /** Indices of bars rendered in the brand colour. */
  highlight: number[]
}

export type SolutionMock = ListMock | ChartMock

export type Solution = {
  id: string
  variant: "purple" | "white"
  pill: string
  title: string
  features: string[]
  mock: SolutionMock
}
