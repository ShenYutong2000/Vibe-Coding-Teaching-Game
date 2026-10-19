# MVP Prototype: Day 1–2 Demo Flow and Screen States

## Demo goal

Use a three-minute interactive path to demonstrate the product idea: a child shares a game idea, chooses a core rule, confirms a small goal, then predicts, reviews, or debugs the result. AI guidance remains scripted, while the playtest now contains a playable space-cat game.

## Sample idea and mission

- Idea: I want to make a game where a space cat collects stars and dodges meteors.
- One key question from the AI: What happens when the cat touches a meteor?
- This round’s default scope: Move the space cat with the arrow keys, score when it touches a star, and win by collecting 3 stars. On the design map, the child can reduce the goal to 1 or 2 stars and chooses the meteor rule.
- Prediction: What do you think will happen when the cat touches a star? The child can choose “The score goes up by 1,” “The cat gets bigger,” or “Nothing happens,” or skip.
- Fixed debugging clue: The score does not go up after the cat touches a star.

## Screens and states

| Screen | What the child does | What the AI / prototype shows | Skill practiced | Next state |
| --- | --- | --- | --- | --- |
| Your idea | Edit a free-form idea and get started | Clearly explains that the current path uses the space-cat example | Express a goal and share an idea | Design map |
| Design map | Explore eight elements, set a goal size, and choose a meteor rule | Asks one guiding question and shows stickers and statuses | Set scope, break down a system, and define a rule | Mission; can return to edit the idea |
| Mission | Review the mission card, edit the rule, or confirm | Turns the idea into one small playable loop | Break down a task and limit scope | Build and predict |
| Build and predict | Choose an expected result or skip | Shows a demo build state and mission details | Predict system behavior | Playtest and review |
| Playtest and review | Move the cat with arrow keys or on-screen controls, collect stars, encounter the meteor, then choose one of four outcomes | Runs a small game configured by the confirmed meteor rule | Test and evaluate | As expected → next round; different but liked / changed mind → map; did not work → detective |
| Debugging detective | Observe, make a guess, run a test, apply a fix, and retest | Shows test evidence and rule changes; prompts without deciding for the child | Form a hypothesis, experiment, locate a problem, and retest | Next round |
| Next round | Choose one of two suggestions or share a new idea | Summarizes the skills practiced | Reflect and iterate | New idea screen or design map |

## Interaction details

- The design map shows players, goals, actions, rules, resources, challenges, boundaries, and outcomes. The four core elements light up during the first round; the rest are marked “Explore later.” After playtesting, goals, actions, rules, and outcomes are marked “Playtested.”
- “Different, but I like it” keeps the discovery and returns it to the map. “I changed my mind” also returns to the map. Neither path clears the idea or rule choice.
- “It didn’t work” opens a five-step detective flow: observe → guess → test → fix → retest. The test result shows evidence that supports or rules out the child’s guess.
- “My new idea” opens the idea-entry screen. The two suggestions and the child’s own idea are equally visible options.
- The restart button restores the sample idea and default rule from any screen.
- The playtest uses a 12-by-7 grid. The player starts at a fixed location, collects the selected number of stars to win, and can reset the game at any time. Arrow keys and on-screen directional buttons use the same movement logic.
- The goal sticker offers 1, 2, or 3 stars. The selected goal updates the mission card, the number of stars in the game, the score display, and the win condition. Changing the goal resets the game so the new scope starts cleanly.
- The meteor rule selected on the design map controls the simulation: lose one collected star, return to the starting point, or take no penalty. A custom rule is shown in the mission, but this demo treats it as no penalty and explains that behavior in the game message.
- The detective screen remains a guided sample bug scenario. It teaches the observe → guess → test → fix → retest loop rather than altering the playable game’s scoring logic.

## Follow-up work for Day 2

Replace the static sample preview with a playable single-screen game. Define how the design-map fields configure that game, then decide how playtest observations will reflect the rules the child confirmed.
