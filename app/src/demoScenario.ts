export const demoIdea = 'I want to make a game where a space cat collects stars and dodges meteors.'

export const demoQuestion = 'What happens when the cat touches a meteor?'

export type RuleChoice = 'lose-star' | 'restart' | 'nothing' | 'custom'
export type MapElementId = 'players' | 'objectives' | 'procedures' | 'rules' | 'resources' | 'conflict' | 'boundaries' | 'outcome'

export const ruleOptions: { id: RuleChoice; label: string }[] = [
  { id: 'lose-star', label: 'Lose 1 star' },
  { id: 'restart', label: 'Return to start' },
  { id: 'nothing', label: 'No penalty' },
  { id: 'custom', label: 'I’ll decide' },
]

export const mapElements: { id: MapElementId; title: string; description: string; icon: string }[] = [
  { id: 'players', title: 'Players', description: 'Who is playing? How many players can join?', icon: '🧑‍🚀' },
  { id: 'objectives', title: 'Goals', description: 'What does the player want to achieve?', icon: '🎯' },
  { id: 'procedures', title: 'Actions', description: 'How does the player play the game?', icon: '🕹️' },
  { id: 'rules', title: 'Rules', description: 'What causes something to happen?', icon: '📜' },
  { id: 'resources', title: 'Resources', description: 'What things matter to the player?', icon: '💎' },
  { id: 'conflict', title: 'Challenges', description: 'What makes the goal harder to reach?', icon: '☄️' },
  { id: 'boundaries', title: 'Boundaries', description: 'Where does the game happen, and when does it end?', icon: '🪐' },
  { id: 'outcome', title: 'Outcome', description: 'How do you know how the round went?', icon: '🏆' },
]

export const nextIdeas = [
  { icon: '🌈', title: 'Give stars colors and sounds', description: 'Make every pickup feel a little different.' },
  { icon: '🛡️', title: 'Build a shield against meteors', description: 'Add a resource and see how it changes the game.' },
]
