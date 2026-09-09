// Web MIDI input. The P-45 is class-compliant USB MIDI: it appears as an
// input port (usually named "Digital Piano"); we listen to note-on/off.
// Silent scoring per council: we never synthesize audio for played notes.

export class MidiInput {
  constructor() {
    this.onNote = null;      // (midi, velocity, isDown)
    this.onControl = null;   // (cc, value), CC64 >= 64 means sustain down
    this.onStatus = null;    // (statusText, connected)
    this.access = null;
    this.deviceName = null;
    this.bound = new Map();
    this.connectionRequest = 0;
    this.onKeyTest = null;
  }

  async connect() {
    const request = ++this.connectionRequest;
    if (!navigator.requestMIDIAccess) {
      this._unbindAll();
      this._status('Web MIDI not supported in this browser. Use Chrome or Edge.', false);
      return false;
    }
    try {
      const access = await navigator.requestMIDIAccess({ sysex: false });
      if (request !== this.connectionRequest) return false;
      if (this.access && this.access !== access) this.access.onstatechange = null;
      this.access = access;
    } catch {
      if (request !== this.connectionRequest) return false;
      this._unbindAll();
      this._status('MIDI permission denied. Allow MIDI access and retry.', false);
      return false;
    }
    this.access.onstatechange = () => this._bind();
    this._bind();
    return true;
  }

  _unbindAll() {
    const held = new Set([...this.bound.values()].flatMap((notes) => [...notes]));
    for (const input of this.bound.keys()) input.onmidimessage = null;
    this.bound.clear();
    if (this.access) this.access.onstatechange = null;
    this.access = null; this.deviceName = null;
    for (const note of held) this.onNote?.(note, 0, false);
  }

  _bind() {
    const inputs = [...this.access.inputs.values()].filter((p) => p.state === 'connected');
    for (const [input, held] of this.bound) {
      if (inputs.includes(input)) continue;
      input.onmidimessage = null;
      this.bound.delete(input);
      for (const note of held) if (![...this.bound.values()].some((notes) => notes.has(note))) this.onNote?.(note, 0, false);
    }
    for (const input of inputs) {
      if (!this.bound.has(input)) this.bound.set(input, new Set());
      input.onmidimessage = (e) => {
        if (this.bound.has(input) && input.state === 'connected') this._message(e, input);
      };
    }
    this.deviceName = inputs.map((p) => p.name || 'Keyboard').join(', ') || null;
    if (inputs.length) this._status(`Connected: ${this.deviceName}`, true);
    else this._status('No MIDI keyboard found. Plug in your MIDI keyboard by USB and switch it on.', false);
  }

  _message(e, input = null) {
    if (!e?.data || e.data.length < 3) return;
    const [status, note, velocity] = e.data;
    if (![status, note, velocity].every(Number.isInteger) || note < 0 || note > 127 || velocity < 0 || velocity > 127) return;
    const cmd = status & 0xf0;
    if (cmd === 0x90 && velocity > 0) {
      const alreadyDown = input && [...this.bound.values()].some((notes) => notes.has(note));
      this.bound.get(input)?.add(note);
      this.onKeyTest?.(note, input?.name ?? this.deviceName);
      if (!alreadyDown) this.onNote?.(note, velocity, true);
    } else if (cmd === 0x80 || (cmd === 0x90 && velocity === 0)) {
      this.bound.get(input)?.delete(note);
      if (!input || ![...this.bound.values()].some((notes) => notes.has(note))) this.onNote?.(note, velocity, false);
    }
    else if (cmd === 0xb0) this.onControl?.(note, velocity); // control change: (cc, value)
  }

  _status(text, connected) { this.onStatus?.(text, connected); }
}
