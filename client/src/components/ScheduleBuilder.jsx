import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Play, 
  Clock, 
  BookOpen, 
  Coffee, 
  Code, 
  Palette, 
  Check, 
  Sparkles,
  Layers
} from 'lucide-react';
import { sound } from '../services/sound';

const CATEGORIES = [
  { id: 'study', label: 'Study • 学問', icon: BookOpen, color: '#f43f5e' },
  { id: 'homework', label: 'Homework • 課題', icon: Code, color: '#fb923c' },
  { id: 'project', label: 'Project • 創造', icon: Layers, color: '#38bdf8' },
  { id: 'creative', label: 'Creative • 技芸', icon: Palette, color: '#c084fc' },
  { id: 'break', label: 'Zen Break • 休息', icon: Coffee, color: '#34d399' },
  { id: 'routine', label: 'Routine • 日課', icon: Clock, color: '#fbbf24' },
];

const PRESETS = [
  {
    name: '📚 Balanced Scholar',
    slots: [
      { title: 'Math & Physics Problem Sets', category: 'study', startTime: '17:00', endTime: '18:15', durationMinutes: 75 },
      { title: 'Zen Tea Break & Stretch', category: 'break', startTime: '18:15', endTime: '18:45', durationMinutes: 30 },
      { title: 'Deep Work & Essay Homework', category: 'homework', startTime: '18:45', endTime: '20:00', durationMinutes: 75 },
      { title: 'Creative Craft & Wind-down', category: 'creative', startTime: '20:30', endTime: '21:30', durationMinutes: 60 }
    ]
  },
  {
    name: '⚡ Exam Sprint',
    slots: [
      { title: 'Deep Subject Mastery Revision', category: 'study', startTime: '17:30', endTime: '19:00', durationMinutes: 90 },
      { title: 'Sanctuary Recharge', category: 'break', startTime: '19:00', endTime: '19:30', durationMinutes: 30 },
      { title: 'Timed Mock Assessment', category: 'study', startTime: '19:30', endTime: '21:15', durationMinutes: 105 }
    ]
  }
];

export default function ScheduleBuilder({ 
  schedule, 
  onAddSlot, 
  onUpdateSlot, 
  onDeleteSlot, 
  onStartFocus, 
  onNavigate 
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('study');
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('18:00');
  
  // Dynamic user routines/presets
  const [customPresets, setCustomPresets] = useState(() => {
    try {
      const saved = localStorage.getItem('focuspledge_custom_routines');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const computeDuration = (start, end) => {
    if (!start || !end) return 60;
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let diff = (eH * 60 + eM) - (sH * 60 + sM);
    if (diff < 0) diff += 24 * 60;
    return diff || 30;
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    sound.playClick();
    const durationMinutes = computeDuration(startTime, endTime);

    if (editingSlotId) {
      await onUpdateSlot(editingSlotId, {
        title: title.trim(),
        category,
        startTime,
        endTime,
        durationMinutes
      });
      setEditingSlotId(null);
    } else {
      await onAddSlot({
        title: title.trim(),
        category,
        startTime,
        endTime,
        durationMinutes
      });
    }

    setTitle('');
    setShowAddForm(false);
  };

  const handleApplyPreset = async (preset) => {
    sound.playClick();
    for (const s of preset.slots) {
      await onAddSlot({
        title: s.title,
        category: s.category,
        startTime: s.startTime,
        endTime: s.endTime,
        durationMinutes: s.durationMinutes || computeDuration(s.startTime, s.endTime)
      });
    }
  };

  const handleSaveCurrentAsPreset = (e) => {
    e.preventDefault();
    if (!newPresetName.trim() || !schedule?.slots?.length) return;
    sound.playClick();
    const newRoutine = {
      name: `✨ ${newPresetName.trim()}`,
      slots: schedule.slots.map(s => ({
        title: s.title,
        category: s.category,
        startTime: s.startTime,
        endTime: s.endTime,
        durationMinutes: s.durationMinutes
      }))
    };
    const updated = [...customPresets, newRoutine];
    setCustomPresets(updated);
    try {
      localStorage.setItem('focuspledge_custom_routines', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setNewPresetName('');
    setShowSavePresetModal(false);
  };

  const handleDeleteCustomPreset = (presetName, e) => {
    e.stopPropagation();
    sound.playClick();
    const updated = customPresets.filter(p => p.name !== presetName);
    setCustomPresets(updated);
    try {
      localStorage.setItem('focuspledge_custom_routines', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartEdit = (slot) => {
    setEditingSlotId(slot._id);
    setTitle(slot.title);
    setCategory(slot.category || 'study');
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setShowAddForm(true);
    sound.playClick();
  };

  const slots = schedule?.slots || [];
  const totalPlannedMinutes = slots.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const allPresets = [...PRESETS, ...customPresets];

  return (
    <div className="page-wrapper">
      
      {/* Header */}
      <div className="schedule-header-row">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#fda4af', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
            <Sparkles size={13} />
            <span>修練計画 • DAILY FOCUS PROTOCOL</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Daily Focus Protocol</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
            Structure your evening into disciplined time blocks. Launch focus mode to activate the distraction shield.
          </p>
        </div>

        <div className="schedule-header-actions">
          {slots.length > 0 && (
            <button
              onClick={() => {
                setShowSavePresetModal(true);
                sound.playClick();
              }}
              className="btn btn-secondary"
              style={{ fontSize: '0.85rem' }}
            >
              <span>Save As Routine</span>
            </button>
          )}
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingSlotId(null);
              setTitle('');
              sound.playClick();
            }}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Add Focus Block</span>
          </button>
        </div>
      </div>

      {/* Save Routine Modal */}
      {showSavePresetModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '24px', border: '1px solid rgba(244,63,94,0.3)' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Save Routine Template</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginBottom: '16px' }}>
              Save your current {slots.length} time blocks into a dynamic custom routine template.
            </p>
            <form onSubmit={handleSaveCurrentAsPreset}>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. My Evening Coding Mastery"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                autoFocus
                style={{ width: '100%', marginBottom: '16px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowSavePresetModal(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newPresetName.trim()}
                  className="btn btn-primary"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Summary & Presets Bar */}
      <div className="card schedule-summary-bar">
        <div className="summary-metrics-group">
          <div>
            <span style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, display: 'block', letterSpacing: '0.04em' }}>Planned Blocks</span>
            <strong style={{ fontSize: '1.1rem' }}>{slots.length} Blocks</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, display: 'block', letterSpacing: '0.04em' }}>Total Devotion</span>
            <strong style={{ color: '#fda4af', fontSize: '1.1rem' }}>{Math.floor(totalPlannedMinutes / 60)}h {totalPlannedMinutes % 60}m</strong>
          </div>
        </div>

        <div className="summary-presets-group">
          <span className="presets-label">Routines:</span>
          <div className="presets-chips-list">
            {allPresets.map((p, idx) => (
              <div key={idx} className="preset-chip-wrapper">
                <button
                  onClick={() => handleApplyPreset(p)}
                  className="btn btn-secondary preset-chip-btn"
                  title={`Load ${p.slots.length} slots`}
                >
                  {p.name}
                </button>
                {customPresets.some(cp => cp.name === p.name) && (
                  <button
                    onClick={(e) => handleDeleteCustomPreset(p.name, e)}
                    className="preset-delete-btn"
                    title="Delete custom routine"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Slots List */}
      <div className="slot-list">
        {slots.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '16px' }}>
              No time slots planned yet. Click "Add Time Slot" or load a preset above.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary"
            >
              Add First Slot
            </button>
          </div>
        ) : (
          slots.map((slot) => {
            const catObj = CATEGORIES.find(c => c.id === slot.category) || CATEGORIES[0];
            const isCompleted = slot.status === 'completed';
            const isInProgress = slot.status === 'in_progress';

            return (
              <div 
                key={slot._id}
                className={`slot-item ${isInProgress ? 'in-progress' : ''} ${isCompleted ? 'completed' : ''}`}
              >
                
                {/* Left info */}
                <div className="slot-left-info">
                  <div className="slot-time-badge">
                    <div>{slot.startTime}</div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{slot.endTime}</div>
                  </div>

                  <div className="slot-details">
                    <div className="slot-title-row">
                      <strong className="slot-title-text" style={{ textDecoration: isCompleted ? 'line-through' : 'none', color: isCompleted ? '#94a3b8' : '#ffffff' }}>
                        {slot.title}
                      </strong>
                      <span 
                        className="category-tag"
                        style={{ background: `${catObj.color}18`, color: catObj.color, border: `1px solid ${catObj.color}40` }}
                      >
                        {catObj.label}
                      </span>
                    </div>

                    <div className="slot-meta-row">
                      <span>⏱️ {slot.durationMinutes || 60}m</span>
                      {isCompleted && <span style={{ color: '#34d399', fontWeight: 700 }}>✓ Earned +{slot.creditsEarned || 10} pts</span>}
                      {isInProgress && <span style={{ color: '#f59e0b', fontWeight: 700 }}>🔥 Active Now</span>}
                      {slot.distractionsAttempted > 0 && (
                        <span style={{ color: '#fb7185', fontWeight: 600 }}>⚠️ {slot.distractionsAttempted} penalty applied</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="slot-actions">
                  {!isCompleted && !isInProgress && (
                    <button
                      onClick={() => {
                        onStartFocus(slot);
                        sound.playClick();
                      }}
                      className="btn btn-emerald slot-main-action-btn"
                    >
                      <Play size={14} fill="currentColor" />
                      <span>Start Focus</span>
                    </button>
                  )}

                  {isInProgress && (
                    <button
                      onClick={() => {
                        onNavigate('focus');
                        sound.playClick();
                      }}
                      className="btn btn-primary slot-main-action-btn"
                    >
                      <span>Resume ⏱️</span>
                    </button>
                  )}

                  {isCompleted && (
                    <span className="slot-completed-pill">
                      Completed ✓
                    </span>
                  )}

                  {!isCompleted && (
                    <div className="slot-secondary-actions">
                      <button
                        onClick={() => handleStartEdit(slot)}
                        className="icon-btn"
                        title="Edit slot"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => {
                          onDeleteSlot(slot._id);
                          sound.playClick();
                        }}
                        className="icon-btn"
                        title="Delete slot"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddForm && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.15rem' }}>{editingSlotId ? 'Edit Focus Slot' : 'Add Time Slot'}</h3>
              <button onClick={() => setShowAddForm(false)} style={{ color: '#94a3b8' }}>✕</button>
            </div>

            <form onSubmit={handleSaveSlot} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px' }}>
                  Task Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Physics Ch 4 Problem Set, Web App Coding..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%' }}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px' }}>
                  Category
                </label>
                <div className="category-picker-grid">
                  {CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`btn ${category === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '8px 10px', fontSize: '0.8rem' }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="time-picker-grid">
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px' }}>
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8', marginBottom: '6px' }}>
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingSlotId ? 'Save Changes' : 'Commit Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
