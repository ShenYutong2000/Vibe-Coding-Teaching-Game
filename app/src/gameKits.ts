export type Point = { x: number; y: number }
export type GameKitId = 'space' | 'ocean'
export type PlayerOption = { id: string; name: string; icon: string }

export type GameKit = {
  id: GameKitId
  name: string
  title: string
  idea: string
  question: (player: string, obstacle: string) => string
  players: PlayerOption[]
  defaultPlayer: string
  collectible: { singular: string; plural: string; name: string; icon: string; locations: Point[] }
  obstacle: { name: string; icon: string; location: Point }
  start: Point
}

export const gameKits: Record<GameKitId, GameKit> = {
  space: {
    id: 'space', name: 'Space adventure', title: 'Star Quest',
    idea: 'I want to make a game where a space cat collects stars and dodges meteors.',
    question: (player, obstacle) => `What happens when ${player} touches a ${obstacle}?`,
    players: [
      { id: 'cat', name: 'Space Cat', icon: '🐱‍🚀' },
      { id: 'bunny', name: 'Moon Bunny', icon: '🐰' },
      { id: 'robot', name: 'Star Robot', icon: '🤖' },
    ],
    defaultPlayer: 'cat',
    collectible: { singular: 'star', plural: 'stars', name: 'star', icon: '✦', locations: [{ x: 2, y: 1 }, { x: 8, y: 1 }, { x: 9, y: 5 }] },
    obstacle: { name: 'meteor', icon: '☄', location: { x: 6, y: 4 } },
    start: { x: 1, y: 5 },
  },
  ocean: {
    id: 'ocean', name: 'Ocean adventure', title: 'Shell Quest',
    idea: 'I want to make a game where a sea turtle collects shells and avoids jellyfish.',
    question: (player, obstacle) => `What happens when ${player} touches a ${obstacle}?`,
    players: [
      { id: 'turtle', name: 'Sea Turtle', icon: '🐢' },
      { id: 'dolphin', name: 'Dolphin', icon: '🐬' },
      { id: 'diver', name: 'Little Diver', icon: '🤿' },
    ],
    defaultPlayer: 'turtle',
    collectible: { singular: 'shell', plural: 'shells', name: 'shell', icon: '🐚', locations: [{ x: 2, y: 1 }, { x: 8, y: 1 }, { x: 9, y: 5 }] },
    obstacle: { name: 'jellyfish', icon: '🪼', location: { x: 6, y: 4 } },
    start: { x: 1, y: 5 },
  },
}

export const initialGame = { player: gameKits.space.start, collected: [] as number[], won: false, moves: 0, collectibleTouched: false }
