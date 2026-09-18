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
  { id: 'study', label: 'Study', icon: BookOpen, color: '#818cf8' },
  { id: 'homework', label: 'Homework', icon: Code, color: '#60a5fa' },
  { id: 'project', label: 'Projects', icon: Layers, color: '#22d3ee' },
  { id: 'creative', label: 'Creative', icon: Palette, color: '#c084fc' },
  { id: 'break', label: 'Break', icon: Coffee, color: '#34d399' },
  { id: 'routine', label: 'Routine', icon: Clock, color: '#fbbf24' },
];

const PRESETS = [
  {
    name: '📚 Balanced Student',
    slots: [
      { title: 'Math & Physics Problem Sets', category: 'study', startTime: '17:00', endTime: '18:15', durationMinutes: 75 },
      { title: 'Screen-Free Break & Snack', category: 'break', startTime: '18:15', endTime: '18:45', durationMinutes: 30 },
      { title: 'Essay & Reading Homework', category: 'homework', startTime: '18:45', endTime: '20:00', durationMinutes: 75 },
      { title: 'Digital Art & Wind-down', category: 'creative', startTime: '20:30', endTime: '21:30', durationMinutes: 60 }
    ]
  },
  {
    name: '⚡ Exam Sprint',
    slots: [
      { title: 'Deep Subject Revision', category: 'study', startTime: '17:30', endTime: '19:00', durationMinutes: 90 },
      { title: 'Recharge Break', category: 'break', startTime: '19:00', endTime: '19:30', durationMinutes: 30 },
      { title: 'Mock Test & Analysis', category: 'study', startTime: '19:30', endTime: '21:15', durationMinutes: 105 }
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
      await onAddSlot(s);
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

  return (
    <div className="page-wrapper">
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>Daily Schedule Builder</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem' }}>
            Structure your evening into focused time blocks. Start focus mode to guard against distractions.
          </p>
        </div>

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
          <span>Add Time Slot</span>
        </button>
      </div>

      {/* Quick Summary & Presets Bar */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Slots</span>
            <strong style={{ fontSize: '1.1rem' }}>{slots.length} Blocks</strong>
          </div>
          <div>
            <span style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Total Time</span>
            <strong style={{ color: '#818cf8', fontSize: '1.1rem' }}>{Math.floor(totalPlannedMinutes / 60)}h {totalPlannedMinutes % 60}m</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Load Template:</span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(p)}
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            >
              {p.name}
            </button>
          ))}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="slot-time-badge">
                    <div>{slot.startTime}</div>
                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{slot.endTime}</div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.95rem', textDecoration: isCompleted ? 'line-through' : 'none', color: isCompleted ? '#94a3b8' : '#ffffff' }}>
                        {slot.title}
                      </strong>
                      <span 
                        className="category-tag"
                        style={{ background: `${catObj.color}18`, color: catObj.color, border: `1px solid ${catObj.color}40` }}
                      >
                        {catObj.label}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: '#94a3b8' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {!isCompleted && !isInProgress && (
                    <button
                      onClick={() => {
                        onStartFocus(slot);
                        sound.playClick();
                      }}
                      className="btn btn-emerald"
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
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
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                    >
                      <span>Resume ⏱️</span>
                    </button>
                  )}

                  {isCompleted && (
                    <span style={{ color: '#34d399', fontSize: '0.8rem', fontWeight: 700, padding: '4px 10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px' }}>
                      Completed
                    </span>
                  )}

                  {!isCompleted && (
                    <>
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
                    </>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
