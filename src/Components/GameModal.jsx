// src/Components/GameModal.jsx
import { useEffect, useRef, useState } from "react";

const emptyGame = {
  name: "",
  description: "",
  playerCount: "",
  gameLength: "Normal",
  difficulty: "Medium",
};

export default function GameModal({ isOpen, onClose, onSave }) {
  const dialogRef = useRef(null);
  const [game, setGame] = useState(emptyGame);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const update = (field) => (e) => setGame({ ...game, [field]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...game, playerCount: Number(game.playerCount) });
    setGame(emptyGame);
  };

  return (
    <dialog ref={dialogRef} onClose={onClose}>
      <h2>Add game</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input placeholder="Name" value={game.name} onChange={update("name")} required />
        </div>
        <div>
          <textarea placeholder="Description" value={game.description} onChange={update("description")} required />
        </div>
        <div>
          <input type="number" min="1" placeholder="Player count" value={game.playerCount} onChange={update("playerCount")} required />
        </div>
        <div>
          <select value={game.gameLength} onChange={update("gameLength")}>
            <option value="Short">Short</option>
            <option value="Normal">Normal</option>
            <option value="Long">Long</option>
          </select>
        </div>
        <div>
          <select value={game.difficulty} onChange={update("difficulty")}>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="submit">Add</button>
      </form>
    </dialog>
  );
}