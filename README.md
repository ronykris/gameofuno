## Project Description
We have developed a decentralized UNO card game. By utilizing arbitrium for its robust blockchain capabilities and privacy we have built a secure and transparent card gaming environment that adheres to the principles of Web3.

### Problem: 
Traditional online card games suffer from trust issues where players doubt the fairness of the game. Centralized platforms often have control over the game mechanics, leading to potential manipulation or lack of transparency. Additionally, the visibility of players’ hands and decks can compromise the integrity of the game, as some players might gain an unfair advantage.

### Solution: 
Our UNO card game, built on the arbitrium blockchain with a privacy layer addresses these concerns by ensuring that all game mechanics are decentralized and transparent, while the privacy layer guarantees that players' hands and the deck remain hidden. This ensures that no player can gain an unfair advantage, and the integrity of the game is preserved. The integration of a commit-and-reveal mechanism further ensures that all moves are verifiable without compromising privacy.

Detailed Project Description The project consists of several key components that ensure a secure, transparent, and fair gaming experience:

### Game Logic:

Decentralized Gameplay: The core game logic, including card shuffling, dealing, and turn management, is implemented on chain using Solidity smart contracts. This ensures that all game actions are transparent, verifiable, and tamper-proof.

Game State Management and Updates: The state of the game (e.g., current turn, remaining cards, and played cards) is managed on-chain, ensuring that it is consistent, tamper-proof, and available to all players in real-time. State updates occur with every action taken by players, such as drawing a card or playing a card. The states are synced across clients using socket.io

Action Validation and Application: Each player’s action is validated on-chain to ensure it adheres to the game rules. Invalid actions are rejected, and the game state is updated only when valid actions are applied.

State Reconstruction and Verification: To maintain fairness and transparency, the game state can be reconstructed and verified by any participant or observer using the transaction history recorded on the blockchain. This ensures that all players can audit the game at any time.

### Privacy Layer:

Confidential Hands and Decks: The hands of each player and the remaining deck are encrypted and stored in the client the other aspects are hashed and stored on chain leveraging its privacy-preserving capabilities. This ensures that no player, except the one holding the cards, can view the contents of any hand . Cryptographic Operations: Cryptographic primitives such as hashing and encryption/decryption are employed to ensure the security and privacy of game data. For example, the deck is shuffled and encrypted and only the relevant cards are decrypted for each player.

Deck Shuffling and Initial State Generation: The deck is shuffled in a cryptographically secure manner ensuring that the order of cards is random and unknown to all players. The initial game state is generated with encrypted decks and distributed in a manner that ensures no information leakage.

### Commit-and-Reveal Mechanism:

Ensuring Fairness: A commit-and-reveal scheme is used to prevent cheating. Players first commit to their actions (e.g., the card they intend to play) by submitting a hash. After all commitments are made, they reveal their actions. This prevents any player from changing their action based on others' actions.

## How it's Made
The decentralized UNO card game is technically built on arbitrium, utilizing several key technologies to ensure fairness, privacy, and transparency.

Smart Contracts: The game logic (card dealing, turn management, action validation) is written in Solidity smart contracts on the Arbitrium blockchain. This ensures all actions are publicly verifiable, immutable, and tamper-proof.

Game State Management: Each player's turn, remaining cards, and game state transitions are stored and managed on-chain. Updates to the game state occur after every validated player action.

Action Validation and Commit-Reveal: Each action, such as playing a card, is committed via a hash, and revealed after all players commit, ensuring no player can manipulate their actions based on others' moves.

Privacy Layer: The privacy-preserving implementation manage the sensitive aspects of the game, like players’ hands and the deck. These elements are encrypted to ensure that no one, except the player, can see their hand.

Deck Shuffling and Cryptographic Operations: Decks are shuffled and encrypted using secure cryptographic algorithms. When a player draws a card, only the specific card is decrypted and revealed to them.

State Reconstruction and Verification: While the private elements are hidden, the state of the game remains verifiable by all players through cryptographic commitments, ensuring fairness without exposing sensitive information.

### Frontend in React & Tailwind CSS:

UI/UX: The game’s frontend is built with NextJs using React and styled using Tailwind CSS, providing an interactive interface where players can view their hands, take actions, and see real-time updates of the game state.
Integration with Smart Contracts: The frontend communicates with the smart contracts via wallet integrations, allowing players to seamlessly interact with both blockchain and privacy layers during gameplay.

Syncing states across clients: It utilizes Socket.io to synchronize game states in real-time between clients. This ensures that players experience seamless updates, such as turns, card plays, and game progress, without needing to rely solely on the blockchain for frequent state updates. Socket.io manages the real-time communication between players' frontends, ensuring the user interface reflects the current state of the game instantly.

This architecture ensures that the game's fairness is guaranteed through decentralization, while players' privacy is preserved through our privacy layer and encrypted state management.

## Setup Instructions

### Frontend (Next.js app)
1. Navigate to the `unogameui` folder:
   ```bash
   cd unogameui
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Backend (Socket server)
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the socket server:
   ```bash
   npm start
   ```

Ensure both the frontend and backend are running simultaneously for the application to function properly.
