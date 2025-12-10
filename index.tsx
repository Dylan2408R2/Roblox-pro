import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

type MovementType = 'jelly' | 'directional' | '8bit';

interface JellyCursorProps {
  color: string;
  image: string;
  size: number;
  movementType: MovementType;
  isRainbow: boolean;
}

interface Game {
  id: number;
  title: string;
  players: string;
  img: string;
  description?: string;
  url?: string;
  robloxPlaceId?: string;
}

const DEFAULT_DIRECTIONAL_IMG = 'https://cdn.pixabay.com/photo/2012/04/01/12/39/cursor-23231_1280.png';
const CLICK_DIRECTIONAL_IMG = 'https://toppng.com/uploads/preview/mouse-cursor-11549398293hngd7zvcji.png';

// Canciones de prueba (Música electrónica/funky libre de derechos)
const TRACKS = [
  {
    title: "Electro Jelly Jam",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    title: "8-Bit Arcade Dreams",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3"
  }
];

// Mock Data for Roblox UI
const GAMES: Game[] = [
  { id: 1, title: "Jelly Parkour [OBBY]", players: "12.5k", img: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=400&q=80", description: "¡Salta a través de obstáculos de gelatina! El mejor parkour del momento." },
  { id: 2, title: "Cursor Simulator X", players: "8.2k", img: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80", description: "Mejora tu cursor, consigue skins y domina el servidor." },
  { id: 3, title: "Neon City Tycoon", players: "24k", img: "https://images.unsplash.com/photo-1565523092523-289b4f912854?auto=format&fit=crop&w=400&q=80", description: "Construye tu imperio de neón desde cero." },
  { id: 4, title: "Survive the Jelly", players: "3.1k", img: "https://images.unsplash.com/photo-1614294148960-9aa7406323f7?auto=format&fit=crop&w=400&q=80", description: "Escapa de la gelatina gigante antes de que te atrape." },
  { id: 5, title: "Speed Run 4", players: "50k", img: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=400&q=80", description: "Corre rápido, no mires atrás. Niveles nuevos cada semana." },
  { 
    id: 6, 
    title: "Natural Disaster", 
    players: "15k", 
    img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80", 
    description: "¡Sobrevive a desastres naturales extremos en una isla que se destruye!", 
    url: "https://www.roblox.com/games/189707/Natural-Disaster-Survival",
    robloxPlaceId: "189707" 
  },
];

const JellyCursor = ({ color, image, size, movementType, isRainbow }: JellyCursorProps) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isClicking, setIsClicking] = useState(false);
  
  // Use refs to store mutable values for the animation loop
  const pos = useRef({ x: 0, y: 0 });
  const mouse = useRef({ x: 0, y: 0 });
  const speed = useRef(0.15);
  const lastFrameTime = useRef(0);
  
  // Click animation physics refs
  const clickPulse = useRef(0); // For Jelly jump (0 to 1)
  const isClickingRef = useRef(false); // To access inside loop without dep array
  
  // Store props in refs to access inside loop
  const sizeRef = useRef(size);
  const typeRef = useRef(movementType);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  useEffect(() => {
    typeRef.current = movementType;
  }, [movementType]);

  // Handle click state listeners
  useEffect(() => {
    const handleMouseDown = () => {
      setIsClicking(true);
      isClickingRef.current = true;
      // Start the jump pulse for jelly
      if (typeRef.current === 'jelly') {
        clickPulse.current = 1; 
      }
    };
    const handleMouseUp = () => {
      setIsClicking(false);
      isClickingRef.current = false;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    // Initial centering
    const { innerWidth, innerHeight } = window;
    pos.current = { x: innerWidth / 2, y: innerHeight / 2 };
    mouse.current = { x: innerWidth / 2, y: innerHeight / 2 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    let frameId: number;

    const loop = (time: number) => {
      frameId = requestAnimationFrame(loop);

      const cursor = cursorRef.current;
      if (!cursor) return;

      const currentType = typeRef.current;
      const clicking = isClickingRef.current;

      // 8-bit Throttling Logic (approx 12 FPS)
      if (currentType === '8bit') {
        const fpsInterval = 1000 / 12;
        const elapsed = time - lastFrameTime.current;
        if (elapsed < fpsInterval) return;
        lastFrameTime.current = time - (elapsed % fpsInterval);
      }

      const dx = mouse.current.x - pos.current.x;
      const dy = mouse.current.y - pos.current.y;

      // Adjust physics based on type
      let currentSpeed = speed.current;
      if (currentType === '8bit') currentSpeed = 0.5; // Snappier for 8-bit
      if (currentType === 'directional') currentSpeed = 0.2; // Slightly faster for directional

      pos.current.x += dx * currentSpeed;
      pos.current.y += dy * currentSpeed;

      const velocity = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      const currentSize = sizeRef.current;
      const sizeOffset = -currentSize / 2;

      let transform = `translate3d(${pos.current.x + sizeOffset}px, ${pos.current.y + sizeOffset}px, 0)`;

      if (currentType === 'jelly') {
        // Jelly Logic: Stretch based on velocity
        const stretch = Math.min(velocity * 0.005, 0.5);
        let scaleX = 1 + stretch;
        let scaleY = 1 - stretch;

        // Jelly Jump Click Animation
        let jumpY = 0;
        if (clickPulse.current > 0) {
          // Decay the pulse
          clickPulse.current -= 0.05; 
          if (clickPulse.current < 0) clickPulse.current = 0;

          // Sine wave for jump (Up then down)
          const jumpPhase = Math.sin(clickPulse.current * Math.PI); 
          jumpY = -jumpPhase * 30; // Jump 30px up
          
          // Squash effect on landing/jumping
          const squash = jumpPhase * 0.3;
          scaleX += squash; // Get wider
          scaleY -= squash; // Get flatter
        }

        // Apply rotation, jump offset, and scaling
        // Note: We apply jumpY via translateY here to stack with position
        transform = `translate3d(${pos.current.x + sizeOffset}px, ${pos.current.y + sizeOffset + jumpY}px, 0) rotate(${angle}rad) scale(${scaleX}, ${scaleY})`;
      
      } else if (currentType === 'directional') {
        // Directional Logic: Point towards movement
        const rotationOffset = 135 * (Math.PI / 180); 
        transform += ` rotate(${angle + rotationOffset}rad)`;
      
      } else if (currentType === '8bit') {
        // 8-bit Logic: No rotation
        // Click Animation: Pulse scale in steps
        let scale = 1;
        if (clicking) {
           // Toggle scale based on time for retro flash effect
           scale = Math.floor(time / 100) % 2 === 0 ? 0.8 : 1.1; 
        }
        transform += ` scale(${scale})`; 
      }

      cursor.style.transform = transform;
    };

    frameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(frameId);
    };
  }, []);

  // Determine effective color. 
  // If in Rainbow mode and no image is set, force a saturated red base to allow hue-rotation to work perfectly.
  const displayColor = isRainbow && !image ? '#ff0000' : color;

  // Logic for Image Display (swapping for directional click)
  let displayImage = image;
  if (movementType === 'directional' && isClicking) {
    displayImage = CLICK_DIRECTIONAL_IMG;
  }
  
  // Logic for displayImage URL formatting
  const backgroundImage = displayImage ? `url(${displayImage})` : 'none';

  return (
    <div 
      ref={cursorRef} 
      className={`jelly-cursor ${movementType === '8bit' ? 'pixelated' : ''} ${isRainbow ? 'rainbow' : ''}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: displayImage ? 'transparent' : displayColor,
        backgroundImage: backgroundImage,
        border: displayImage ? 'none' : undefined,
        boxShadow: displayImage ? 'none' : `0 0 20px ${displayColor}80`,
        transition: movementType === '8bit' ? 'none' : 'width 0.2s, height 0.2s'
      }}
    />
  );
};

// --- ROBLOX UI COMPONENTS ---

const TopBar = () => (
  <div className="roblox-topbar">
    <div className="logo-section">
      <span className="logo-text">ROBLOX <span className="pro-badge">PRO</span></span>
      <nav>
        <a href="#" className="active">Descubrir</a>
        <a href="#">Mercado</a>
        <a href="#">Crear</a>
        <a href="#">Robux</a>
      </nav>
    </div>
    <div className="search-section">
      <input type="text" placeholder="Buscar" />
    </div>
    <div className="user-section">
      <div className="icon-btn">⚙️</div>
      <div className="icon-btn">🔔</div>
      <div className="user-avatar">
        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
        <span>UsuarioPro123</span>
      </div>
    </div>
  </div>
);

const Sidebar = () => (
  <div className="roblox-sidebar">
    <ul>
      <li className="active">🏠 Inicio</li>
      <li>👤 Perfil</li>
      <li>✉️ Mensajes</li>
      <li>👥 Amigos</li>
      <li>👗 Avatar</li>
      <li>🎒 Inventario</li>
      <li>🔄 Intercambiar</li>
      <li>🏆 Grupos</li>
      <li>📰 Blog</li>
      <li>💎 Premium</li>
    </ul>
  </div>
);

const GameCard: React.FC<{ title: string, players: string, img: string, onClick: () => void }> = ({ title, players, img, onClick }) => (
  <div className="game-card" onClick={onClick}>
    <div className="game-img" style={{ backgroundImage: `url(${img})` }}></div>
    <div className="game-info">
      <h4>{title}</h4>
      <div className="game-stats">
        <span>👍 92%</span>
        <span>👥 {players}</span>
      </div>
    </div>
  </div>
);

const GameModal = ({ game, onClose, onPlay, isLoading }: { game: Game, onClose: () => void, onPlay: () => void, isLoading: boolean }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      <button className="close-modal-btn" onClick={onClose}>×</button>
      <div className="modal-header">
        <div className="modal-game-img" style={{ backgroundImage: `url(${game.img})` }}></div>
        <div className="modal-game-details">
          <h2>{game.title}</h2>
          <div className="modal-creator">Por <span className="highlight">RobloxDev</span></div>
          <p className="modal-desc">{game.description}</p>
          
          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-common-play-game-lg btn-primary-md btn-full-width" 
              data-testid="play-button"
              onClick={onPlay}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                <span className="icon-common-play"></span>
              )}
            </button>
            {isLoading && <span className="loading-text">{game.robloxPlaceId ? "Abriendo Roblox..." : "Iniciando servidor..."}</span>}
          </div>
        </div>
      </div>
      <div className="modal-stats-row">
        <div className="stat-item">
          <span className="stat-label">Activos</span>
          <span className="stat-value">{game.players}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Visitas</span>
          <span className="stat-value">1.2M+</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Creado</span>
          <span className="stat-value">2021</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Servidor</span>
          <span className="stat-value">12/16</span>
        </div>
      </div>
    </div>
  </div>
);

// --- NATURAL DISASTER MINI-GAME & ROBLOX CLIENT SIMULATION ---

const NaturalDisasterGame = () => {
  return (
    <div className="nd-game-container">
      <div className="nd-sky">
        <div className="nd-cloud c1">☁️</div>
        <div className="nd-cloud c2">☁️</div>
        <div className="nd-game-title">⚠️ ¡SOBREVIVE A LA LLUVIA DE METEORITOS! ⚠️</div>
      </div>
      
      {/* Simulation of meteors */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className="nd-meteor" style={{
           left: `${Math.random() * 100}%`,
           animationDelay: `${Math.random() * 2}s`,
           animationDuration: `${1 + Math.random() * 2}s`
        }}>☄️</div>
      ))}

      <div className="nd-ocean">
        <div className="nd-island">
          <div className="nd-tower">🏢</div>
          <div className="nd-tree t1">🌳</div>
          <div className="nd-tree t2">🌳</div>
          <div className="nd-player-hint">
            (Mueve tu cursor para esquivar)
          </div>
        </div>
      </div>
    </div>
  );
};

const RobloxClient = ({ game, onLeave }: { game: Game, onLeave: () => void }) => {
  return (
    <div className="roblox-client">
      <div className="client-header">
        <div className="client-menu-icon" onClick={onLeave} title="Salir del juego">
           <div className="roblox-logo-simple"></div>
        </div>
        <div className="client-status">🟢 Conectado: {game.title}</div>
        <div className="client-controls-hint">Tab: Leaderboard | /: Chat</div>
      </div>

      <div className="client-viewport">
        {game.id === 6 ? (
          <NaturalDisasterGame />
        ) : (
          // Generic placeholder for other games
          <div className="generic-game-view" style={{backgroundImage: `url(${game.img})`}}>
            <h1>{game.title}</h1>
            <div className="loader-overlay">Simulando entorno 3D...</div>
          </div>
        )}

        {/* Fake UI Overlay */}
        <div className="leaderboard">
          <div className="lb-header">Jugadores</div>
          <div className="lb-row me">UsuarioPro123</div>
          <div className="lb-row">NoobMaster69</div>
          <div className="lb-row">JellyFan_01</div>
          <div className="lb-row">Guest_9999</div>
        </div>

        <div className="chat-box">
          <div className="chat-messages">
             <p><b>[System]:</b> Bienvenido a {game.title}!</p>
             <p><b>NoobMaster69:</b> Alguien team?</p>
             <p><b>Guest_9999:</b> aaaaa</p>
          </div>
          <div className="chat-input">Presiona '/' para chatear</div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [color, setColor] = useState('#00b06f'); // Roblox Green default
  const [size, setSize] = useState(40);
  const [imageUrl, setImageUrl] = useState('');
  const [movementType, setMovementType] = useState<MovementType>('jelly');
  const [isRainbow, setIsRainbow] = useState(false);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  
  // Game Logic
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isGameLoading, setIsGameLoading] = useState(false);
  const [activeRunningGame, setActiveRunningGame] = useState<Game | null>(null);
  
  // Audio State
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Handle switching defaults when movement type changes
  const handleTypeChange = (newType: MovementType) => {
    setMovementType(newType);
    
    if (newType === 'directional' && imageUrl === '') {
      setImageUrl(DEFAULT_DIRECTIONAL_IMG);
      setSize(50); // Slightly larger for the arrow
    } else if (newType === 'jelly' && imageUrl === DEFAULT_DIRECTIONAL_IMG) {
      setImageUrl(''); // Clear if going back to jelly and we were using the default arrow
      setSize(40);
    }
  };

  // Music Logic
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.log("Audio play failed (interaction required):", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrackIndex]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTrackEnd = () => {
    // Loop to next track
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  };

  const handlePlayGame = () => {
    if (!selectedGame) return;
    
    setIsGameLoading(true);

    if (selectedGame.robloxPlaceId) {
      // Attempt to launch actual Roblox Player via protocol handler
      // This will trigger the browser's "Open Roblox?" prompt if installed
      window.location.href = `roblox://experiences/start?placeId=${selectedGame.robloxPlaceId}`;
      
      // Since we can't reliably detect if the external app launched, 
      // we reset the loading state after a short delay and close the modal.
      setTimeout(() => {
        setIsGameLoading(false);
        setSelectedGame(null); 
      }, 3000);

    } else {
      // Simulation for other demo games
      setTimeout(() => {
        setIsGameLoading(false);
        // Close modal and start game in-app
        setActiveRunningGame(selectedGame);
        setSelectedGame(null);
      }, 2500);
    }
  };

  const handleLeaveGame = () => {
    if(confirm("¿Seguro que quieres salir del juego?")) {
      setActiveRunningGame(null);
    }
  };

  return (
    <>
      <JellyCursor 
        color={color} 
        image={imageUrl} 
        size={size} 
        movementType={movementType}
        isRainbow={isRainbow}
      />
      
      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef}
        src={TRACKS[currentTrackIndex].url}
        onEnded={handleTrackEnd}
      />

      {activeRunningGame ? (
        <RobloxClient game={activeRunningGame} onLeave={handleLeaveGame} />
      ) : (
        <div className="main-layout">
          <TopBar />
          <div className="content-area">
            <Sidebar />
            <div className="games-container">
              <h2>Continuar</h2>
              <div className="games-grid">
                {GAMES.slice(0, 2).map(g => (
                  <GameCard 
                    key={g.id} 
                    title={g.title} 
                    players={g.players} 
                    img={g.img} 
                    onClick={() => setSelectedGame(g)}
                  />
                ))}
              </div>
              
              <h2 style={{ marginTop: '2rem' }}>Recomendados para ti</h2>
              <div className="games-grid">
                {GAMES.map(g => (
                  <GameCard 
                    key={g.id} 
                    title={g.title} 
                    players={g.players} 
                    img={g.img} 
                    onClick={() => setSelectedGame(g)}
                  />
                ))}
              </div>

              <div className="demo-hint">
                <p>Mueve el mouse para ver el efecto. Haz click en <b>Natural Disaster</b> para abrir el juego real.</p>
                <button className="interactive-btn" onClick={togglePlay}>
                  {isPlaying ? 'Pausar BSO' : 'Reproducir BSO'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Modal */}
      {selectedGame && (
        <GameModal 
          game={selectedGame} 
          onClose={() => setSelectedGame(null)} 
          onPlay={handlePlayGame}
          isLoading={isGameLoading}
        />
      )}

      {/* Music Player UI */}
      <div className={`music-player ${isPlaying ? 'playing' : ''}`}>
        <div className="music-icon">🎵</div>
        <div className="music-info">
          <span className="label">Soundtrack</span>
          <span className="track-name">{TRACKS[currentTrackIndex].title}</span>
        </div>
        <button onClick={togglePlay} className="play-btn">
          {isPlaying ? '❚❚' : '▶'}
        </button>
      </div>

      {/* Panel visible inside game too? Maybe better to hide or allow it. Let's allow it so they can test cursor in game */}
      <div className={`controls-panel ${isPanelMinimized ? 'minimized' : ''}`}>
        <div className="panel-header">
          <h3>Personalizar Cursor</h3>
          <button 
            className="minimize-btn" 
            onClick={() => setIsPanelMinimized(!isPanelMinimized)}
            title={isPanelMinimized ? "Expandir" : "Minimizar"}
          >
            {isPanelMinimized ? '+' : '−'}
          </button>
        </div>
        
        {!isPanelMinimized && (
          <div className="panel-content">
            <div className="control-group">
              <label>Movimiento</label>
              <select 
                value={movementType} 
                onChange={(e) => handleTypeChange(e.target.value as MovementType)}
              >
                <option value="jelly">Jelly (Gelatina)</option>
                <option value="directional">Animación (Direccional)</option>
                <option value="8bit">8-Bit (Pocos FPS)</option>
              </select>
            </div>

            <div className="control-group">
              <label>Color (Hex o RGB)</label>
              <div className="color-picker-wrapper">
                <input 
                  type="color" 
                  value={color.startsWith('#') && color.length === 7 ? color : '#ffffff'} 
                  onChange={(e) => {
                    setColor(e.target.value);
                    if (imageUrl === DEFAULT_DIRECTIONAL_IMG) setImageUrl('');
                  }}
                  disabled={isRainbow && !imageUrl}
                />
                <input 
                  type="text" 
                  value={color} 
                  onChange={(e) => {
                    setColor(e.target.value);
                    if (imageUrl === DEFAULT_DIRECTIONAL_IMG) setImageUrl('');
                  }}
                  placeholder="#fff o rgb(255,0,0)"
                />
              </div>
              <div className="rainbow-toggle">
                <label>
                  <input 
                    type="checkbox" 
                    checked={isRainbow} 
                    onChange={(e) => setIsRainbow(e.target.checked)} 
                  />
                  Modo RGB Gamer 🌈
                </label>
              </div>
            </div>

            <div className="control-group">
              <label>Tamaño ({size}px)</label>
              <input 
                type="range" 
                min="20" 
                max="150" 
                value={size} 
                onChange={(e) => setSize(Number(e.target.value))} 
              />
            </div>

            <div className="control-group">
              <label>URL de Imagen</label>
              <input 
                type="text" 
                placeholder="https://..." 
                value={imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)} 
              />
              <div className="preset-images">
                <button onClick={() => setImageUrl(DEFAULT_DIRECTIONAL_IMG)} title="Flecha">↗️</button>
                <button onClick={() => setImageUrl('https://em-content.zobj.net/source/apple/391/red-heart_2764-fe0f.png')} title="Corazón">❤️</button>
                <button onClick={() => setImageUrl('https://em-content.zobj.net/source/apple/391/ghost_1f47b.png')} title="Fantasma">👻</button>
                <button onClick={() => setImageUrl('')} title="Sin imagen">❌</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}