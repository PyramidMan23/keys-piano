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
  }

  async connect() {
    if (!navigator.requestMIDIAccess) {
      this._status('Web MIDI not supported in this browser. Use Chrome or Edge.', false);
      return false;
    }
    try {
      this.access = await navigator.requestMIDIAccess({ sysex: false });
    } catch {
      this._status('MIDI permission denied. Allow MIDI access and retry.', false);
      return false;
    }
    this.access.onstatechange = () => this._bind();
    this._bind();
    return true;
  }

  _bind() {
    let bound = 0;
    for (const input of this.access.inputs.values()) {
      input.onmidimessage = (e) => this._message(e);
      this.deviceName = input.name;
      bound++;
    }
    if (bound > 0) this._status(`Connected: ${this.deviceName}`, true);
    else this._status('No MIDI keyboard found. Plug in your MIDI keyboard by USB and switch it on.', false);
  }

  _message(e) {
    const [status, note, velocity] = e.data;
    const cmd = status & 0xf0;
    if (cmd === 0x90 && velocity > 0) this.onNote?.(note, velocity, true);
    else if (cmd === 0x80 || (cmd === 0x90 && velocity === 0)) this.onNote?.(note, velocity, false);
    else if (cmd === 0xb0) this.onControl?.(note, velocity); // control change: (cc, value)
  }

  _status(text, connected) { this.onStatus?.(text, connected); }
}
